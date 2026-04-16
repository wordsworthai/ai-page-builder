/**
 * Hook to fetch all pages for the user's primary website.
 *
 * Depends on useWebsiteData to obtain the website_id, then fetches all pages
 * (homepage + additional pages) via the publishing pages endpoint.
 */
import { useQuery } from '@tanstack/react-query';
import { PublishingService } from '@/client';
import type { WebsitePageRead_Output } from '@/client/models/WebsitePageRead_Output';
import { useWebsiteData } from './useWebsiteData';

export type { WebsitePageRead_Output };

export const useWebsitePages = () => {
  const { data: websiteData } = useWebsiteData();
  const websiteId = websiteData?.website?.website_id;

  return useQuery<WebsitePageRead_Output[]>({
    queryKey: ['website-pages', websiteId],

    queryFn: async () => {
      if (!websiteId) return [];
      const response = await PublishingService.listWebsitePagesApiPublishingWebsitesWebsiteIdPagesGet(websiteId);
      return response.pages ?? [];
    },

    enabled: !!websiteId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
  });
};
