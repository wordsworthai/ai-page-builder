import React, { useState, useCallback, useMemo, useRef } from 'react';
import { buildPuckFieldTypesFromRegistry } from '../../../../fields/adapters/puckFieldTypes';
import CustomIframeOverride from '../../views/iframes/CustomIframeOverride';
import { WwaiPuckHeader } from '../../WwaiPuckHeader';
import { ClearPuckSelectionOnGenerationStart } from '../../components/ClearPuckSelectionOnGenerationStart';
import { RestrictedFieldsOverride } from '../../components/RestrictedFieldsOverride';
import { StructuralActionBarOverride } from '../../components/StructuralActionBarOverride';
import { useSectionRegenerationContext } from '../../contexts/SectionRegenerationContext';
import puckCss from '@measured/puck/puck.css?inline';
import type { PuckEditorHook, EditorSectionActionBarOverride } from '../../Editor.types';
import type { BlockIndexMapping } from '../../../../contexts/BlockIndexMappingContext';
import { extractBlockIndexMappingsFromPuckData } from '../../utils/data-processing';
import { usePuckDynamicComponentRegistration } from './usePuckDynamicComponentRegistration';
import { useSectionLoadingConfig } from '../sections/useSectionLoadingConfig';

// Memoized overrides to prevent re-renders
const iframeOverride = (props: any) => <CustomIframeOverride {...props} puckCss={puckCss} />;
const componentsOverride = () => null;

// Right-panel override: wraps the editable fields area (where block properties show when selected).
// RestrictedFieldsOverride: when header/footer is selected on non-homepage, shows restricted message
// instead of editable fields. ClearPuckSelectionOnGenerationStart clears selection when regen starts.
const RightPanelFieldsOverride: React.FC<{
  isHomepage: boolean;
  children: React.ReactNode;
  isLoading?: boolean;
  itemSelector?: unknown;
}> = ({ isHomepage, children, isLoading, itemSelector }) => (
  <>
    <ClearPuckSelectionOnGenerationStart />
    <RestrictedFieldsOverride
      isNonHomepage={!isHomepage}
      isLoading={isLoading ?? false}
      itemSelector={itemSelector}
    >
      {children}
    </RestrictedFieldsOverride>
  </>
);

// StructuralActionBarOverride: Overrides the action bar shown when a section is selected.
// Behavior differs by zone and page type: (1) Sections zone: always shows Move up/down, Regenerate, Insert section.
// (2) Header/Footer zones: on homepage only, shows Regenerate + Replace; on non-homepage, these actions are hidden
// since header/footer are inherited from the homepage.
const SectionActionBarOverride: React.FC<{
  getEditorSectionActionBarOverride: () => EditorSectionActionBarOverride;
  children: React.ReactNode;
  label?: string;
  parentAction: React.ReactNode;
}> = ({ getEditorSectionActionBarOverride, children, label, parentAction }) => {
  const override = getEditorSectionActionBarOverride();
  const regenContext = useSectionRegenerationContext();
  return (
    <StructuralActionBarOverride
      label={label}
      parentAction={parentAction}
      onOpenAddPanel={override.onOpenAddSection}
      onRegenerate={regenContext?.openRegenModal}
      generationVersionId={regenContext?.generationVersionId}
      onReplaceHeader={override.onReplaceHeaderFooter}
      onReplaceFooter={override.onReplaceHeaderFooter}
      isNonHomepage={!(override.isHomepage ?? false)}
    >
      {children}
    </StructuralActionBarOverride>
  );
};

interface UsePuckEditorParams {
  initialConfig?: any;
  initialData?: any;
  onDataChange?: (data: any) => void;
  onEditModeChange?: (isEdit: boolean) => void;
  onPublish?: (newData: any) => Promise<void>;
  onSave?: (puckData: any) => Promise<void>;
  isSaving?: boolean;
  onCustomiseClick?: () => void;
  onAddClick?: () => void;
  onLeftSidebarClose?: () => void;
  onBackToDashboard?: () => void;
  onSidebarModalClose?: () => void;
}

/**
 * Custom hook for managing Puck editor state and configuration
 * Handles template data, edit mode, block mappings, and Puck configuration
 */
