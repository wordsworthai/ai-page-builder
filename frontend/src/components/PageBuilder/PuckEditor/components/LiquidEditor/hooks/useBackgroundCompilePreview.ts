import { useEffect } from 'react';
import { useWebsiteData } from '@/hooks/api/PageBuilder/Websites/useWebsiteData';
import { usePreviewCompilation } from '@/hooks/api/PageBuilder/Editor/usePreviewCompilation';
import { useSnackBarContext } from '@/context/SnackBarContext';

/**
 * Background compile-preview in editor (non-blocking).
 * Ensures websiteData.homepage.preview_link exists even if user lands directly on /editor/:id.
 */
export function useBackgroundCompilePreview(
  editorState: string,
  generationVersionId: string | undefined
): void {
  const { data: websiteData } = useWebsiteData();
  const { compilePreview } = usePreviewCompilation();
  const { createSnackBar } = useSnackBarContext();

  useEffect(() => {
    if (editorState !== 'ready') return;
    if (!generationVersionId) return;

    // If we already have a preview for this generation, do nothing.
    if (
      websiteData?.homepage?.preview_link &&
      websiteData?.homepage?.current_generation_id === generationVersionId
    ) {
      return;
    }

    const compilationKey = `compilation_triggered_${generationVersionId}`;
    if (localStorage.getItem(compilationKey) === 'true') {
      return;
    }

    // Set early to prevent loops/duplicate triggers (matches dashboard behavior).
    localStorage.setItem(compilationKey, 'true');

    compilePreview(generationVersionId).catch((error: unknown) => {
      console.error('[EDITOR_COMPILE_PREVIEW] Compilation failed:', error);
      createSnackBar({
        content: 'Failed to prepare preview in background. You can still publish; preview may be unavailable.',
        severity: 'warning',
        autoHide: true,
      });
    });
  }, [
    editorState,
    generationVersionId,
    websiteData?.homepage?.preview_link,
    websiteData?.homepage?.current_generation_id,
    compilePreview,
    createSnackBar,
  ]);
}
