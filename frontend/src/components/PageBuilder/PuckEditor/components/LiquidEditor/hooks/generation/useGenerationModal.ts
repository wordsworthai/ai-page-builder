import { useState, useEffect, useCallback, useRef } from 'react';
import { useGenerationEventContext } from '../../contexts/GenerationEventContext';
import type { GenerationStatus } from '@/streaming/types/generation';

interface UseGenerationModalParams {
  generationStatus?: GenerationStatus | null;
  /** Template updating generation status (for updating existing template) - takes priority over generationStatus */
  updateTemplateGenerationStatus?: GenerationStatus | null;
  /** 
   * When true, sets the initial value of isModalOpen to true on mount.
   * 
   * This is useful when navigating from use-template or other flows where we want
   * the generation modal to be visible immediately, even before generation events fire.
   * This ensures the generating animation shows right away without waiting for
   * GENERATION_STARTED event, providing a smoother user experience.
   */
  openModalOnInit?: boolean;
}

interface UseGenerationModalReturn {
  isModalOpen: boolean;
  isManuallyOpened: boolean;
  openModal: () => void;
  closeModal: () => void;
}

/**
 * Hook to manage generation modal visibility - completely decoupled from editor state.
 * 
 * Listens to generation events only:
 * - Opens on GENERATION_STARTED or UPDATE_STARTED
 * - Closes on GENERATION_COMPLETED or UPDATE_COMPLETED (with delay)
 * 
 * Also checks current generation status on mount to handle cases where
 * generation started before the hook subscribed to events.
 * 
 * This allows the modal to work independently of editor state and be reusable.
 */
export function useGenerationModal({
  generationStatus,
  updateTemplateGenerationStatus,
  openModalOnInit = false,
}: UseGenerationModalParams = {}): UseGenerationModalReturn {
  const [isModalOpen, setIsModalOpen] = useState(openModalOnInit);
  const [isManuallyOpened, setIsManuallyOpened] = useState(false);
  const isManuallyOpenedRef = useRef(false); // Ref to track current value for event handlers
  const isModalOpenRef = useRef(false); // Ref to track current modal open state for event handlers
  const { subscribe } = useGenerationEventContext();

  // Sync refs with state
  useEffect(() => {
    isManuallyOpenedRef.current = isManuallyOpened;
  }, [isManuallyOpened]);

  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  // Check if generation is already in progress (handles case where event fired before subscription)
  // Only use update status if it's actually processing, otherwise use regular generation status
  // This prevents showing stale completed update status when a new generation starts
  useEffect(() => {
    // dont use updateTemplateGenerationStatus if it's not processing and already completed.
    const statusToCheck = (updateTemplateGenerationStatus?.status === 'processing') 
      ? updateTemplateGenerationStatus 
      : generationStatus;
    if (statusToCheck?.status === 'processing' && !isModalOpen) {
      setIsModalOpen(true);
      setIsManuallyOpened(false); // Programmatic open
      isManuallyOpenedRef.current = false; // Update ref immediately
    } else if (statusToCheck?.status === 'completed' && isModalOpen) {
      // Only auto-close if NOT manually opened
      if (!isManuallyOpenedRef.current) {
        const timer = setTimeout(() => {
          setIsModalOpen(false);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        ;
      }
    }
  }, [updateTemplateGenerationStatus?.status, generationStatus?.status, isModalOpen]);

  useEffect(() => {
    let closeTimer: NodeJS.Timeout | null = null;

    const unsubscribe = subscribe((event) => {
      // Clear any pending close timer
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }

      switch (event.type) {
        case 'GENERATION_STARTED':
        case 'UPDATE_STARTED':
          // Only set to programmatic if modal is not already open (don't override manual open)
          // Use ref to get current value (not closure value)
          if (!isModalOpenRef.current) {
            setIsModalOpen(true);
            setIsManuallyOpened(false); // Programmatic open
            isManuallyOpenedRef.current = false; // Update ref immediately
            isModalOpenRef.current = true; // Update ref immediately
          } else {
              ;
          }
          break;

        case 'GENERATION_COMPLETED':
        case 'UPDATE_COMPLETED':
          // Only auto-close if NOT manually opened (use ref to get current value)
          if (!isManuallyOpenedRef.current) {
            // Small delay to allow user to see final state before closing
            closeTimer = setTimeout(() => {
              setIsModalOpen(false);
              closeTimer = null;
            }, 1000);
          } else {
          }
          break;

        case 'GENERATION_FAILED':
          // Keep modal open to show error (error will be shown in modal content)
          break;
      }
    });

    return () => {
      unsubscribe();
      if (closeTimer) {
        clearTimeout(closeTimer);
      }
    };
  }, [subscribe]);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
    setIsManuallyOpened(true); // Mark as manually opened - ALWAYS set this when manually opened
    isManuallyOpenedRef.current = true; // Update ref immediately
    isModalOpenRef.current = true; // Update ref immediately
  }, [isModalOpen, isManuallyOpened]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setIsManuallyOpened(false); // Reset manual flag
    isManuallyOpenedRef.current = false; // Update ref immediately
    isModalOpenRef.current = false; // Update ref immediately
  }, []);

  return {
    isModalOpen,
    isManuallyOpened,
    openModal,
    closeModal,
  };
}
