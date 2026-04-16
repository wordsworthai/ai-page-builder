import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageGenerationService } from '@/client';
import { useSnackBarContext } from '@/context/SnackBarContext';

interface UseGenerationRetryOptions {
  onSuccess?: () => void;
}

export const useGenerationRetry = (options?: UseGenerationRetryOptions) => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: async (generationVersionId: string) => {
      return PageGenerationService.retryGenerationApiGenerationsGenerationVersionIdRetryPost(
        generationVersionId
      );
    },
    onSuccess: async (_data, generationVersionId) => {
      // Status polling uses useStreamingStatus => queryKey: ['streaming-status', generationId]
      // We must invalidate/refetch that key so polling restarts after a failed run.
      await queryClient.invalidateQueries({
        queryKey: ['streaming-status', generationVersionId],
      });
      await queryClient.refetchQueries({
        queryKey: ['streaming-status', generationVersionId],
      });

      // Ensure dashboard "latest generation" picks up new/retired runs
      await queryClient.invalidateQueries({
        queryKey: ['generation-configs'],
      });
      // Also invalidate the per-user variant used by useGenerationConfigs()
      await queryClient.invalidateQueries({
        queryKey: ['generation-configs'],
        exact: false,
      });

      if (options?.onSuccess) {
        options.onSuccess();
      }
    },
    onError: (error: any) => {
      const message =
        error?.body?.detail ||
        error?.message ||
        'Failed to retry generation. Please start a new generation.';

      createSnackBar({
        content: message,
        severity: 'error',
        autoHide: true,
      });
    },
  });
};

