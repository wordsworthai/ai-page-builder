import type { GenerationState } from '@/context/generation_state/generationStateStorage';

/**
 * Whether to open the generation modal on init.
 * Uses genState only (fromUseTemplate / fromCreateSite).
 */
export function getShouldOpenGenerationModalOnInit(
  genState: GenerationState | null | undefined,
  isCheckingStatus: boolean,
  statusToCheck: { status?: string } | null
): boolean {
  const fromUseTemplate = genState?.fromUseTemplate ?? false;
  const fromCreateSite = genState?.fromCreateSite ?? false;
  if (!fromUseTemplate && !fromCreateSite) return false;
  if (isCheckingStatus) return false;
  return statusToCheck?.status === 'processing';
}

/**
 * Whether to disable header/editor action buttons (save, publish, customise, etc.).
 * Disabled when a partial (update) generation is running, or when the editor is not ready
 * and the main generation is still in progress (not yet failed/completed).
 */
export function getShouldDisableEditorButtons(
  updateTemplateStatus: string | undefined,
  editorState: string,
  generationStatus: string | undefined
): boolean {
  if (updateTemplateStatus === 'processing') return true;
  if (editorState !== 'ready' && !['failed', 'completed'].includes(generationStatus || '')) return true;
  return false;
}
