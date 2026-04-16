/**
 * Editor-only hook for selecting an existing template (curated page flow).
 * Wraps useSelectedTemplate and handles success: close generation modal,
 * clear/set generation state, and navigate to the new editor.
 */
import { useNavigate } from 'react-router-dom';
import { useSelectedTemplate } from '@/hooks/api/PageBuilder/Editor/useSelectedTemplate';
import { useGenerationState } from '@/context/generation_state/useGenerationState';

interface UseSelectExistingTemplateOptions {
  /** Called on success before navigation (e.g. close generation modal). */
  onCloseModal?: () => void;
}

export function useSelectExistingTemplate(options?: UseSelectExistingTemplateOptions) {
  const navigate = useNavigate();
  const { clearActiveGeneration, setActiveGeneration } = useGenerationState();

  return useSelectedTemplate({
    onSuccess: (res) => {
      options?.onCloseModal?.();
      clearActiveGeneration();
      setActiveGeneration({
        generationVersionId: res.generation_version_id,
        type: 'from-template',
        fromUseTemplate: true,
      });
      navigate(`/editor/${res.generation_version_id}`, {
        replace: true,
      });
    },
  });
}
