/**
 * Hook to trigger section content regeneration with credit validation.
 * Shows overlay (like partial autopop), no redirect until completion.
 * Manages the credit confirmation modal state internally.
 */
import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageGenerationService } from '@/client';
import { useGenerationState } from '@/context/generation_state/useGenerationState';
import { useSnackBarContext } from '@/context/SnackBarContext';
import { createGenerationError, ERROR_CODES } from '@/streaming/types/generation';
import { setBillingReturnOrigin } from '@/utils/billingReturnStorage';
import type { GenerationError } from '@/streaming/types/generation';

export interface RegenerateContentForSectionRequest {
  generationVersionId: string;
  sectionId: string;
  sectionIndex: number;
}

export interface SectionRegenModalState {
  open: boolean;
  sectionId?: string;
  sectionIndex?: number;
}

export interface UseRegenerateContentForSectionOptions {
  /** Stable getter returning the callback to run before regeneration (e.g. save unsaved changes) */
  getOnBeforeConfirm?: () => (() => Promise<void>) | undefined;
}

export const useRegenerateContentForSection = (
  generationVersionId: string | undefined,
  options?: UseRegenerateContentForSectionOptions
) => {
  const getOnBeforeConfirm = options?.getOnBeforeConfirm;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { setActiveGeneration } = useGenerationState();
  const { createSnackBar } = useSnackBarContext();

  const [sectionRegenModal, setSectionRegenModal] = useState<SectionRegenModalState>({
    open: false,
  });

  const openRegenModal = useCallback((sectionId: string, sectionIndex: number) => {
    setSectionRegenModal({ open: true, sectionId, sectionIndex });
  }, []);

  const closeRegenModal = useCallback(() => {
    setSectionRegenModal({ open: false });
  }, []);

  const mutation = useMutation({
    mutationFn: async ({
      generationVersionId,
      sectionId,
      sectionIndex,
    }: RegenerateContentForSectionRequest) => {
      try {
        const result =
          await PageGenerationService.regenerateSectionApiGenerationsGenerationVersionIdRegenerateSectionPost(
            generationVersionId,
            { section_id: sectionId, section_index: sectionIndex }
          );
        return result;
      } catch (error: any) {
        if (error?.body?.detail) {
          throw createGenerationError({
            status: error.status,
            detail: error.body.detail,
          });
        }
        throw createGenerationError(error, 'Failed to start section regeneration');
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['creditsBalance'] });
      queryClient.invalidateQueries({ queryKey: ['creditsInfo'] });
      queryClient.invalidateQueries({ queryKey: ['creditTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['generation-configs'] });

      setActiveGeneration({
        generationVersionId: data.generation_version_id,
        type: 'partial-section',
        sourceGenerationVersionId: variables.generationVersionId,
        fromPartialAutopop: true,
      });
      navigate(location.pathname, { replace: true });

      createSnackBar({
        content: 'Section regeneration started!',
        severity: 'success',
        autoHide: true,
      });
    },
    onError: (error: GenerationError, variables: RegenerateContentForSectionRequest) => {
      if (
        error.code === ERROR_CODES.INSUFFICIENT_CREDITS ||
        error.code === ERROR_CODES.QUOTA_EXCEEDED
      ) {
        createSnackBar({
          content: error.message,
          severity: 'error',
          autoHide: false,
        });
        setBillingReturnOrigin(`/editor/${variables.generationVersionId}`, {
          action: 'section_regeneration',
        });
        setTimeout(() => navigate('/dashboard/billing'), 2000);
        return;
      }
      createSnackBar({
        content: error.message,
        severity: 'error',
        autoHide: true,
      });
    },
  });

  const confirmRegen = useCallback(async () => {
    const { sectionId, sectionIndex } = sectionRegenModal;
    if (
      sectionId !== undefined &&
      sectionIndex !== undefined &&
      generationVersionId
    ) {
      try {
        await getOnBeforeConfirm?.()?.();
        await mutation.mutateAsync({
          generationVersionId,
          sectionId,
          sectionIndex,
        });
      } finally {
        setSectionRegenModal({ open: false });
      }
    }
  }, [sectionRegenModal, generationVersionId, mutation, getOnBeforeConfirm]);

  return {
    ...mutation,
    sectionRegenModal,
    openRegenModal,
    closeRegenModal,
    confirmRegen,
  };
};
