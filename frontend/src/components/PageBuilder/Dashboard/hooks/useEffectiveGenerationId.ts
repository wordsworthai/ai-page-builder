import React, { useEffect, useMemo } from 'react';
import { useGenerationState } from '@/context/generation_state/useGenerationState';
import { getPersistedGenerationState } from '@/context/generation_state/generationStateStorage';

/**
 * Single source of truth for the current generation ID on the dashboard.
 * Uses context with fallback to persisted state, and re-reads when tab becomes visible.
 */
export function useEffectiveGenerationId() {
  const { getActiveGenerationId } = useGenerationState();
  const [visibilityRefresh, setVisibilityRefresh] = React.useState(0);

  const contextGenerationId = getActiveGenerationId();
  const generationIdFromContext = useMemo(() => {
    if (contextGenerationId) {
      return contextGenerationId;
    }
    const state = getPersistedGenerationState();
    return state?.activeGenerationVersionId ?? null;
  }, [contextGenerationId, visibilityRefresh]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') setVisibilityRefresh((r) => r + 1);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const effectiveGenerationId = generationIdFromContext;

  const getEffectiveGenerationIdForNavigation = () =>
    getActiveGenerationId() ?? getPersistedGenerationState()?.activeGenerationVersionId ?? null;

  const shouldPollGeneration = !!effectiveGenerationId;

  return {
    effectiveGenerationId,
    generationIdFromContext,
    getEffectiveGenerationIdForNavigation,
    shouldPollGeneration,
  };
}
