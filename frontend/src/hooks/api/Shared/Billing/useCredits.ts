/**
 * Credits Hooks
 *
 * Provides React hooks for credit balance, transactions, and credit purchases.
 * Cost values come from the backend (GET /api/credits/info); use config/credits for action-to-cost-key mapping only.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditsService,
  CreditsBalanceResponse,
  CreditsInfoResponse,
  CreditTransactionListResponse,
} from '@/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useCurrentUser } from '@/hooks/api/Shared/Auth/useCurrentUser';
import { useSnackBarContext } from '@/context/SnackBarContext';
import {
  type ActionType,
  getCreditCostForAction,
} from '@/config/credits';

/**
 * Get current credit balance
 */
export const useCreditsBalance = () => {
  const { handleApiError } = useErrorHandler();
  const { data: currentUser } = useCurrentUser();
  
  return useQuery<CreditsBalanceResponse>({
    queryKey: ['creditsBalance'],
    queryFn: async () => {
      try {
        return await CreditsService.getCreditsBalanceApiCreditsBalanceGet();
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
};

/**
 * Get complete credit info including costs and generation availability
 */
export const useCreditsInfo = () => {
  const { handleApiError } = useErrorHandler();
  const { data: currentUser } = useCurrentUser();
  
  return useQuery<CreditsInfoResponse>({
    queryKey: ['creditsInfo'],
    queryFn: async () => {
      try {
        return await CreditsService.getCreditsInfoApiCreditsInfoGet();
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
};

/**
 * Get credit cost for a specific action (from API only). No default costs.
 */
export const useCreditCostForAction = (actionType: ActionType) => {
  const { data: creditsInfo, isLoading } = useCreditsInfo();
  const cost = getCreditCostForAction(actionType, creditsInfo?.costs);
  return { cost, isLoading };
};

/**
 * Get cost, balance, and "has enough credits" for an action. Use in modals and UIs.
 * When cost is undefined (API not loaded), treat as not enough or show loading.
 */
export const useCreditsForAction = (actionType: ActionType) => {
  const { data: creditsInfo, isLoading } = useCreditsInfo();
  const cost = getCreditCostForAction(actionType, creditsInfo?.costs);
  const balance = creditsInfo?.balance ?? 0;
  const hasEnoughCredits =
    cost !== undefined && typeof balance === 'number' && balance >= cost;
  return {
    cost,
    balance,
    hasEnoughCredits,
    isLoading,
  };
};

/**
 * Get credit transaction history
 */
export const useCreditTransactions = (limit: number = 50, offset?: number) => {
  const { handleApiError } = useErrorHandler();
  const { data: currentUser } = useCurrentUser();
  
  return useQuery<CreditTransactionListResponse>({
    queryKey: ['creditTransactions', limit, offset],
    queryFn: async () => {
      try {
        return await CreditsService.getCreditTransactionsApiCreditsTransactionsGet(limit, offset);
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    enabled: !!currentUser,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Purchase a credit pack (for BASIC+ subscribers only)
 */
export const usePurchaseCredits = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();
  const { createSnackBar } = useSnackBarContext();
  
  return useMutation({
    mutationFn: async ({ packId }: { packId: string }) => {
      try {
        return await CreditsService.purchaseCreditsApiCreditsPurchasePost({ pack_id: packId });
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    onSuccess: (data: any) => {
      // Redirect to checkout if URL is provided
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
          content: 'Credit packs are only available for Basic subscribers. Please upgrade first.',
          severity: 'warning',
          autoHide: false,
        });
      }
    },
  });
};

/**
 * Utility hook to check if user can generate (create_site). creditsNeeded from API only.
 */
export const useCanGenerate = () => {
  const { cost, balance, hasEnoughCredits, isLoading } =
    useCreditsForAction('create_site');
  const { data: creditsInfo } = useCreditsInfo();

  return {
    canGenerate: creditsInfo?.can_generate ?? false,
    creditsNeeded: cost,
    currentBalance: balance,
    generationsAvailable: creditsInfo?.generations_available ?? 0,
    hasEnoughCredits,
    isLoading,
  };
};

/**
 * Format credits for display
 */
export const formatCredits = (credits: number): string => {
  return credits.toLocaleString();
};

/**
 * Get credit cost description from API costs. No invented numbers; use "— credits" or "Loading…" when cost undefined.
 */
export const getCreditCostDescription = (
  actionType: ActionType,
  costsFromApi?: Record<string, number>
): string => {
  const cost = getCreditCostForAction(actionType, costsFromApi);
  if (cost === undefined) return '— credits';
  return `${cost} credit${cost !== 1 ? 's' : ''}`;
};
