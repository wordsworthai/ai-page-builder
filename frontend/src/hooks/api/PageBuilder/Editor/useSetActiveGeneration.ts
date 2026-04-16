/**
 * Hook to set the active generation (current_generation_id) for a page.
 * If pageId is provided, targets that page; otherwise defaults to homepage.
 * Invalidates user-websites, website-pages, and generation-count on success;
 * shows snackbar on error.
 *
 * If the version needs compilation (no cached preview), the caller can handle it
 * by checking the response's needs_compilation flag.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PublishingService } from '@/client';
import type { SetActiveGenerationResponse } from '@/client';
import { ApiError } from '@/client';
import { useSnackBarContext } from '@/context/SnackBarContext';

export interface UseSetActiveGenerationOptions {
  /** 
   * If true, don't show the default success snackbar.
   * Useful when the caller wants to show a custom message or handle compilation.
   */
  suppressSuccessSnackbar?: boolean;
}

export interface SetActiveGenerationInput {
  generationVersionId: string;
  pageId?: string;
}

/**
 * Mutation to set active generation. On success, invalidates user-websites,
 * website-pages, and generation-count. On error, surfaces message via snackbar.
 *
 * Returns response with needs_compilation flag if the version has no cached preview.
 * The caller can check this flag and trigger compilation if needed.
 */
export const useSetActiveGeneration = (options?: UseSetActiveGenerationOptions) => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();
  const { suppressSuccessSnackbar = false } = options ?? {};

  return useMutation<SetActiveGenerationResponse, Error, SetActiveGenerationInput>({
    mutationFn: async ({ generationVersionId, pageId }) => {
      const response = await PublishingService.setHomepageActiveGenerationApiPublishingHomepageActiveGenerationPatch(
        { generation_version_id: generationVersionId, page_id: pageId }
      );
      return response;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-websites'] });
      queryClient.invalidateQueries({ queryKey: ['website-pages'] });
      queryClient.invalidateQueries({ queryKey: ['generation-count'] });

      if (!suppressSuccessSnackbar) {
        createSnackBar({
          content: 'Active version updated successfully',
          severity: 'success',
          autoHide: true,
        });
      }
    },

    onError: (error) => {
      const message =
        error instanceof ApiError && typeof error.body?.detail === 'string'
          ? error.body.detail
          : error.message;
      createSnackBar({
        content: message,
        severity: 'error',
        autoHide: true,
      });
    },
  });
};
