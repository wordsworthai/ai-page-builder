import { useMemo, useRef } from 'react';
import { useInsertSection } from './useInsertSection';
import { useSections } from '@/hooks/api/PageBuilder/Editor/useSections';
import type { SectionInsertionProps, SectionBrowserProps } from '../../SectionAddition.types';
import type { PuckEditorReturn } from '../puck/usePuckEditor';

/**
 * Hook to manage all section addition functionality (click-to-add workflow).
 * 
 * This hook encapsulates:
 * - Section insertion state and handlers (popup, position selection, insertion)
 * - Section browser state (available sections, loading states)
 * - Integration between section browsing and insertion
 * 
 * Returns grouped props ready to pass to UnifiedEditorView.
 * 
 * @param puckEditor - The puck editor instance
 * @param isReady - Whether the editor is in ready state (only return values if ready)
 * @param selectedCategoryKey - Currently selected category key for fetching sections
 * @param onAfterInsert - Optional callback to call after successfully inserting a section (e.g., close sidebar modal)
 * @returns Object containing sectionInsertion and sectionBrowser props
 */
export function useSectionAddition(
  puckEditor: PuckEditorReturn,
  isReady: boolean,
  selectedCategoryKey?: string | null,
  onAfterInsert?: () => void,
  options?: {
    generationVersionId?: string;
    onSectionAddedForRegeneration?: (sectionId: string, sectionIndex: number) => void;
  }
) {
  // Get insertion logic from useInsertSection hook
  const insertSection = useInsertSection(puckEditor, onAfterInsert, options);
  
  // Fetch sections from API - only when a category is selected
  const { 
    data: sections = [], 
    isLoading: isLoadingSections, 
    error: sectionsError, 
    refetch: refetchSections
  } = useSections(selectedCategoryKey || undefined);

  // Stabilize loadingSections Set reference to prevent unnecessary re-renders
  const loadingSectionsSetRef = useRef(new Set<string>());
  const loadingSectionsSet = loadingSectionsSetRef.current;

  // Memoize sections array by content (section IDs) to prevent unnecessary recreations
  // Compute the key string first, then memoize based on that string
  const sectionsIdsString = sections.map(s => s.section_id).sort().join(',');
  const sectionsKey = useMemo(() => sectionsIdsString, [sectionsIdsString]);
  const memoizedSections = useMemo(() => sections, [sectionsKey]);

  // Memoize currentSections key to prevent unnecessary sectionInsertion recreations
  // currentSections changes when sections are inserted, but we use a key to minimize recreations
  // Compute the key string first, then memoize based on that string
  const currentSectionsIdsString = insertSection.currentSections.map(s => s.id).sort().join(',');
  const currentSectionsKey = useMemo(() => currentSectionsIdsString, [currentSectionsIdsString]);

  // Group section insertion props for cleaner prop passing
  // Note: currentSections is included in state for InsertPositionPopup, but we use a key
  // to minimize unnecessary recreations of the sectionInsertion object
  const sectionInsertion: SectionInsertionProps | undefined = useMemo(() => {
    if (!isReady) return undefined;

    return {
      state: {
        selectedSection: insertSection.selectedSection,
        isInsertPopupOpen: insertSection.isInsertPopupOpen,
        isInserting: insertSection.isInserting,
        currentSections: insertSection.currentSections,
      },
      handlers: {
        onSectionClick: insertSection.handleSectionClick,
        onCloseInsertPopup: insertSection.handleCloseInsertPopup,
        onInsertSection: insertSection.handleInsertSection,
        onReplaceHeader: insertSection.handleReplaceHeader,
        onReplaceFooter: insertSection.handleReplaceFooter,
      },
    };
  }, [
    isReady,
    insertSection.selectedSection,
    insertSection.isInsertPopupOpen,
    insertSection.isInserting,
    currentSectionsKey, // Use key instead of full array to reduce unnecessary recreations
    insertSection.handleSectionClick,
    insertSection.handleCloseInsertPopup,
    insertSection.handleInsertSection,
    insertSection.handleReplaceHeader,
    insertSection.handleReplaceFooter,
  ]);
  
  const sectionBrowser: SectionBrowserProps | undefined = useMemo(() => {
    if (!isReady) return undefined;

    return {
      availableSections: memoizedSections,
      loadingSections: loadingSectionsSet,
      isLoading: isLoadingSections,
      error: sectionsError || undefined,
      onSectionClick: insertSection.handleSectionClick,
      onRetry: refetchSections,
    };
  }, [isReady, memoizedSections, isLoadingSections, sectionsError, insertSection.handleSectionClick, refetchSections, loadingSectionsSet]);

  return {
    sectionInsertion,
    sectionBrowser,
  };
}

// Re-export the type for convenience
export type SectionAdditionReturn = ReturnType<typeof useSectionAddition>;
