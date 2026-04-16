import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useHandleCheckoutSuccess } from '@/hooks/api/Shared/Billing/usePayments';
import { useSnackBarContext } from '@/context/SnackBarContext';

/**
 * Handles return from Stripe after subscribe-from-publish: when URL has
 * open_publish_modal or publish_after_payment and session_id, processes the
 * checkout session, invalidates user/plan/credits queries, and opens the
 * publish dialog with pending data.
 */
export function useStripeReturnPublishHandler(
  openPublishDialogWithPendingData: () => void
): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const handleCheckoutSuccess = useHandleCheckoutSuccess();
  const { createSnackBar } = useSnackBarContext();
  const processedSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    const openPublishModal =
      searchParams.get('open_publish_modal') === 'true' ||
      searchParams.get('publish_after_payment') === 'true';
    const sessionId = searchParams.get('session_id');
    if (!openPublishModal || !sessionId) return;
    if (processedSessionIdRef.current === sessionId) return;
    processedSessionIdRef.current = sessionId;
    setSearchParams({}, { replace: true });

    const run = async () => {
      try {
        await handleCheckoutSuccess.mutateAsync(sessionId);
        queryClient.invalidateQueries({ queryKey: ['userPlan'] });
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        queryClient.invalidateQueries({ queryKey: ['creditsBalance'] });
        queryClient.invalidateQueries({ queryKey: ['creditsInfo'] });
        openPublishDialogWithPendingData();
      } catch (error: unknown) {
        const message =
          error && typeof error === 'object' && 'message' in error
            ? String((error as { message?: unknown }).message)
            : 'Failed to process. Please try again.';
        createSnackBar({
          content: message,
          severity: 'error',
          autoHide: true,
        });
      } finally {
        processedSessionIdRef.current = null;
      }
    };
    run();
  }, [
    searchParams,
    setSearchParams,
    handleCheckoutSuccess,
    queryClient,
    createSnackBar,
    openPublishDialogWithPendingData,
  ]);
}
