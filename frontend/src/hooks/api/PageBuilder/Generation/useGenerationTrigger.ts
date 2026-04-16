/**
 * Hook to trigger async page generation with credit validation.
 * 
 * Uses the credit-based pricing system where each generation costs 10 credits.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PageGenerationService, 
  GeneratePageRequest,
  GeneratePageResponse 
} from '@/client';
import { useSnackBarContext } from '@/context/SnackBarContext';
import { useNavigate } from 'react-router-dom';
import { createGenerationError, ERROR_CODES } from '@/streaming/types/generation';
import { setBillingReturnOrigin } from '@/utils/billingReturnStorage';
import type { GenerationError } from '@/streaming/types/generation';

/**
 * Hook to trigger page generation
 * 
 * @example
 * const { mutateAsync, isPending, error } = useGenerationTrigger();
 * 
 * const result = await mutateAsync({
 *   business_name: "Joe's HVAC",
 *   website_intention: "generate_leads",
 *   website_tone: "professional"
 * });
 */
export const useGenerationTrigger = () => {
  const { createSnackBar } = useSnackBarContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation<GeneratePageResponse, any, GeneratePageRequest>({
    mutationFn: async (request: GeneratePageRequest) => {
      try {
        const response = await PageGenerationService.triggerPageGenerationApiGenerationsTriggerPost(
          request
        );
        
        return response;
      } catch (error: any) {
        // Handle insufficient credits specifically
        if (error.status === 403) {
          throw createGenerationError(error);
        }
        
        // Handle validation errors
        if (error.status === 400) {
          throw createGenerationError(error);
        }
        
        // Handle other errors
        throw createGenerationError(error, 'Failed to start generation');
      }
    },
    
    onSuccess: (data) => {
      // Invalidate relevant queries including credits
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['user-websites'] });
      queryClient.invalidateQueries({ queryKey: ['creditsBalance'] });
      queryClient.invalidateQueries({ queryKey: ['creditsInfo'] });
      queryClient.invalidateQueries({ queryKey: ['creditTransactions'] });
      // Refresh latest generation list so dashboard shows the current run immediately
      queryClient.invalidateQueries({ queryKey: ['generation-configs'] });
      
      // Success notification
      createSnackBar({
        content: 'Website generation started successfully!',
        severity: 'success',
        autoHide: true
      });
    },
    
    onError: (error: GenerationError) => {
      console.error('Generation trigger error:', error);
      
      // Handle insufficient credits - navigate to billing
      if (error.code === ERROR_CODES.INSUFFICIENT_CREDITS || 
          error.code === ERROR_CODES.QUOTA_EXCEEDED) {
        createSnackBar({
          content: error.message,
          severity: 'error',
          autoHide: false
        });
        
        // Set return origin so user is redirected back after payment (plan: billingReturnOrigin)
        setBillingReturnOrigin('/create-site', { step: 'color-palette-selection' });
        
        // Navigate to billing after a short delay
        // Note: pendingCreateSiteState (credits-blocked) is set by the caller (CreateSite.tsx)
        setTimeout(() => {
          navigate('/dashboard/billing');
        }, 2000);
        
        return;
      }
      
      // Handle other errors - show snackbar
      createSnackBar({
        content: error.message,
        severity: 'error',
        autoHide: true
      });
    }
  });
};