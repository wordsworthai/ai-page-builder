import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { WarningMessage } from '@/utils/notification';
import { usePageGenerationStatus } from '@/streaming/hooks';
import { useGenerationState } from '@/context/generation_state/useGenerationState';

/**
 * Resolves the update template generation version ID for partial generations.
 * generationVersionId is from the URL (where we navigated to).
 * We return the partial generation when we're viewing the base generation,
 * so we can poll for completion and navigate when the partial is ready.
 *
 */
function getUpdateTemplateGenerationVersionId(
  genState: ReturnType<typeof useGenerationState>['state'],
  generationVersionId: string
): string | undefined {
  // Must be a partial generation type (e.g. "partial_color", "partial_content")
  if (!genState?.generationType?.startsWith('partial')) {
    return undefined;
  }
  // Return partial when we're viewing the base (source) generation
  // base = sourceGenerationVersionId, partial = activeGenerationVersionId
  const baseGenerationId = genState.sourceGenerationVersionId;
  const partialGenerationId = genState.activeGenerationVersionId;
  if (
    baseGenerationId &&
    generationVersionId === baseGenerationId &&
    generationVersionId !== partialGenerationId
  ) {
    // Partial is different from current view - it's the one we poll for and navigate to when complete
    return partialGenerationId ?? undefined;
  }
  // Already viewing the partial or some other generation - no update to track
  return undefined;
}

interface UseUpdateTemplateGenerationParams {
  /** Current generation version ID (for navigation on failure) */
  generationVersionId: string;
  /** Called when update generation fails, before clearing state. Enables overlay fade-out. */
  onGenerationFailed?: (generationId: string, error: string) => void;
  /** Called when update generation fails. Use to trigger soft remount (e.g. increment key) instead of full page reload. */
  onFailure?: () => void;
}

interface UseUpdateTemplateGenerationReturn {
  /** Update template generation version ID (from route state, persisted via ref) */
  updateTemplateGenerationVersionId?: string;
  /** Update template generation status */
  updateTemplateGenerationStatus?: any;
}

/**
 * Hook to manage update template generation (for partial autopop like color theme changes).
 * 
 * Handles:
 * - Reading updateTemplateGenerationVersionId from route state with ref persistence
 * - Polling status for the update generation
 * - Cache invalidation to prevent stale data
 * - Navigation on completion/failure with freshness checks
 * - Tracking to prevent premature navigation from cached "completed" status
 */
