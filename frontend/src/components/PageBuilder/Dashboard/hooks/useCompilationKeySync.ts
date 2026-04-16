import { useEffect } from 'react';

const getCompilationKey = (generationId: string | undefined) =>
  generationId ? `compilation_triggered_${generationId}` : null;

export interface UseCompilationKeySyncParams {
  effectiveGenerationId: string | null;
  setHasTriggeredCompilation: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * On mount / when effectiveGenerationId changes, if localStorage has
 * compilation_triggered_<id> set, syncs hasTriggeredCompilation to true.
 */
export function useCompilationKeySync({
  effectiveGenerationId,
  setHasTriggeredCompilation,
}: UseCompilationKeySyncParams): void {
  useEffect(() => {
    if (effectiveGenerationId) {
      const key = getCompilationKey(effectiveGenerationId);
      if (key && localStorage.getItem(key) === 'true') {
        setHasTriggeredCompilation(true);
      }
    }
  }, [effectiveGenerationId, setHasTriggeredCompilation]);
}
