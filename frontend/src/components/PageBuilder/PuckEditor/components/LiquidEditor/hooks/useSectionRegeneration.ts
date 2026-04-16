import { useRegenerateContentForSection } from '@/hooks/api/PageBuilder/Editor/useRegenerateContentForSection';

export interface UseSectionRegenerationParams {
  generationVersionId: string | undefined;
  /** Stable getter returning the save+emit callback to run before regeneration */
  getOnBeforeConfirm: () => (() => Promise<void>) | undefined;
}

/**
 * Consolidates section regeneration: modal state, mutation, and save-before-confirm.
 * Uses getter for onBeforeConfirm to avoid callback dependency churn and cyclic deps.
 */
export function useSectionRegeneration({
  generationVersionId,
  getOnBeforeConfirm,
}: UseSectionRegenerationParams) {
  return useRegenerateContentForSection(generationVersionId, {
    getOnBeforeConfirm,
  });
}
