import { useState, useCallback, useMemo } from 'react';
import type { SectionMetadata, CurrentSection } from '../../SectionAddition.types';
import { usePuckEditor } from '../puck/usePuckEditor';
import { useAddSectionInPlace } from '@/hooks/api/useAddSectionInPlace';
import {
  getPlaceholderComponentKey,
  generatePlaceholderConfig,
} from '../../utils/components/placeholderConfig';
import { createPlaceholderInstanceProps, getBaseSectionIdForApi } from '../../utils/dynamicPuckSectionConfig';
import { extractDisplayName } from '../../utils/hooks/editorDataProvider';
import { ROOT_ZONE_COMPOUNDS } from '../../utils/components/createPuckRoot';

type PuckEditorReturn = ReturnType<typeof usePuckEditor>;

/**
 * Creates a placeholder item for a section and ensures its component is registered in config.
 * Shared by insert-section, replace-header, and replace-footer flows.
 */
function createPlaceholderItem(
  section: SectionMetadata,
  config: Record<string, unknown>,
  data: { content?: unknown[]; zones?: Record<string, unknown[]> }
): { componentKey: string; newItem: { type: string; props: unknown } } | null {
  if (!config || !data) return null;
  const componentKey = getPlaceholderComponentKey(section.section_id);
  if (!(config.components as Record<string, unknown>)?.[componentKey]) {
    (config.components as Record<string, unknown>)[componentKey] = generatePlaceholderConfig(
      section.section_id,
      section.display_name,
      section.category_key
    );
  }
  const instanceId = `${componentKey}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newItem = {
    type: componentKey,
    props: createPlaceholderInstanceProps(
      instanceId,
      section.section_id,
      section.display_name,
      section.category_key
    ),
  };
  return { componentKey, newItem };
}

export type InsertTarget = 'header' | 'sections' | 'footer';

/**
 * Hook to manage section insertion workflow (click-to-add)
 * Handles state, position selection, and insertion logic.
 * Supports structural model: header | sections | footer.
 */
export function useInsertSection(
  puckEditor: PuckEditorReturn,
  onAfterInsert?: () => void,
  options?: {
    generationVersionId?: string;
    onSectionAddedForRegeneration?: (sectionId: string, sectionIndex: number) => void;
  }
) {
  const { mutateAsync: addSectionInPlace } = useAddSectionInPlace();
  const generationVersionId = options?.generationVersionId;
  const onSectionAddedForRegeneration = options?.onSectionAddedForRegeneration;
  // ===== State =====
  const [selectedSection, setSelectedSection] = useState<SectionMetadata | null>(null);
  const [isInsertPopupOpen, setIsInsertPopupOpen] = useState(false);
  const [isInserting, setIsInserting] = useState(false);

  // ===== Computed Values =====
  
  /**
   * Compute current sections from data.content for position selector
   * This helps us to show the user the sections that are currently in the template and then decide 
   * the position where the section should be inserted.
   */
  const currentSections = useMemo((): CurrentSection[] => {
    const data = puckEditor.templateData.currentData;
    
    if (!data?.content) return [];
    
    return data.content.map((item: any, index: number) => ({
      id: item.props?.id || `section-${index}`,
      displayName: item.props?.liquid_section_name ? extractDisplayName(item.props.liquid_section_name) : `Section ${index + 1}`,
      index,
    }));
  }, [puckEditor.templateData.currentData]);

  // ===== Callbacks =====

  /**
   * Insert section into data.content at the given position.
   * Called from InsertPositionPopup when user confirms the position.
   * Uses selectedSection (set when user clicked a section card).
   */
  const performInsertSection = useCallback(
    async (_sectionId: string, position: number) => {
      if (!selectedSection) return;

      setIsInserting(true);
      try {
        const config = puckEditor.templateData.config;
        const data = puckEditor.templateData.currentData;
        const result = createPlaceholderItem(selectedSection, config as Record<string, unknown>, data as { content?: unknown[]; zones?: Record<string, unknown[]> });
        if (!result) {
          setIsInserting(false);
          return;
        }
        const { newItem } = result;
        const newContent = [...(data?.content ?? [])];
        newContent.splice(position, 0, newItem);
        puckEditor.updateTemplateData({
          config: { ...config },
          currentData: { ...data, content: newContent },
        }, 'insertSection');
        setIsInsertPopupOpen(false);
        setSelectedSection(null);
        if (onAfterInsert) onAfterInsert();
        
        // Once insertion has happened on the editor, make a call to backend api call
        // to add the section to backend template, and then give a modal prompt to the user
        // to generate the content for the section with AI.
        // Given the sections are in different zones, add the header count to offset and get the correct 
        // index.
        if (generationVersionId && onSectionAddedForRegeneration) {
          const headerCount = (data?.zones?.[ROOT_ZONE_COMPOUNDS.header]?.length ?? 0);
          const insertIndex = headerCount + position;
          const baseSectionId = getBaseSectionIdForApi(selectedSection.section_id);
          await addSectionInPlace({
            generationVersionId,
            sectionId: baseSectionId,
            insertIndex,
            mode: 'insert',
          });
          onSectionAddedForRegeneration(baseSectionId, insertIndex);
        }
      } catch (error) {
        console.error('[useInsertSection] Failed to insert section:', error);
      } finally {
        setIsInserting(false);
      }
    },
    [selectedSection, puckEditor, onAfterInsert, generationVersionId, onSectionAddedForRegeneration, addSectionInPlace]
  );

  /**
   * Handle section card click - opens the position selector popup
   */
  const handleSectionClick = useCallback(
    (section: SectionMetadata) => {
      setSelectedSection(section);
      setIsInsertPopupOpen(true);
    },
    []
  );

  /**
   * Handle closing the position popup
   */
  const handleCloseInsertPopup = useCallback(() => {
    if (isInserting) return;
    setIsInsertPopupOpen(false);
    setSelectedSection(null);
  }, [isInserting]);

  /**
   * Handle insert section at position (from InsertPositionPopup).
   * sectionId comes from selectedSection; kept for interface compatibility with InsertPositionPopup.
   */
  const handleInsertSection = useCallback(
    (sectionId: string, position: number) => {
      performInsertSection(sectionId, position);
    },
    [performInsertSection]
  );


  /**
   * Replace header zone with a single section. Called from Replace Header flow in sidebar.
   * Header is a single-slot zone, so no position selection needed.
   */
  const handleReplaceHeader = useCallback(
    async (section: SectionMetadata) => {
      setIsInserting(true);
      try {
        const config = puckEditor.templateData.config;
        const data = puckEditor.templateData.currentData;
        const result = createPlaceholderItem(section, config as Record<string, unknown>, data as { content?: unknown[]; zones?: Record<string, unknown[]> });
        if (!result) return;
        const { newItem } = result;
        const zones = { ...(data?.zones ?? {}), [ROOT_ZONE_COMPOUNDS.header]: [newItem] };
        puckEditor.updateTemplateData({
          config: { ...config },
          currentData: { ...data, zones },
        }, 'replaceHeader');
        if (onAfterInsert) onAfterInsert();

        if (generationVersionId && onSectionAddedForRegeneration) {
          const baseSectionId = getBaseSectionIdForApi(section.section_id);
          await addSectionInPlace({
            generationVersionId,
            sectionId: baseSectionId,
            mode: 'replace',
            replaceIndex: 0,
          });
          onSectionAddedForRegeneration(baseSectionId, 0);
        }
      } catch (error) {
        console.error('[useInsertSection] Failed to replace header:', error);
      } finally {
        setIsInserting(false);
      }
    },
    [puckEditor, onAfterInsert, generationVersionId, onSectionAddedForRegeneration, addSectionInPlace]
  );

  /**
   * Replace footer zone with a single section. Called from Replace Footer flow in sidebar.
   * Footer is a single-slot zone, so no position selection needed.
   */
  const handleReplaceFooter = useCallback(
    async (section: SectionMetadata) => {
      setIsInserting(true);
      try {
        const config = puckEditor.templateData.config;
        const data = puckEditor.templateData.currentData;
        const result = createPlaceholderItem(section, config as Record<string, unknown>, data as { content?: unknown[]; zones?: Record<string, unknown[]> });
        if (!result) return;
        const { newItem } = result;
        const zones = { ...(data?.zones ?? {}), [ROOT_ZONE_COMPOUNDS.footer]: [newItem] };
        puckEditor.updateTemplateData({
          config: { ...config },
          currentData: { ...data, zones },
        }, 'replaceFooter');
        if (onAfterInsert) onAfterInsert();

        if (generationVersionId && onSectionAddedForRegeneration) {
          const headerCount = (data?.zones?.[ROOT_ZONE_COMPOUNDS.header]?.length ?? 0);
          const contentCount = (data?.content ?? []).length;
          const replaceIndex = headerCount + contentCount;
          const baseSectionId = getBaseSectionIdForApi(section.section_id);
          await addSectionInPlace({
            generationVersionId,
            sectionId: baseSectionId,
            mode: 'replace',
            replaceIndex,
          });
          onSectionAddedForRegeneration(baseSectionId, replaceIndex);
        }
      } catch (error) {
        console.error('[useInsertSection] Failed to replace footer:', error);
      } finally {
        setIsInserting(false);
      }
    },
    [puckEditor, onAfterInsert, generationVersionId, onSectionAddedForRegeneration, addSectionInPlace]
  );

  return {
    // State
    selectedSection,
    isInsertPopupOpen,
    isInserting,
    currentSections,

    // Actions
    handleSectionClick,
    handleCloseInsertPopup,
    handleInsertSection,
    handleReplaceHeader,
    handleReplaceFooter,
  };
}
