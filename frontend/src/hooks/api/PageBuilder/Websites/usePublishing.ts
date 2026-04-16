import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OpenAPI } from '@/client';
import { useSnackBarContext } from '@/context/SnackBarContext';
import type { PageHtmlEntry } from '@/components/PageBuilder/Dashboard/PublishSiteContainer';

// ===== Types =====

interface Website {
  website_id: string;
  business_id: string;
  subdomain: string;
  website_name: string;
  favicon_url: string | null;
  is_published: boolean;
  published_at: string | null;
  last_published_at: string | null;
  created_at: string;
}

interface WebsitePage {
  page_id: string;
  website_id: string;
  page_path: string;
  page_title: string;
  description: string | null;
  is_published: boolean;
  published_at: string | null;
  last_published_at: string | null;
  last_s3_path: string | null;
  last_cloudfront_url: string | null;
  last_invalidation_id: string | null;
  publish_count: number;
  last_edited_at: string | null;
  created_at: string;
}

interface HomepageInfo {
  page_id: string;
  page_title: string;
  description: string | null;
  last_published_at: string | null;
  publish_count: number;
}

interface ExistingWebsiteInfo {
  website_id: string;
  subdomain: string;
  website_name: string;
  is_published: boolean;
  published_at: string | null;
  live_url: string | null;
  homepage: HomepageInfo;
}

interface EditorDefaultsResponse {
  business_name: string;
  suggested_subdomain: string;
  existing_website: ExistingWebsiteInfo | null;
}

interface PublishFromEditorResponse {
  success: boolean;
  message: string;
  website_id: string;
  page_id: string;
  subdomain: string;
  cloudfront_url: string;
  s3_path: string;
  invalidation_id: string | null;
  is_new_website: boolean;
  subdomain_changed: boolean;
  pages_published: number;
}

interface SubdomainCheckResponse {
  available: boolean;
  subdomain: string;
  message: string;
}

// ===== Hooks =====

/**
 * Hook to get editor publish modal defaults
 * Fetches business name, suggested subdomain, and existing website info
 */
export const useEditorDefaults = () => {
  return useQuery<EditorDefaultsResponse>({
    queryKey: ['editor-defaults'],
    queryFn: async () => {
      const response = await fetch(`${OpenAPI.BASE}/api/publishing/editor-defaults`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch editor defaults');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

/**
 * Hook to publish from editor
 * Handles both creation and updates, including subdomain changes
 */
export const usePublishFromEditor = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation<
    PublishFromEditorResponse,
    Error,
    {
      subdomain: string;
      websiteTitle: string;
      htmlFile: File;
      description?: string;
      faviconFile?: File;
      pageHtmls?: PageHtmlEntry[];
    }
  >({
    mutationFn: async ({ subdomain, websiteTitle, htmlFile, description, faviconFile, pageHtmls }) => {
      const formData = new FormData();
      formData.append('subdomain', subdomain);
      formData.append('website_title', websiteTitle);
      formData.append('html_file', htmlFile);

      if (description) {
        formData.append('description', description);
      }

      if (faviconFile) {
        formData.append('favicon_file', faviconFile);
      }

      // Multi-page publishing: send page routes and individual HTML files
      if (pageHtmls && pageHtmls.length >= 1) {
        formData.append('page_routes', JSON.stringify(pageHtmls.map((p) => p.route)));
        for (let i = 0; i < pageHtmls.length; i++) {
          const entry = pageHtmls[i];
          const blob = new Blob([entry.html], { type: 'text/html' });
          const file = new File([blob], `page_${i}.html`, { type: 'text/html' });
          formData.append('page_html_files', file);
        }
        formData.append('page_titles', JSON.stringify(pageHtmls.map((p) => p.pageTitle)));
      }

      const response = await fetch(`${OpenAPI.BASE}/api/publishing/publish-from-editor`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to publish website');
      }

      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['editor-defaults'] });
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      queryClient.invalidateQueries({ queryKey: ['user-websites'] });
      queryClient.invalidateQueries({ queryKey: ['website-pages'] });

      // Success message
      let message = data.message;
      if (data.is_new_website) {
        message = `🎉 Website published successfully! Live at: ${data.cloudfront_url}`;
      } else if (data.subdomain_changed) {
        message = `✅ Website moved to ${data.subdomain} and republished!`;
      } else {
        message = `✅ Website updated successfully! ${data.cloudfront_url}`;
      }

      createSnackBar({
        content: message,
        severity: 'success',
        autoHide: true,
      });
    },
    onError: (error) => {
      createSnackBar({
        content: error.message,
        severity: 'error',
        autoHide: true,
      });
    },
  });
};

/**
 * Hook to check subdomain availability
 */
export const useCheckSubdomain = () => {
  const { createSnackBar } = useSnackBarContext();

  return useMutation<SubdomainCheckResponse, Error, string>({
    mutationFn: async (subdomain: string) => {
      const response = await fetch(`${OpenAPI.BASE}/api/publishing/check-subdomain`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subdomain }),
      });

      if (!response.ok) {
        throw new Error('Failed to check subdomain');
      }

      return response.json();
    },
    onError: (error) => {
      createSnackBar({
        content: error.message,
        severity: 'error',
        autoHide: true,
      });
    },
  });
};

/**
 * Hook to get all websites for current user
 */
export const useWebsites = () => {
  return useQuery<{ websites: Website[]; total: number }>({
    queryKey: ['websites'],
    queryFn: async () => {
      const response = await fetch(`${OpenAPI.BASE}/api/publishing/websites`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch websites');
      }

      return response.json();
    },
  });
};

/**
 * Hook to get pages for a specific website
 */
export const useWebsitePages = (websiteId: string | null) => {
  return useQuery<{ pages: WebsitePage[]; total: number }>({
    queryKey: ['website-pages', websiteId],
    queryFn: async () => {
      if (!websiteId) {
        return { pages: [], total: 0 };
      }

      const response = await fetch(
        `${OpenAPI.BASE}/api/publishing/websites/${websiteId}/pages`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch pages');
      }

      return response.json();
    },
    enabled: !!websiteId,
  });
};