/**
 * Hook to trigger partial autopop flow (color theme regeneration) with credit validation.
 * 
 * Uses the credit-based pricing system where color theme regeneration costs 5 credits.
 * Returns immediately with new generation_version_id (async), similar to useGenerationTrigger.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  GeneratePageResponse 
} from '@/client';
import { OpenAPI } from '@/client';
import { useSnackBarContext } from '@/context/SnackBarContext';
import { createGenerationError, ERROR_CODES } from '@/streaming/types/generation';
import { setBillingReturnOrigin } from '@/utils/billingReturnStorage';
import type { GenerationError } from '@/streaming/types/generation';

export interface PartialAutopopRequest {
  generationVersionId: string;
  palette_id: string;
  palette: Record<string, any>;
  font_family?: string;
}

/**
 * Hook to trigger partial autopop (color theme regeneration)
 * 
 * @example
 * const { mutateAsync, isPending, error } = usePartialAutopop();
 * 
 * const result = await mutateAsync({
 *   generationVersionId: "123e4567-e89b-12d3-a456-426614174000",
 *   palette_id: "friendly-1",
 *   palette: { primary: "#FF8566", ... },
 *   font_family: '"Londrina Solid", sans-serif'
 * });
 * 
 * // Returns immediately with new generation_version_id
 * // Caller should open generation modal and poll status
 * // Navigate only when status is final (completed/failed)
 */
export const usePartialAutopop = () => {
  const { createSnackBar } = useSnackBarContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation<GeneratePageResponse, any, PartialAutopopRequest>({
    mutationFn: async (request: PartialAutopopRequest) => {
      try {
        const response = await fetch(
          `${OpenAPI.BASE}/api/generations/${request.generationVersionId}/regenerate-color-theme`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              palette_id: request.palette_id,
              palette: request.palette,
              font_family: request.font_family,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: response.statusText }));
          
          // Handle insufficient credits specifically
          if (response.status === 403) {
            throw createGenerationError({
              status: response.status,
              detail: errorData.detail || 'Insufficient credits',
            });
          }
          
          // Handle validation errors
          if (response.status === 400) {
            throw createGenerationError({
              status: response.status,
              detail: errorData.detail || 'Invalid request',
            });
          }
          
          // Handle other errors
          throw createGenerationError({
            status: response.status,
            detail: errorData.detail || 'Failed to start color theme regeneration',
          });
        }

        const data = await response.json();
        return {
          generation_version_id: data.generation_version_id,
          page_id: data.page_id,
          website_id: data.website_id,
          subdomain: data.subdomain,
          status: data.status,
          message: data.message,
        };
      } catch (error: any) {
        // Re-throw if already a GenerationError
        if (error.code) {
          throw error;
        }
        
        // Handle other errors
        throw createGenerationError(error, 'Failed to start color theme regeneration');
      }
    },
    
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['user-websites'] });
      queryClient.invalidateQueries({ queryKey: ['creditsBalance'] });
      queryClient.invalidateQueries({ queryKey: ['creditsInfo'] });
      queryClient.invalidateQueries({ queryKey: ['creditTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['generation-configs'] });
      
      // Success notification
      createSnackBar({
        content: 'Color theme regeneration started successfully!',
        severity: 'success',
        autoHide: true
      });
    },
    
    onError: (error: GenerationError, variables: PartialAutopopRequest) => {
      console.error('Partial autopop error:', error);
      
      // Handle insufficient credits - set return origin and navigate to billing
      if (error.code === ERROR_CODES.INSUFFICIENT_CREDITS || 
          error.code === ERROR_CODES.QUOTA_EXCEEDED) {
        createSnackBar({
          content: error.message,
          severity: 'error',
          autoHide: false
        });
        
        setBillingReturnOrigin(`/editor/${variables.generationVersionId}`, {
          action: 'color_theme',
        });
        setTimeout(() => navigate('/dashboard/billing'), 2000);
        
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
