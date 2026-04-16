import { useState, useCallback } from 'react';
import { buildCleanHtml } from '../../utils/export/exportCleanHtml';
import type { PublishHook } from '../../Editor.types';
import type { PageHtmlEntry } from '@/components/PageBuilder/Dashboard/PublishSiteContainer';
import type { WebsitePageRead_Output } from '@/client/models/WebsitePageRead_Output';

interface UsePublishParams {
  config: any;
  onDataUpdate?: (newData: any) => void;
  getUpdateTemplateData?: () => ((updates: { currentData: any }, source?: string) => void) | undefined;
  /** All pages for the current website (from useWebsitePages) */
  allPages?: WebsitePageRead_Output[];
  /** The page_id of the page currently being edited */
  currentPageId?: string;
  /** Function to fetch template config+data for a generation version */
  fetchTemplateData?: (generationVersionId: string, storeUrl: string) => Promise<{ config: any; data: any }>;
}

/**
 * Custom hook for managing publish dialog and HTML generation.
 * Builds HTML for ALL website pages (current page from editor, others via fetchTemplateData).
 */
export function usePublish({
  config,
  onDataUpdate,
  getUpdateTemplateData,
  allPages = [],
  currentPageId,
  fetchTemplateData,
}: UsePublishParams): PublishHook & { pageHtmls: PageHtmlEntry[] } {
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [pageHtmls, setPageHtmls] = useState<PageHtmlEntry[]>([]);
  const [isGeneratingHtml, setIsGeneratingHtml] = useState(false);

  const onPublishClick = useCallback(
    async (newData: any) => {
      // Use the latest config from closure
      const latestConfig = config;
      if (!latestConfig) {
        console.error('Cannot publish: config not loaded');
        return;
      }

      setIsGeneratingHtml(true);

      try {
        // Build HTML for the current page being edited
        const currentPageHtml = await buildCleanHtml(latestConfig, newData, {
          title: 'My Website',
          bodyCss: undefined,
          containerClass: 'wwai_container',
        });

        setGeneratedHtml(currentPageHtml);

        // Update current data if callback provided
        if (onDataUpdate) {
          onDataUpdate(newData);
        } else if (getUpdateTemplateData) {
          const updateTemplateData = getUpdateTemplateData();
          if (updateTemplateData) {
            updateTemplateData({ currentData: newData }, 'publish');
          }
        }

        // Build HTML for ALL other pages that have current_generation_id
        const results: PageHtmlEntry[] = [];

        // Determine the current page's path
        const currentPage = currentPageId
          ? allPages.find((p) => p.page_id === currentPageId)
          : null;
        const currentPagePath = currentPage?.page_path ?? '/';

        // Add the current page (built from editor state)
        results.push({
          route: currentPagePath,
          html: currentPageHtml,
          pageTitle: currentPage?.page_title ?? 'Home',
        });

        // Build HTML for other pages with current_generation_id
        const otherPages = allPages.filter(
          (p) => p.current_generation_id && p.page_id !== currentPageId
        );

        if (otherPages.length > 0 && fetchTemplateData) {
          for (const page of otherPages) {
            try {
              const { config: pageConfig, data: pageData } = await fetchTemplateData(
                page.current_generation_id!,
                'https://www.shopify.com'
              );
              const html = await buildCleanHtml(pageConfig, pageData, {
                title: page.page_title,
                containerClass: 'wwai_container',
              });
              results.push({
                route: page.page_path,
                html,
                pageTitle: page.page_title,
              });
            } catch (err) {
              console.error(`Failed to build HTML for page ${page.page_path}:`, err);
            }
          }
        }

        console.log(`[Publish] Built HTML for ${results.length} page(s):`, results.map(r => r.route));
        setPageHtmls(results);
        setPublishDialogOpen(true);
      } catch (error) {
        console.error('Failed to generate HTML:', error);
        alert('Failed to generate HTML. Please try again.');
      } finally {
        setIsGeneratingHtml(false);
      }
    },
    [config, onDataUpdate, getUpdateTemplateData, isGeneratingHtml, allPages, currentPageId, fetchTemplateData]
  );

  const onClosePublishDialog = useCallback(() => {
    setPublishDialogOpen(false);
    setGeneratedHtml(null);
    setPageHtmls([]);
  }, []);

  const openPublishDialogWithPendingData = useCallback(() => {
    try {
      const raw = localStorage.getItem('pending_publish_data');
      if (raw) {
        const data = JSON.parse(raw);
        const age = Date.now() - (data.timestamp || 0);
        if (age <= 60 * 60 * 1000 && data.htmlContentBase64) {
          const htmlString = atob(data.htmlContentBase64);
          setGeneratedHtml(htmlString);
        }
      }
    } catch {
      // open dialog with no HTML
    }
    setPublishDialogOpen(true);
  }, []);

  return {
    publishState: {
      publishDialogOpen,
      generatedHtml,
      isGeneratingHtml,
    },
    publishHandlers: {
      onPublishClick,
      onClosePublishDialog,
      openPublishDialogWithPendingData,
    },
    pageHtmls,
  };
}
