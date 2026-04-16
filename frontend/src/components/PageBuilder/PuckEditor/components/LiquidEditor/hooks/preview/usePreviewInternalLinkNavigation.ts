import React, { useCallback, useMemo, useState } from 'react';
import { useEditorDataProvider } from '../../utils';
import { useSnackBarContext } from '@/context/SnackBarContext';
import type { WebsitePageRead_Output } from '@/client/models/WebsitePageRead_Output';

const DEFAULT_STORE_URL = 'https://www.shopify.com';
const DEFAULT_TEMPLATE_JSON_TYPE = 'real_population';

export interface PreviewOverrideData {
  config: any;
  data: any;
  path?: string;
}

interface UsePreviewInternalLinkNavigationParams {
  allPages: WebsitePageRead_Output[];
  currentPageId?: string;
}

export interface UsePreviewInternalLinkNavigationReturn {
  previewOverrideData: PreviewOverrideData | null;
  handlePreviewInternalLinkClick: (path: string) => Promise<void>;
  clearPreviewOverride: () => void;
}

/**
 * Hook to manage preview mode internal link navigation.
 * When user clicks links like /contact-us or /services in preview mode,
 * fetches the target page's template data and displays it in the preview.
 */
export function usePreviewInternalLinkNavigation({
  allPages,
  currentPageId,
}: UsePreviewInternalLinkNavigationParams): UsePreviewInternalLinkNavigationReturn {
  const { fetchTemplateData } = useEditorDataProvider();
  const { createSnackBar } = useSnackBarContext();

  const [previewOverrideData, setPreviewOverrideData] =
    useState<PreviewOverrideData | null>(null);

  const currentPage = useMemo(
    () => allPages.find((p) => p.page_id === currentPageId),
    [allPages, currentPageId]
  );

  const currentPreviewPath =
    previewOverrideData?.path ?? currentPage?.page_path ?? '/';

  const handlePreviewInternalLinkClick = useCallback(
    async (path: string) => {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      if (normalizedPath === currentPreviewPath) {
        return;
      }
      if (normalizedPath === (currentPage?.page_path ?? '/')) {
        setPreviewOverrideData(null);
        return;
      }
      const page = allPages.find(
        (p) => p.page_path === normalizedPath || p.page_path === path
      );
      if (!page) {
        createSnackBar({
          content: 'Page not found in preview.',
          severity: 'warning',
          autoHide: true,
        });
        return;
      }
      if (!page.current_generation_id) {
        createSnackBar({
          content: 'Page not yet generated. Switch to edit mode to create it.',
          severity: 'warning',
          autoHide: true,
        });
        return;
      }
      try {
        const { config, data } = await fetchTemplateData(
          page.current_generation_id,
          DEFAULT_STORE_URL,
          DEFAULT_TEMPLATE_JSON_TYPE
        );
        setPreviewOverrideData({ config, data, path: page.page_path });
      } catch (err) {
        console.error('Failed to load page for preview:', err);
        createSnackBar({
          content: 'Failed to load page for preview.',
          severity: 'error',
          autoHide: true,
        });
      }
    },
    [
      allPages,
      currentPage,
      currentPreviewPath,
      fetchTemplateData,
      createSnackBar,
    ]
  );

  const clearPreviewOverride = useCallback(() => {
    setPreviewOverrideData(null);
  }, []);

  return {
    previewOverrideData,
    handlePreviewInternalLinkClick,
    clearPreviewOverride,
  };
}
