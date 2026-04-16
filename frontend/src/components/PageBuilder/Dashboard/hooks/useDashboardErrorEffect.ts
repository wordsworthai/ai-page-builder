import { useEffect } from 'react';
import type { WebsiteComponentState } from '@/streaming/types/generation';

export interface UseDashboardErrorEffectParams {
  componentState: WebsiteComponentState;
  pollingError: boolean;
  /** Optional: underlying error from status poll (for debugging) */
  pollingErrorDetail?: unknown;
  compilationError: string | null;
  setComponentState: React.Dispatch<React.SetStateAction<WebsiteComponentState>>;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 * Maps polling and compilation API errors to component error state.
 */
export function useDashboardErrorEffect({
  componentState,
  pollingError,
  pollingErrorDetail,
  compilationError,
  setComponentState,
  setErrorMessage,
}: UseDashboardErrorEffectParams): void {
  useEffect(() => {
    if (componentState === 'error') return;

    if (pollingError) {
      setErrorMessage('Failed to check generation status. Please refresh.');
      setComponentState('error');
    }

    if (compilationError) {
      setErrorMessage(compilationError);
      setComponentState('error');
    }
  }, [pollingError, pollingErrorDetail, compilationError, componentState, setComponentState, setErrorMessage]);
}