export function usePuckEditor({
  initialConfig = null,
  initialData = undefined,
  onDataChange,
  onEditModeChange,
  onPublish,
  onSave,
  isSaving = false,
  onCustomiseClick,
  onAddClick,
  onLeftSidebarClose,
  onBackToDashboard,
  onSidebarModalClose,
}: UsePuckEditorParams = {}): PuckEditorHook {
  const [config, setConfig] = useState<any | null>(initialConfig);
  const [currentData, setCurrentData] = useState<any>(initialData);
  const [blockIndexMappings, setBlockIndexMappings] = useState<BlockIndexMapping>({});
  const [isEditMode, setIsEditMode] = useState<boolean>(true);

  // Editor section action bar override ref - populated by Editor via setEditorSectionActionBarOverride
  const editorSectionActionBarOverrideRef = useRef<EditorSectionActionBarOverride>({});

  const extractBlockIndexMappings = useCallback((data: any) => {
    setBlockIndexMappings(extractBlockIndexMappingsFromPuckData(data));
  }, []);

  // Update template data helper
  const updateTemplateData = useCallback(
    (
      updates: Partial<Pick<PuckEditorHook['templateData'], 'config' | 'currentData' | 'blockIndexMappings'>>,
      source?: string
    ) => {
      if (source) {
        console.log(`📝 [PuckEditor] TemplateData update triggered by: ${source}`);
      }
      
      if (updates.config !== undefined) {
        setConfig(updates.config);
      }
      if (updates.currentData !== undefined) {
        const data = updates.currentData;
        setCurrentData({ ...data });
        extractBlockIndexMappings(data);
      }
      if (updates.blockIndexMappings !== undefined) {
        setBlockIndexMappings(updates.blockIndexMappings);
      }
    },
    [extractBlockIndexMappings]
  );

  // ============================================================================
  // Dynamic Component Registration
  // ============================================================================
  
  const dynamicRegistrationFunctions = usePuckDynamicComponentRegistration({
    config,
    currentData,
    setConfig,
    setCurrentData,
    extractBlockIndexMappings,
    onDataChange,
  });

  // Handle data changes
  const onChange = useCallback(
    (updatedData: any) => {
      if (!updatedData) return;
      setCurrentData(updatedData);
      extractBlockIndexMappings(updatedData);
      if (onDataChange) {
        onDataChange(updatedData);
      }
    },
    [extractBlockIndexMappings, onDataChange]
  );

  // Handle edit mode changes
  const handleEditModeChange = useCallback(
    (isEdit: boolean) => {
      setIsEditMode(isEdit);
      if (onEditModeChange) {
        onEditModeChange(isEdit);
      }
    },
    [onEditModeChange]
  );

  // Memoized field types
  const fieldTypes = useMemo(() => buildPuckFieldTypesFromRegistry(), []);

  // Memoized header renderer
  const renderHeader = useCallback(
    () => (
      <WwaiPuckHeader
        onFullPreview={() => {
          if (onSidebarModalClose) onSidebarModalClose();
          handleEditModeChange(false);
        }}
        onPublish={onPublish}
        onSave={onSave}
        isSaving={isSaving}
        onCustomiseClick={onCustomiseClick}
        onAddClick={onAddClick}
        onLeftSidebarClose={onLeftSidebarClose}
        onBackToDashboard={onBackToDashboard}
      />
    ),
    [
      onPublish,
      onSave,
      isSaving,
      onCustomiseClick,
      onAddClick,
      onLeftSidebarClose,
      onBackToDashboard,
      onSidebarModalClose,
      handleEditModeChange,
    ]
  );

  // Memoized overrides - editor section action bar override read from ref (populated by Editor via setEditorSectionActionBarOverride)
  const getEditorSectionActionBarOverride = useCallback(() => editorSectionActionBarOverrideRef.current, []);

  const overrides = useMemo(() => ({
    iframe: iframeOverride,
    fieldTypes: fieldTypes,
    header: renderHeader,
    components: componentsOverride,
    fields: (props: { children: React.ReactNode; isLoading?: boolean; itemSelector?: unknown }) => (
      <RightPanelFieldsOverride
        isHomepage={getEditorSectionActionBarOverride()?.isHomepage ?? false}
        {...props}
      />
    ),
    actionBar: (props: { children: React.ReactNode; label?: string; parentAction: React.ReactNode }) => (
      <SectionActionBarOverride getEditorSectionActionBarOverride={getEditorSectionActionBarOverride} {...props} />
    ),
  }), [fieldTypes, renderHeader, getEditorSectionActionBarOverride]);

  // ============================================================================
  // Section Loading Configuration
  // ============================================================================
  
  useSectionLoadingConfig({
    dynamicRegistrationFunctions,
  });

  const setEditorSectionActionBarOverride = useCallback((override: EditorSectionActionBarOverride) => {
    editorSectionActionBarOverrideRef.current = override;
  }, []);

  return {
    templateData: {
      config,
      currentData,
      blockIndexMappings,
    },
    uiState: {
      isEditMode,
    },
    handlers: {
      onChange,
      onEditModeChange: handleEditModeChange,
    },
    puckConfig: {
      fieldTypes,
      overrides,
    },
    updateTemplateData,
    setEditorSectionActionBarOverride,
    // Dynamic component registration methods (from usePuckDynamicComponentRegistration hook)
    dynamicRegistrationFunctions,
  };
}

// Export type for external use
export type PuckEditorReturn = ReturnType<typeof usePuckEditor>;
