import { useQuery } from '@tanstack/react-query';
import { PublishedWebsiteAnalyticsService } from '@/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';

// Helper type for the date range
interface AnalyticsDateRange {
  start: string | null; // YYYY-MM-DD
  end: string | null;   // YYYY-MM-DD
}

/**
 * Hook to fetch the main overview metrics (Traffic, Unique Visitors, Trends)
 */
export const usePublishedWebsiteOverview = (
  websiteId: string | undefined,
  dateRange: AnalyticsDateRange,
  enabled: boolean = true
) => {
  const { handleApiError } = useErrorHandler();

  return useQuery({
    queryKey: ['published-website-analytics', 'overview', websiteId, dateRange],
    queryFn: async () => {
      if (!websiteId) throw new Error("Website ID is required");

      try {
        // Updated to use the generated LONG method name
        return await PublishedWebsiteAnalyticsService.getWebsiteOverviewApiPublishedWebsiteAnalyticsWebsiteWebsiteIdOverviewGet(
          websiteId,
          dateRange.start || undefined,
          dateRange.end || undefined,
        );
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    enabled: !!websiteId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

/**
 * Hook to fetch Traffic Sources
 * (Optional - in case you want to expand the UI later)
 */
export const usePublishedWebsiteSources = (
  websiteId: string | undefined,
  dateRange: AnalyticsDateRange,
  enabled: boolean = true
) => {
  const { handleApiError } = useErrorHandler();

  return useQuery({
    queryKey: ['published-website-analytics', 'sources', websiteId, dateRange],
    queryFn: async () => {
      if (!websiteId) throw new Error("Website ID is required");

      try {
        return await PublishedWebsiteAnalyticsService.getTrafficSourcesApiPublishedWebsiteAnalyticsWebsiteWebsiteIdSourcesGet(
          websiteId,
          dateRange.start || undefined,
          dateRange.end || undefined
        );
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    enabled: !!websiteId && enabled,
  });
};