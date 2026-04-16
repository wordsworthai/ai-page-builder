import { useEffect, useRef } from 'react';
import type { WebsiteComponentState } from '@/streaming/types/generation';
import type { GenerationStatus } from '@/streaming/types/generation';
import type { UserWebsiteData } from '@/hooks/api/PageBuilder/Websites/useWebsiteData';

export interface UseDashboardStateMachineParams {
  websiteData: UserWebsiteData | null | undefined;
  isLoadingWebsite: boolean;
  generationStatus: GenerationStatus | undefined;
  isPolling: boolean;
  effectiveGenerationId: string | null;
  generationIdFromContext: string | null;
  componentState: WebsiteComponentState;
  setComponentState: React.Dispatch<React.SetStateAction<WebsiteComponentState>>;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 * Encapsulates the initial/derived component state effect for the dashboard.
 * Drives componentState based on website data, generation status, and IDs.
 */
export function useDashboardStateMachine({
  websiteData,
  isLoadingWebsite,
  generationStatus,
  isPolling,
  effectiveGenerationId,
  generationIdFromContext,
  componentState,
  setComponentState,
  setErrorMessage,
}: UseDashboardStateMachineParams): void {
  const processedStateRef = useRef<string>('');

  useEffect(() => {
    const stateKey = `${generationIdFromContext || 'none'}-${effectiveGenerationId || 'none'}-${isPolling}-${isLoadingWebsite}-${generationStatus?.status || 'none'}`;

    if (processedStateRef.current === stateKey) {
      return;
    }

    if (componentState === 'error') {
      if (effectiveGenerationId) {
        processedStateRef.current = stateKey;
        return;
      }
    }

    if (generationIdFromContext && effectiveGenerationId === generationIdFromContext) {
      if (componentState === 'generating' || componentState === 'compiling' || componentState === 'checking') {
        processedStateRef.current = stateKey;
        return;
      }
    }

    if (!generationIdFromContext && componentState === 'ready') {
      processedStateRef.current = stateKey;
      return;
    }

    if (componentState !== 'idle' && componentState !== 'checking' && componentState !== 'ready' && componentState !== 'error') {
      return;
    }

    if (isLoadingWebsite) {
      processedStateRef.current = stateKey;
      setComponentState('checking');
      return;
    }

    if (generationIdFromContext) {
      if (isPolling) {
        processedStateRef.current = stateKey;
        setComponentState('checking');
        return;
      }
      if (generationStatus?.status === 'failed') {
        return;
      }
      processedStateRef.current = stateKey;
      setComponentState('generating');
      return;
    }

    if (!websiteData) {
      processedStateRef.current = stateKey;
      setComponentState('empty');
      return;
    }

    if (websiteData.homepage.preview_link && websiteData.homepage.current_generation_id) {
      if (generationIdFromContext && generationIdFromContext !== websiteData.homepage.current_generation_id) {
        processedStateRef.current = stateKey;
        setComponentState('generating');
        return;
      }
      processedStateRef.current = stateKey;
      setComponentState('ready');
      return;
    }

    setErrorMessage('Website generation appeared to be incomplete. Please try regenerating.');
    processedStateRef.current = stateKey;
    setComponentState('error');
  }, [
    isLoadingWebsite,
    websiteData,
    effectiveGenerationId,
    generationIdFromContext,
    generationStatus?.status,
    isPolling,
    componentState,
    setComponentState,
    setErrorMessage,
  ]);
}
