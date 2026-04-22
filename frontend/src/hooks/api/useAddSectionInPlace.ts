/**
 * Hook to add or replace a section in-place (updates 3 DBs with lorem).
 * Used before section content regeneration for insert/replace flows.
 */
import { useMutation } from '@tanstack/react-query';
import {
  PageGenerationService,
  AddSectionInPlaceRequest as ApiAddSectionInPlaceRequest,
} from '@/client';
import { useSnackBarContext } from '@/context/SnackBarContext';

export interface AddSectionInPlaceRequest {
  generationVersionId: string;
  sectionId: string;
  insertIndex?: number;
  mode: 'insert' | 'replace';
  replaceIndex?: number;
}

export const useAddSectionInPlace = () => {
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: async ({
      generationVersionId,
      sectionId,
      insertIndex = -1,
      mode,
      replaceIndex,
    }: AddSectionInPlaceRequest) => {
      try {
        const apiMode =
          mode === 'replace'
            ? ApiAddSectionInPlaceRequest.mode.REPLACE
            : ApiAddSectionInPlaceRequest.mode.INSERT;
        await PageGenerationService.addSectionInPlaceApiGenerationsGenerationVersionIdAddSectionInPlacePost(
          generationVersionId,
          {
            section_id: sectionId,
            insert_index: insertIndex,
            mode: apiMode,
            replace_index: replaceIndex,
          }
        );
      } catch (error: any) {
        const message =
          error?.body?.detail || error?.message || 'Failed to add section. Please try again.';
        createSnackBar({
          content: message,
          severity: 'error',
          autoHide: true,
        });
        throw error;
      }
    },
  });
};
