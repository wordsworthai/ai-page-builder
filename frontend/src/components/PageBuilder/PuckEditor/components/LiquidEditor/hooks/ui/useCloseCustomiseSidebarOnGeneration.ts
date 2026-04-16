import { useEffect } from 'react';
import { useGenerationEventContext } from '../../contexts/GenerationEventContext';

export function useCloseCustomiseSidebarOnGeneration(
  onCloseSidebarModal: () => void,
  updateTemplateGenerationStatus?: { status?: string } | null
) {
  const { subscribe } = useGenerationEventContext();

  // Close when GENERATION_STARTED fires (any option triggers generation)
  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      if (event.type === 'GENERATION_STARTED') {
        onCloseSidebarModal();
      }
    });
    return unsubscribe;
  }, [subscribe, onCloseSidebarModal]);

  // Close on init when we're already in partial generation state
  useEffect(() => {
    if (updateTemplateGenerationStatus?.status === 'processing') {
      onCloseSidebarModal();
    }
  }, [updateTemplateGenerationStatus?.status, onCloseSidebarModal]);
}
