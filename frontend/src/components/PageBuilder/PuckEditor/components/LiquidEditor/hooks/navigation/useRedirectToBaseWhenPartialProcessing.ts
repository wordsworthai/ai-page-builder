import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGenerationState } from '@/context/generation_state/useGenerationState';
import { usePageGenerationStatus } from '@/streaming/hooks';

/**
 * When we're in a partial generation flow and the URL shows the partial generation ID
 * but that partial is still processing, redirects to the base generation ID so the
 * base template loads.
 */
export function useRedirectToBaseWhenPartialProcessing(
  generationVersionId: string
): void {
  const { state: genState } = useGenerationState();
  const navigate = useNavigate();

  const isPartialGeneration = genState?.generationType?.startsWith('partial') ?? false;
  const partialGenerationId = genState?.activeGenerationVersionId;
  const baseGenerationId = genState?.sourceGenerationVersionId;

  const { data: partialGenerationStatus } = usePageGenerationStatus({
    generationId: partialGenerationId || '',
    enabled: isPartialGeneration && !!partialGenerationId,
  });

  useEffect(() => {
    if (
      isPartialGeneration &&
      partialGenerationId === generationVersionId &&
      baseGenerationId &&
      baseGenerationId !== generationVersionId &&
      partialGenerationStatus?.status === 'processing'
    ) {
      navigate(`/editor/${baseGenerationId}`, { replace: true });
    }
  }, [
    isPartialGeneration,
    partialGenerationId,
    baseGenerationId,
    generationVersionId,
    partialGenerationStatus?.status,
    navigate,
  ]);
}