export function useUpdateTemplateGeneration({
  generationVersionId,
  onGenerationFailed,
  onFailure,
}: UseUpdateTemplateGenerationParams): UseUpdateTemplateGenerationReturn {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { state: genState, clearActiveGeneration } = useGenerationState();
  
  // Get update generation ID from context if it's a partial generation
  const updateTemplateGenerationVersionId = getUpdateTemplateGenerationVersionId(
    genState,
    generationVersionId
  );

  // Poll status for update generation
  const { 
    data: updateTemplateGenerationStatus,
  } = usePageGenerationStatus({
    generationId: updateTemplateGenerationVersionId || '',
    enabled: !!updateTemplateGenerationVersionId,
  });
  
  // Invalidate cache when new generation ID is set to ensure fresh status data
  // This prevents using stale cached "completed" status from previous queries
  useEffect(() => {
    if (updateTemplateGenerationVersionId) {
      queryClient.invalidateQueries({
        queryKey: ['streaming-status', updateTemplateGenerationVersionId],
      });
    }
  }, [updateTemplateGenerationVersionId, queryClient]);
  
  // Track when we first start polling for each generation ID and its initial status.
  // Needed because: when user navigates back to the base page, React Query may return
  // a stale cached "completed" status from the previous session. Without tracking,
  // we'd immediately navigate again. We record initialStatus and startTime, then in
  // the navigation effect we skip navigation if status was already "completed" when
  // we started tracking and < 500ms has passed (gives cache invalidation time to refetch).
  const generationTrackingRef = useRef<{
    generationId: string;
    startTime: number;
    initialStatus: string | null;
  } | null>(null);
  
  // Track when we start polling for a new generation ID
  useEffect(() => {
    if (updateTemplateGenerationVersionId) {
      const currentTracking = generationTrackingRef.current;
      
      // Only track if this is a new generation ID
      if (currentTracking?.generationId !== updateTemplateGenerationVersionId) {
        const initialStatus = updateTemplateGenerationStatus?.status || null;
        generationTrackingRef.current = {
          generationId: updateTemplateGenerationVersionId,
          startTime: Date.now(),
          initialStatus,
        };
      }
    } else {
      // Clear tracking when generation ID is cleared
      generationTrackingRef.current = null;
    }
  }, [updateTemplateGenerationVersionId, updateTemplateGenerationStatus?.status]);
  
  // Navigation guards
  const hasNavigatedRef = useRef(false);
  const navigatedForGenerationIdRef = useRef<string | null>(null);
  
  // Reset navigation guard when generation ID changes
  useEffect(() => {
    const prevId = navigatedForGenerationIdRef.current;
    if (prevId !== updateTemplateGenerationVersionId) {
      hasNavigatedRef.current = false;
      navigatedForGenerationIdRef.current = null;
    }
  }, [updateTemplateGenerationVersionId]);

  // Clear update generation state when current generation changes
  // If we've navigated to a different generation, the update is no longer relevant
  useEffect(() => {
    if (updateTemplateGenerationVersionId && updateTemplateGenerationVersionId !== generationVersionId) {
      // Check if this is a navigation to a completely new generation (not the update generation)
      // If the current generation is different from the update generation, clear the update state
      // Only clear if it's not a partial generation (which should persist until completion)
      if (genState?.generationType?.startsWith('partial') && 
          genState.activeGenerationVersionId === updateTemplateGenerationVersionId) {
        // Keep the state for partial generations
        return;
      }
      // Clear if it's not a partial generation or doesn't match
      clearActiveGeneration();
    }
  }, [generationVersionId, updateTemplateGenerationVersionId, genState, clearActiveGeneration]);
  
  // Handle navigation on completion/failure
  useEffect(() => {
    if (!updateTemplateGenerationVersionId || !updateTemplateGenerationStatus) return;
    
    // Prevent multiple navigations for the same generation ID
    if (hasNavigatedRef.current && navigatedForGenerationIdRef.current === updateTemplateGenerationVersionId) {
      return;
    }
    
    if (updateTemplateGenerationStatus.status === 'completed') {
      const tracking = generationTrackingRef.current;
      const wasAlreadyCompleted = tracking?.initialStatus === 'completed';
      const timeSinceTracking = tracking ? Date.now() - tracking.startTime : 0;

      // If status was already completed when we started tracking, it might be stale cached data
      // Wait a minimum time (500ms) to ensure we're not using cached data
      if (wasAlreadyCompleted && timeSinceTracking < 500) {
        return; // Wait for next poll
      }

      // Invalidate credit queries - credits are deducted on generation completion
      queryClient.invalidateQueries({ queryKey: ['creditsBalance'] });
      queryClient.invalidateQueries({ queryKey: ['creditsInfo'] });
      queryClient.invalidateQueries({ queryKey: ['creditTransactions'] });

      // Mark as navigated and navigate to completed generation
      hasNavigatedRef.current = true;
      navigatedForGenerationIdRef.current = updateTemplateGenerationVersionId;
      // Clear the context state since we're navigating to the completed generation
      clearActiveGeneration();

      navigate(`/editor/${updateTemplateGenerationVersionId}`, {
        replace: true
      });
    } else if (updateTemplateGenerationStatus.status === 'failed') {
      // Emit GENERATION_FAILED before clearing so useIframeContent receives it and overlay fades out
      onGenerationFailed?.(
        updateTemplateGenerationVersionId,
        updateTemplateGenerationStatus.error_message || 'Generation failed'
      );
      // Show warning toast
      WarningMessage('Update failed. Please try again.');
      clearActiveGeneration();
      hasNavigatedRef.current = true;
      navigatedForGenerationIdRef.current = updateTemplateGenerationVersionId;
      // Invalidate so dropdown and page list refetch fresh data on remount
      queryClient.invalidateQueries({ queryKey: ['generation-configs'] });
      queryClient.invalidateQueries({ queryKey: ['website-pages'] });
      onFailure?.();
    }
  }, [updateTemplateGenerationStatus?.status, updateTemplateGenerationVersionId, navigate, generationVersionId, onGenerationFailed, onFailure, queryClient]);
  
  // Only return update generation info if it's actually different from current generation
  // If they match, we've already navigated to that generation and it's now the current generation, not an update
  const isUpdateGeneration = updateTemplateGenerationVersionId !== generationVersionId;
  
  return {
    updateTemplateGenerationVersionId: isUpdateGeneration ? updateTemplateGenerationVersionId : undefined,
    updateTemplateGenerationStatus: isUpdateGeneration ? updateTemplateGenerationStatus : undefined,
  };
}
