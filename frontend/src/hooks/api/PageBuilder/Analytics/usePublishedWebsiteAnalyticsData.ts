import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { useWebsites } from '@/hooks/api/PageBuilder/Websites/usePublishing';
import { usePublishedWebsiteOverview } from './usePublishedWebsiteAnalytics';

/**
 * Custom hook that encapsulates common logic for fetching published website analytics data.
 * 
 * This hook:
 * - Fetches user's websites
 * - Automatically selects the first website as default
 * - Creates a date range for the last 30 days
 * - Fetches analytics data for the selected website
 * 
 * @returns Object containing analytics data, loading states, websites, and selected website ID
 */
export const usePublishedWebsiteAnalyticsData = () => {
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>('');
  
  // Default date range: Last 30 days (fixed)
  const dateRange = {
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  };

  // 1. Fetch User's Websites
  const { data: websitesResponse, isLoading: isLoadingWebsites } = useWebsites();
  const websites = websitesResponse?.websites || [];

  // 2. Set Default Website (using website_id)
  useEffect(() => {
    if (websites.length > 0 && !selectedWebsiteId) {
      setSelectedWebsiteId(websites[0].website_id);
    }
  }, [websites, selectedWebsiteId]);

  // 3. Fetch Analytics
  const { data: analyticsData, isLoading: isLoadingAnalytics } = usePublishedWebsiteOverview(
    selectedWebsiteId,
    dateRange,
    !!selectedWebsiteId
  );

  return {
    analyticsData,
    isLoadingAnalytics,
    isLoadingWebsites,
    selectedWebsiteId,
    setSelectedWebsiteId,
    websites,
    dateRange
  };
};

