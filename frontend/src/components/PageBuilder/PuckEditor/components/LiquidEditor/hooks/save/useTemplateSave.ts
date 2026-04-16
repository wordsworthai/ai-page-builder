import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TemplatesService } from '@/client/services/TemplatesService';
import { useSnackBarContext } from '@/context/SnackBarContext';
import type { TemplateSaveHook } from '../../Editor.types';
import {
  prepareSaveData,
  validateSaveChanges,
  buildSuccessMessage,
} from './templateSaveUtils';

interface UseTemplateSaveParams {
  generationVersionId: string;
  currentData: any;
}

/**
 * Custom hook for managing template save functionality
 * Handles saving template changes to the backend
 */
export function useTemplateSave({
  generationVersionId,
  currentData,
}: UseTemplateSaveParams): TemplateSaveHook {
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  const onSave = useCallback(
    async (puckData: any, options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      // Use the latest currentData from closure
      const latestCurrentData = currentData;
      // Validate input (content must be array; structural model also uses zones)
      if (!puckData || !Array.isArray(puckData.content)) {
        if (!silent) {
          console.warn('Invalid Puck data for save');
          createSnackBar({
            content: 'No content to save',
            severity: 'warning',
            autoHide: true,
          });
        }
        return;
      }

      // Prepare save data using utility functions (handles header | sections | footer)
      const saveData = prepareSaveData(puckData, latestCurrentData);
      if (!saveData) {
        if (!silent) {
          createSnackBar({
            content: 'No content to save',
            severity: 'warning',
            autoHide: true,
          });
        }
        return;
      }

      const { requestBody, changes, sectionUpdates } = saveData;

      // Validate that we have changes to save
      if (!validateSaveChanges(sectionUpdates, changes)) {
        if (!silent) {
          createSnackBar({
            content: 'No changes to save',
            severity: 'warning',
            autoHide: true,
          });
        }
        return;
      }

      setIsSaving(true);

      try {
        // Make API call
        const response = await TemplatesService.saveTemplateApiTemplatesGenerationVersionIdPut(
          generationVersionId,
          requestBody
        );

        console.log('Template saved successfully:', response);

        // Invalidate user-websites so Last Edited timestamp updates
        queryClient.invalidateQueries({ queryKey: ['user-websites'] });

        // Show success message
        const successMessage = buildSuccessMessage(sectionUpdates, changes);
        createSnackBar({
          content: `Template saved successfully (${successMessage})`,
          severity: 'success',
          autoHide: true,
        });
      } catch (error: any) {
        console.error('Error saving template:', error);

        const rawDetail =
          error?.body?.detail ?? error?.response?.data?.detail;
        const errorMessage = (() => {
          if (typeof rawDetail === 'string') return rawDetail;
          if (Array.isArray(rawDetail) && rawDetail.length > 0) {
            const first = rawDetail[0];
            return typeof first === 'object' && first?.msg != null
              ? String(first.msg)
              : String(first);
          }
          return error?.message || 'Failed to save template';
        })();
        createSnackBar({
          content: errorMessage,
          severity: 'error',
          autoHide: true,
          autoHideDuration: 8000,
        });
      } finally {
        setIsSaving(false);
      }
    },
    [generationVersionId, currentData, createSnackBar, queryClient, isSaving]
  );

  return {
    saveState: {
      isSaving,
    },
    saveHandlers: {
      onSave,
    },
  };
}
