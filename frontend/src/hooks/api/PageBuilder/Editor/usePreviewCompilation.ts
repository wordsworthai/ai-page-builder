// /**
//  * Hook to compile preview HTML after generation completes.
//  * 
//  * Flow:
//  * 1. createSiteSpecJson(query_hash) → dev_task_id
//  * 2. fetchTemplateData(dev_task_id) → config + data
//  * 3. buildCleanHtml(config, data) → HTML string
//  * 4. Upload to S3 via backend API
//  * 
//  * FIXED: Uses correct API call syntax for multipart form data.
//  */
// import { useState, useCallback } from 'react';
// import { useQueryClient } from '@tanstack/react-query';
// import { PageGenerationService } from '@/client';
// import { createSiteSpecJson } from '@/services/createsitespec';
// import { useEditorDataProvider } from '@/components/PageBuilder/PuckEditor/utils';
// import { buildCleanHtml } from '@/components/PageBuilder/PuckEditor/utils/exportCleanHtml';
// import { useSnackBarContext } from '@/context/SnackBarContext';
// import type { CompilationStatus } from '@/streaming/types/generation';

// interface CompilePreviewResult {
//   preview_link: string;
//   dev_task_id: string;
// }

// /**
//  * Hook to handle preview compilation workflow
//  * 
//  * @example
//  * const { compilePreview, isCompiling, compilationStatus, error } = usePreviewCompilation();
//  * 
//  * const result = await compilePreview(generation_version_id, query_hash);
//  */
// export const usePreviewCompilation = () => {
//   const queryClient = useQueryClient();
//   const { createSnackBar } = useSnackBarContext();
//   const { fetchTemplateData } = useEditorDataProvider();
  
//   const [isCompiling, setIsCompiling] = useState(false);
//   const [compilationStatus, setCompilationStatus] = useState<CompilationStatus>('idle');
//   const [error, setError] = useState<string | null>(null);

//   const compilePreview = useCallback(
//     async (
//       generationVersionId: string,
//       queryHash: string
//     ): Promise<CompilePreviewResult> => {
//       setIsCompiling(true);
//       setError(null);
      
//       try {
//         // Step 1: Create site spec JSON → get dev_task_id
//         setCompilationStatus('creating_spec');
//         console.log('Step 1: Creating site spec with query_hash:', queryHash);
        
//         const siteSpecResponse = await createSiteSpecJson(queryHash, true);
//         const devTaskId = siteSpecResponse.dev_task_id;
        
//         if (!devTaskId) {
//           throw new Error('No dev_task_id returned from site spec API');
//         }
        
//         console.log('Step 1 complete: dev_task_id =', devTaskId);
        
//         // Step 2: Fetch template data (config + data for Puck)
//         setCompilationStatus('fetching_template');
//         console.log('Step 2: Fetching template data for dev_task_id:', devTaskId);
        
//         const { config, data } = await fetchTemplateData(
//           devTaskId,
//           "https://www.example.com"
//         );
        
//         console.log('Step 2 complete: config and data fetched');
        
//         // Step 3: Build clean HTML
//         setCompilationStatus('building_html');
//         console.log('Step 3: Building HTML from config and data');
        
//         const htmlString = await buildCleanHtml(config, data, {
//           title: "Website Preview",
//           bodyCss: undefined,
//           containerClass: "wwai_container"
//         });
        
//         if (!htmlString || htmlString.length === 0) {
//           throw new Error('buildCleanHtml returned empty HTML');
//         }
        
//         console.log('Step 3 complete: HTML built, size =', htmlString.length, 'bytes');
        
//         // Step 4: Upload to S3 via backend
//         setCompilationStatus('uploading');
//         console.log('Step 4: Uploading HTML to S3');
        
//         // Create File object from HTML string
//         const htmlBlob = new Blob([htmlString], { type: 'text/html' });
//         const htmlFile = new File([htmlBlob], 'index.html', { type: 'text/html' });
        
//         // FIXED: Correct API call syntax for multipart form data (snake_case params)
//         const uploadResponse = await PageGenerationService.compilePreviewApiGenerationsInternalCompilePreviewPost({
//           generation_version_id: generationVersionId,
//           html_file: htmlFile,
//           dev_task_id: devTaskId
//         });
        
//         if (!uploadResponse.success) {
//           throw new Error(uploadResponse.message || 'Upload failed');
//         }
        
//         console.log('Step 4 complete: Upload successful');
//         console.log('Preview link:', uploadResponse.preview_link);
        
//         // Step 5: Invalidate queries to refresh UI
//         setCompilationStatus('completed');
//         queryClient.invalidateQueries({ queryKey: ['generation-status', generationVersionId] });
//         queryClient.invalidateQueries({ queryKey: ['user-websites'] });
        
