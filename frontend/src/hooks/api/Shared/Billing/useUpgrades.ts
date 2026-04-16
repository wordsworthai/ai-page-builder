/**
 * Upgrade Hooks
 * 
 * Provides React hooks for plan upgrades (simplified for credit-based system).
 * 
 * Plans: FREE -> BASIC -> CUSTOM
 * - FREE users can upgrade to BASIC ($9.99/month, +100 credits)
 * - BASIC users can purchase credit packs
 * - CUSTOM plans are admin-managed
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UpgradesService } from '@/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useSnackBarContext } from '@/context/SnackBarContext';

/**
 * Get available upgrade options for the current user
 * - For FREE users: BASIC subscription option
 * - For BASIC+ users: Credit pack purchase options
 */
export const useUpgradeOptions = () => {
  const { handleApiError } = useErrorHandler();
  
  return useQuery({
    queryKey: ['upgradeOptions'],
    queryFn: async () => {
      try {
        return await UpgradesService.getUpgradeOptionsApiUpgradesOptionsGet();
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Create upgrade checkout session for upgrading to BASIC plan.
 * Only available for FREE users.
 */
export const useCreateUpgradeCheckout = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();
  const { createSnackBar } = useSnackBarContext();
  
  return useMutation({
    mutationFn: async ({ targetPlan }: { targetPlan: string }) => {
      try {
        return await UpgradesService.createUpgradeCheckoutApiUpgradesCheckoutPost({ target_plan: targetPlan });
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    onSuccess: (data: any) => {
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
      
      // Invalidate upgrade-related queries
      queryClient.invalidateQueries({ queryKey: ['upgradeOptions'] });
      queryClient.invalidateQueries({ queryKey: ['userPlan'] });
      queryClient.invalidateQueries({ queryKey: ['creditsBalance'] });
      queryClient.invalidateQueries({ queryKey: ['creditsInfo'] });
    },
    onError: (error: any) => {
      // Check if user is already on BASIC
      if (error?.body?.detail?.includes('already') || error?.status === 400) {
        createSnackBar({
          content: 'You already have a Basic subscription. You can purchase credit packs instead.',
          severity: 'info',
          autoHide: true,
        });
      }
    },
  });
};

/**
 * Purchase a credit pack (for BASIC+ subscribers only)
 */
export const usePurchaseCreditPack = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();
  const { createSnackBar } = useSnackBarContext();
  
  return useMutation({
    mutationFn: async ({ packId }: { packId: string }) => {
      try {
        return await UpgradesService.purchaseCreditPackApiUpgradesCreditsPost({ pack_id: packId });
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    onSuccess: (data: any) => {
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
      
      // Invalidate credit-related queries
      queryClient.invalidateQueries({ queryKey: ['creditsBalance'] });
      queryClient.invalidateQueries({ queryKey: ['creditsInfo'] });
      queryClient.invalidateQueries({ queryKey: ['creditTransactions'] });
    },
    onError: (error: any) => {
      // Check if user needs to upgrade first
      if (error?.body?.detail?.includes('BASIC') || error?.status === 403) {
        createSnackBar({
          content: 'Credit packs require a Basic subscription. Please upgrade first.',
          severity: 'warning',
          autoHide: false,
        });
      }
    },
  });
};
