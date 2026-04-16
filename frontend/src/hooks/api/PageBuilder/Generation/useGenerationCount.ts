/**
 * Hook to fetch the count of generations for the current user's business.
 */
import { useQuery } from '@tanstack/react-query';
import { PageGenerationService } from '@/client';
import { useCurrentUser } from '@/hooks/api/Shared/Auth/useCurrentUser';

export interface GenerationCountData {
  count: number;
  business_id: string;
}

/**
 * Hook to get the count of full page generations for the current user's business
 * 
 * @example
 * const { data, isLoading, isError } = useGenerationCount();
 * 
 * if (data) {
 *   console.log('Generation count:', data.count);
 * }
 */
export const useGenerationCount = () => {
  const { data: currentUser } = useCurrentUser();

  return useQuery<GenerationCountData>({
    queryKey: ['generation-count', currentUser?.user_id],
    
    queryFn: async () => {
      const response = await PageGenerationService.getGenerationCountApiGenerationsCountGet();
      return response as GenerationCountData;
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
