import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackBarContext } from '@/context/SnackBarContext';
import { usePreviewCompilation } from '@/hooks/api/PageBuilder/Editor/usePreviewCompilation';
import type { WebsiteComponentState } from '@/streaming/types/generation';
import type { GenerationStatus } from '@/streaming/types/generation';
import type { UserWebsiteData } from '@/hooks/api/PageBuilder/Websites/useWebsiteData';

const getCompilationKey = (generationId: string | undefined) =>
  generationId ? `compilation_triggered_${generationId}` : null;

export interface UseGenerationCompletionHandlerParams {
  generationStatus: GenerationStatus | undefined;
  effectiveGenerationId: string | null;
  componentState: WebsiteComponentState;
  hasTriggeredCompilation: boolean;
  setHasTriggeredCompilation: React.Dispatch<React.SetStateAction<boolean>>;
  setComponentState: React.Dispatch<React.SetStateAction<WebsiteComponentState>>;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
  websiteData: UserWebsiteData | null | undefined;
}

/**
 * Handles generation completion: trigger compile on completed, navigate to editor,
 * and set error state on failed or compilation failure.
 */
export function useGenerationCompletionHandler({
  generationStatus,
  effectiveGenerationId,
  componentState,
  hasTriggeredCompilation,
  setHasTriggeredCompilation,
  setComponentState,
  setErrorMessage,
  websiteData,
}: UseGenerationCompletionHandlerParams): void {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();
  const { compilePreview } = usePreviewCompilation();

  useEffect(() => {
    if (!generationStatus) return;
    if (componentState === 'error') return;

    if (
      websiteData?.homepage?.preview_link &&
      websiteData?.homepage?.current_generation_id &&
      websiteData?.homepage?.current_generation_id === effectiveGenerationId
    ) {
      if (componentState !== 'ready') {
        setComponentState('ready');
      }
      return;
    }

    const status = generationStatus.status;
    const compilationKey = getCompilationKey(effectiveGenerationId || undefined);

    if (compilationKey && localStorage.getItem(compilationKey) === 'true') {
      return;
    }

    if (status === 'completed' && !hasTriggeredCompilation) {
      setHasTriggeredCompilation(true);
      if (compilationKey) {
        localStorage.setItem(compilationKey, 'true');
      }

      // Invalidate credit queries - credits are deducted on generation completion
      queryClient.invalidateQueries({ queryKey: ['creditsBalance'] });
      queryClient.invalidateQueries({ queryKey: ['creditsInfo'] });
      queryClient.invalidateQueries({ queryKey: ['creditTransactions'] });

      setComponentState('compiling');

      compilePreview(generationStatus.generation_version_id)
        .then((result) => {
          setComponentState('ready');
          createSnackBar({
            content: 'Your website is ready! Redirecting to editor...',
            severity: 'success',
            autoHide: true,
          });

          setTimeout(() => {
            navigate(`/editor/${result.generation_version_id}`);
          }, 2500);
        })
        .catch((error) => {
          console.error('Compilation failed:', error);
          setErrorMessage(error.message || 'Failed to prepare preview');
          setComponentState('error');
          createSnackBar({
            content: 'Failed to prepare preview. Please refresh to try again.',
            severity: 'error',
            autoHide: false,
          });
        });
    } else if (status === 'failed') {
      setErrorMessage(generationStatus.error_message ?? 'Generation failed');
      setComponentState('error');
      createSnackBar({
        content: 'Website generation failed. Please try again.',
        severity: 'error',
        autoHide: false,
      });
    } else if (status === 'processing' || status === 'pending') {
      setComponentState('generating');
    }
  }, [
    generationStatus,
    hasTriggeredCompilation,
    websiteData,
    effectiveGenerationId,
    componentState,
    navigate,
    createSnackBar,
    compilePreview,
    setHasTriggeredCompilation,
    setComponentState,
    setErrorMessage,
  ]);
}
