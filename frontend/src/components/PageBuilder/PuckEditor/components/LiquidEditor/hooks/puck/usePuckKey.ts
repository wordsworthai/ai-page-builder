import { useMemo } from 'react';

interface UsePuckKeyParams {
  generationVersionId: string;
}

/**
 * Hook to generate a STABLE key for Puck component.
 * 
 * IMPORTANT: The key should ONLY change when switching to a different template
 * (different generationVersionId). It should NOT change when:
 * - editorState changes (checking → generating → ready)
 * - iframeContentType changes (generating → partial → final)
 * - Data loads or updates
 * 
 * With Puck's data sync feature, data prop changes are automatically synced
 * to the store without needing a remount. This eliminates flicker.
 */
export function usePuckKey({
  generationVersionId,
}: UsePuckKeyParams): string {
  return useMemo(() => {
    // Only depend on generationVersionId - stable across state transitions
    return `puck-${generationVersionId}`;
  }, [generationVersionId]);
}
