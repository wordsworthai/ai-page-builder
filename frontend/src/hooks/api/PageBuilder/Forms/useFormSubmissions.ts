/**
 * React Query hooks for form submissions API
 */
import { useQuery } from '@tanstack/react-query';
import { FormsService } from '@/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';

/**
 * Hook to fetch all form submissions for the current user's business
 */
export function useFormSubmissions() {
  const { handleApiError } = useErrorHandler();

  return useQuery({
    queryKey: ['formSubmissions'],
    queryFn: async () => {
      try {
        const response = await FormsService.getFormSubmissionsApiFormsFormSubmissionsGet();
        return response;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    refetchOnWindowFocus: false,
    retry: 1,
  });
}