//         setIsCompiling(false);
        
//         return {
//           preview_link: uploadResponse.preview_link,
//           dev_task_id: devTaskId
//         };
        
//       } catch (err: any) {
//         console.error('Preview compilation failed:', err);
        
//         const errorMessage = err instanceof Error 
//           ? err.message 
//           : 'Failed to compile preview';
        
//         setError(errorMessage);
//         setCompilationStatus('error');
//         setIsCompiling(false);
        
//         // Show error to user
//         createSnackBar({
//           content: `Failed to prepare preview: ${errorMessage}`,
//           severity: 'error',
//           autoHide: true
//         });
        
//         throw err;
//       }
//     },
//     [fetchTemplateData, queryClient, createSnackBar]
//   );

//   return {
//     compilePreview,
//     isCompiling,
//     compilationStatus,
//     error
//   };
// };



/**
 * Hook to compile preview HTML after generation completes.
 * 
 * NEW FLOW:
 * 1. fetchTemplateData(generation_version_id) → config + data from YOUR backend
 * 2. buildCleanHtml(config, data) → HTML string
 * 3. Upload to S3 via backend API
 */
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageGenerationService } from '@/client';
import { useEditorDataProvider } from '@/components/PageBuilder/PuckEditor/components/LiquidEditor/utils';
import { buildCleanHtml } from '@/components/PageBuilder/PuckEditor/components/LiquidEditor/utils/export';
import { useSnackBarContext } from '@/context/SnackBarContext';
import type { CompilationStatus } from '@/streaming/types/generation';

interface CompilePreviewResult {
  preview_link: string;
  generation_version_id: string;
}

export const usePreviewCompilation = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();
  const { fetchTemplateData } = useEditorDataProvider();
  
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationStatus, setCompilationStatus] = useState<CompilationStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const compilePreview = useCallback(
    async (generationVersionId: string): Promise<CompilePreviewResult> => {
      setIsCompiling(true);
      setError(null);
      
      try {
        // ❌ REMOVED: Step 1 createSiteSpecJson (no longer needed)
        
        // Step 1: Fetch template data from YOUR backend
        setCompilationStatus('fetching_template');
        console.log('Step 1: Fetching template data for generation:', generationVersionId);
        
        const { config, data } = await fetchTemplateData(
          generationVersionId,
          "https://www.example.com"
        );
        
        console.log('Step 1 complete: config and data fetched');
        
        // Step 2: Build clean HTML
        setCompilationStatus('building_html');
        console.log('Step 2: Building HTML from config and data');
        
        const htmlString = await buildCleanHtml(config, data, {
          title: "Website Preview",
          bodyCss: undefined,
          containerClass: "wwai_container"
        });
        
        if (!htmlString || htmlString.length === 0) {
          throw new Error('buildCleanHtml returned empty HTML');
        }
        
        console.log('Step 2 complete: HTML built, size =', htmlString.length, 'bytes');
        
        // Step 3: Upload to S3 via backend
        setCompilationStatus('uploading');
        console.log('Step 3: Uploading HTML to S3');
        
        const htmlBlob = new Blob([htmlString], { type: 'text/html' });
        const htmlFile = new File([htmlBlob], 'index.html', { type: 'text/html' });
        
        // ✅ UPDATED: No dev_task_id parameter
        const uploadResponse = await PageGenerationService.compilePreviewApiGenerationsInternalCompilePreviewPost({
          generation_version_id: generationVersionId,
          html_file: htmlFile
        });
        
        if (!uploadResponse.success) {
          throw new Error(uploadResponse.message || 'Upload failed');
        }
        
        console.log('Step 3 complete: Upload successful');
        console.log('Preview link:', uploadResponse.preview_link);
        
        // Step 4: Invalidate queries to refresh UI
        setCompilationStatus('completed');
        queryClient.invalidateQueries({ queryKey: ['generation-status', generationVersionId] });
        queryClient.invalidateQueries({ queryKey: ['user-websites'] });
        
        setIsCompiling(false);
        
        return {
          preview_link: uploadResponse.preview_link,
          generation_version_id: generationVersionId
        };
        
      } catch (err: any) {
        console.error('Preview compilation failed:', err);
        
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Failed to compile preview';
        
        setError(errorMessage);
        setCompilationStatus('error');
        setIsCompiling(false);
        
        createSnackBar({
          content: `Failed to prepare preview: ${errorMessage}`,
          severity: 'error',
          autoHide: true
        });
        
        throw err;
      }
    },
    [fetchTemplateData, queryClient, createSnackBar]
  );

  return {
    compilePreview,
    isCompiling,
    compilationStatus,
    error
  };
};