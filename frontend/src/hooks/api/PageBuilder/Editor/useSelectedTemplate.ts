/**
 * Hook to create a new generation using a selected template (list of section IDs).
 * Similar to useUseTemplate but passes section_ids directly.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageGenerationService } from '@/client/services/PageGenerationService';
import type { UseSectionIdsRequest } from '@/client/models/UseSectionIdsRequest';
export type { UseSectionIdsRequest };
import type { UseTemplateResponse } from '@/client/models/UseTemplateResponse';
import { useSnackBarContext } from '@/context/SnackBarContext';

/** Same key as WebsiteComponent so dashboard tracks this generation when user returns */
const DASHBOARD_ACTIVE_GENERATION_ID_KEY = 'dashboard_active_generation_id';

interface UseSelectedTemplateOptions {
  onSuccess?: (data: UseTemplateResponse) => void;
}

export const useSelectedTemplate = (options?: UseSelectedTemplateOptions) => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: (body: UseSectionIdsRequest) =>
      PageGenerationService.useSectionIdsApiGenerationsUseSectionIdsPost(body),
    onSuccess: async (data) => {
      // So dashboard shows progress for the new generation (same key as WebsiteComponent)
      try {
        sessionStorage.setItem(DASHBOARD_ACTIVE_GENERATION_ID_KEY, data.generation_version_id);
      } catch {
        // ignore
      }
      // Seed placeholder so progress panel shows immediately after navigate
      const placeholder = {
        id: data.generation_version_id,
        generation_version_id: data.generation_version_id,
        status: 'processing',
        started_at: new Date().toISOString(),
        elapsed_seconds: 0,
        current_node: null,
        current_node_display: null,
        nodes_completed: 0,
        execution_log: [],
        preview_link: null,
        error_message: null,
        progress: 0,
        dev_task_id: data.generation_version_id,
        query_hash: null,
        created_at: null,
        completed_at: null,
      };
      queryClient.setQueryData(['streaming-status', data.generation_version_id], placeholder);

      await queryClient.invalidateQueries({ queryKey: ['generation-templates'] });
      await queryClient.invalidateQueries({ queryKey: ['generation-configs'] });
      // Refresh page list so new curated page appears (e.g. Add Page flow creates new page)
      await queryClient.invalidateQueries({ queryKey: ['website-pages'] });
      await queryClient.invalidateQueries({ queryKey: ['user-websites'] });

      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error: any) => {
      const message =
        error?.body?.detail ||
        error?.message ||
        'Failed to start generation with section IDs. Please try again.';
      createSnackBar({
        content: message,
        severity: 'error',
        autoHide: true,
      });
    },
  });
};
