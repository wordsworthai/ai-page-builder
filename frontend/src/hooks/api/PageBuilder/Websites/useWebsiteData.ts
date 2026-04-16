/**
 * Hook to fetch user's website and homepage data.
 * 
 * Uses existing publishing endpoints instead of creating new ones.
 * 
 * FIXED: Uses generated client types directly.
 */
import { useQuery } from '@tanstack/react-query';
import { PublishingService, WebsiteRead, WebsitePageRead } from '@/client';
import { useCurrentUser } from '@/hooks/api/Shared/Auth/useCurrentUser';

/**
 * Combined website + homepage data for UI
 */
export interface UserWebsiteData {
  website: WebsiteRead;
  homepage: WebsitePageRead;
}

/**
 * Hook to get user's website and homepage data
 * 
 * Returns null if user has no website yet.
 * 
 * @example
 * const { data, isLoading, isError } = useWebsiteData();
 * 
 * if (data) {
 *   console.log('Website:', data.website);
 *   console.log('Homepage:', data.homepage);
 * }
 */
export const useWebsiteData = () => {
  const { data: currentUser } = useCurrentUser();

  return useQuery<UserWebsiteData | null>({
    queryKey: ['user-websites', currentUser?.user_id],
    
    queryFn: async () => {
      try {
        // Step 1: Get user's websites
        const websitesResponse = await PublishingService.listUserWebsitesApiPublishingWebsitesGet();
        
        if (!websitesResponse.websites || websitesResponse.websites.length === 0) {
          // User has no websites yet
          return null;
        }
        
        // Get first (primary) website
        const website = websitesResponse.websites[0];
        
        // Step 2: Get pages for this website
        // FIXED: Pass website_id as positional argument
        const pagesResponse = await PublishingService.listWebsitePagesApiPublishingWebsitesWebsiteIdPagesGet(
          website.website_id
        );
        
        if (!pagesResponse.pages || pagesResponse.pages.length === 0) {
          // Website exists but no pages (shouldn't happen)
          console.warn('Website exists but has no pages');
          return null;
        }
        
        // Find homepage (path = "/")
        const homepage = pagesResponse.pages.find(page => page.page_path === '/');
        
        if (!homepage) {
          // No homepage found (shouldn't happen)
          console.warn('No homepage found for website');
          return null;
        }
        
        // Return combined data
        return {
          website,
          homepage
        };
        
      } catch (error: any) {
        // Handle 404 gracefully (no website exists)
        if (error.status === 404) {
          return null;
        }
        
        // Handle 403 (not authorized)
        if (error.status === 403) {
          console.error('Not authorized to access website data');
          return null;
        }
        
        // Re-throw other errors
        throw error;
      }
    },
    
    enabled: !!currentUser,
    
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
    
    // Retry once on failure
    retry: 1,
    
    // Refetch on window focus (to catch updates from other tabs)
    refetchOnWindowFocus: true
  });
};