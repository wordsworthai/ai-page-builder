import React, { useRef } from 'react';
import { Puck } from '@measured/puck';
import { HighlightProvider, BlockIndexMappingProvider } from '../../../contexts';
import {
  usePuckConfig,
  usePuckKey,
  usePuckOverrides,
  usePuckTheme,
  type IframeContentType,
} from '../hooks';
import { PreviewModeView } from './PreviewModeView';
import { ErrorStatePuckView } from './ErrorStatePuckView';
import { EditorModals } from './EditorModals';
import type { GenerationStatus } from '@/streaming/types/generation';
import type { SectionInsertionProps, SectionBrowserProps } from '../SectionAddition.types';
import type { PageHtmlEntry } from '@/components/PageBuilder/Dashboard/PublishSiteContainer';

// ============================================================================
// PuckWrapper: Stable component outside UnifiedEditorView
// This prevents React from treating it as a new component type on every render
// ============================================================================
interface PuckWrapperProps {
  puckKey: string;
  puckConfig: any;
  puckData: any;
  puckOverrides: any;
  onPublish?: (data: any) => Promise<void>;
  onChange?: (data: any) => void;
  editorState: string;
}

const PuckWrapper = React.memo(({ 
  puckKey, 
  puckConfig, 
  puckData, 
  puckOverrides,
  onPublish,
  onChange,
  editorState,
}: PuckWrapperProps) => {
  // Use refs to track current values to avoid stale closures
  const editorStateRef = React.useRef(editorState);
  const onChangeRef = React.useRef(onChange);
  
  React.useEffect(() => {
    editorStateRef.current = editorState;
    onChangeRef.current = onChange;
  }, [editorState, onChange]);
  
  // Wrap onChange to ensure it's always called
  // Use refs to always get the latest values (avoids stale closures)
  const wrappedOnChange = React.useCallback((data: any) => {
    const currentOnChange = onChangeRef.current;
    if (currentOnChange) {
      currentOnChange(data);
    }
  }, []); // No dependencies - we use refs to get latest values

  return (
    <Puck
      key={puckKey}
      config={puckConfig}
      data={puckData}
      onPublish={onPublish || (() => {})}
      onChange={wrappedOnChange}
      plugins={[]}
      iframe={{ enabled: true }}
      overrides={puckOverrides}
      metadata={{
        title: editorState === 'ready' 
          ? "Liquid Template Editor" 
          : editorState === 'checking' 
            ? "Checking..." 
            : editorState === 'generating' 
              ? "Building Website..." 
              : "Loading...",
        description: "Built with Weditor"
      }}
    />
  );
}, (prevProps, nextProps) => {
  // Only remount if puckKey changes
  // Puck's data sync feature handles config/data/overrides changes without remounting
  if (prevProps.puckKey !== nextProps.puckKey) {
    return false; // Allow render (remount happens via key prop)
  }
  
  // IMPORTANT: Always allow render when onChange or editorState changes
  // This ensures refs are updated with latest values
  if (prevProps.onChange !== nextProps.onChange ||
      prevProps.editorState !== nextProps.editorState) {
    return false; // Allow render to update refs with latest values
  }
  
  // Allow render when other props change - Puck handles these via data sync without remounting
  if (prevProps.puckConfig !== nextProps.puckConfig ||
      prevProps.puckData !== nextProps.puckData ||
      prevProps.puckOverrides !== nextProps.puckOverrides ||
      prevProps.onPublish !== nextProps.onPublish) {
    return false; // Allow render (key is same, so no remount)
  }
  
  // All props are equal - skip render
  return true;
});

PuckWrapper.displayName = 'PuckWrapper';

/**
 * UnifiedEditorView: Single Puck instance for all states (checking, loading, generating, ready)
 * 
 * This component consolidates all editor views into a single Puck instance that switches
 * between states using updateTemplateData and conditional overrides.
 * 
 * Puck is mounted immediately (even during checking state) so it's ready when generation completes.
 */
export interface UnifiedEditorViewProps {
  // Editor state (includes 'checking' and 'error' - handled internally)
  editorState: 'checking' | 'loading' | 'generating' | 'ready' | 'error';
  iframeContentType: IframeContentType;
  /** True if we went directly to 'final' without going through active generation */
  isDirectLoad?: boolean;
  // Template data (from usePuckEditor)
  templateConfig?: any;
  templateData?: any;
  blockIndexMappings?: any;
  
  // Generation state (for generating mode)
  generationVersionId: string;
  generationStatus?: GenerationStatus;
  /** When true, shows overlay and animation for updating existing template */
  updateTemplateGenerationOverlayOverride?: boolean;
  /** Update generation status (for EditorModals - needs full status object) */
  updateTemplateGenerationStatus?: GenerationStatus;
  isModalOpen: boolean;
  onOpenGenerationModal?: () => void;
  onCloseGenerationModal?: () => void;
  isGenerationModalManuallyOpened?: boolean;
  
  // Puck config
  fieldTypes: any;
  overrides?: any; // For ready mode
  
  // Handlers (for ready mode)
  onChange?: (data: any) => void;
  onPublishClick?: (data: any) => Promise<void>;
  
  // Sidebar state (for ready mode)
  sidebarState?: {
    sidebarModalOpen: boolean;
    sidebarModalMode: 'customise' | 'add';
    selectedCategory: any;
  };
  sidebarHandlers?: {
    onCustomiseClick: () => void;
    onAddClick: () => void;
    onCloseSidebarModal: () => void;
    onCategoryClick: (category: any) => void;
  };
  
  // Section browser (available sections)
  sectionBrowser?: SectionBrowserProps;
  
  // Section insertion (click-to-add)
  sectionInsertion?: SectionInsertionProps;
  
  // Publish state (for ready mode)
  publishState?: {
    publishDialogOpen: boolean;
    generatedHtml: string | null;
    isGeneratingHtml: boolean;
    pageHtmls?: PageHtmlEntry[];
  };
  publishHandlers?: {
    onPublishClick: (newData: any) => Promise<void>;
    onClosePublishDialog: () => void;
  };
  
  // UI state (for ready mode)
  isEditMode?: boolean;
  onEditModeChange?: (isEdit: boolean) => void;
  
  // Callbacks
  onBackToDashboard: () => void;
  /** Page selection handler (for curated pages) */
  onPageClick?: (page: any) => void;
  /** Save unsaved changes before generation (called by CustomiseContent) */
  onSaveBeforeGenerate?: () => Promise<void>;
  /** Loading state when page generation is starting */
  isPageGenerationStarting?: boolean;
  /** Retry: retry generation from last checkpoint (for editor failure view) */
  onRetry?: () => void;
  /** Start over: navigate to create-site (for editor failure view) */
  onStartOver?: () => void;
  /** Open Contact Support dialog */
  onOpenContactSupport?: () => void;
  /** Override template config/data when navigating in preview mode */
  previewOverrideData?: { config: any; data: any } | null;
  /** Handler for internal link clicks in preview mode */
  onPreviewInternalLinkClick?: (path: string) => void;
}

export const UnifiedEditorView: React.FC<UnifiedEditorViewProps> = React.memo(({
  editorState,
  iframeContentType,
  isDirectLoad = false,
  templateConfig,
  templateData,
  blockIndexMappings,
  generationVersionId,
  generationStatus,
  updateTemplateGenerationOverlayOverride = false,
  updateTemplateGenerationStatus,
  isModalOpen,
  onOpenGenerationModal,
  onCloseGenerationModal,
  isGenerationModalManuallyOpened,
  fieldTypes,
  overrides,
  onChange,
  onPublishClick,
  sidebarState,
  sidebarHandlers,
  sectionBrowser,
  sectionInsertion,
  publishState,
  publishHandlers,
  isEditMode = true,
  onEditModeChange,
  onBackToDashboard,
  onPageClick,
  onSaveBeforeGenerate,
  isPageGenerationStarting = false,
  onRetry,
  onStartOver,
  onOpenContactSupport,
  previewOverrideData,
  onPreviewInternalLinkClick,
}) => {
  // ============================================================================
  // Hooks: Get config, data, key, and overrides
  // ============================================================================
  
  // Config/data: always use real when available (Puck syncs data changes automatically)
  const { puckConfig, puckData } = usePuckConfig({
    templateConfig,
    templateData,
  });
  
  // Key only depends on generationVersionId - stable across state transitions
  // Puck's data sync feature handles data updates without remounting
  const puckKey = usePuckKey({
    generationVersionId,
  });
  
  const puckOverrides = usePuckOverrides({
    editorState,
    iframeContentType,
    isDirectLoad,
    generationStatus,
    updateTemplateGenerationOverlayOverride,
    templateConfig,
    templateData,
    fieldTypes,
    overrides,
    onBackToDashboard,
    onRetry,
    onStartOver,
    onOpenContactSupport,
  });

  // Pass stable data during ready-state editing to prevent Puck's data sync from re-running
  // on every keystroke. When user types, we get onChange → parent updates templateData →
  // passing it back triggers Puck's sync effect → setState → re-renders → input loses focus.
  // Only update the ref when templateConfig changes (new template load).
  const dataForPuckRef = useRef<any>(null);
  const previousTemplateConfigRef = useRef<any>(null);
  const isReadyWithTemplate =
    editorState === 'ready' && !!(templateConfig && templateData);
  if (isReadyWithTemplate) {
    if (templateConfig !== previousTemplateConfigRef.current) {
      previousTemplateConfigRef.current = templateConfig;
      dataForPuckRef.current = puckData;
    } else if (!isEditMode) {
      // In preview mode: stash latest data so when we remount Puck we have current state
      dataForPuckRef.current = puckData;
    }
  } else {
    previousTemplateConfigRef.current = null;
    dataForPuckRef.current = null;
  }
  const dataToPassToPuck = isReadyWithTemplate
    ? (dataForPuckRef.current ?? puckData)
    : puckData;

  // Inject Puck theme CSS variables into main document head
  // This affects Puck's sidebars (rendered in main document) and iframe content
  usePuckTheme();

  // ============================================================================
  // Handle Conditional Rendering (after all hooks are called)
  // ============================================================================
  
  // Handle Edit/Preview Mode for Ready State
  if (editorState === 'ready' && !isEditMode) {
    const previewConfig = previewOverrideData?.config ?? templateConfig;
    const previewData = previewOverrideData?.data ?? templateData;
    return (
      <PreviewModeView
        templateConfig={previewConfig}
        templateData={previewData}
        onEditModeChange={onEditModeChange}
        editorState={editorState}
        isModalOpen={isModalOpen}
        generationVersionId={generationVersionId}
        generationStatus={generationStatus}
        sidebarState={sidebarState}
        sidebarHandlers={sidebarHandlers}
        publishState={publishState}
        publishHandlers={publishHandlers}
        onInternalLinkClick={onPreviewInternalLinkClick}
      />
    );
  }
  
  // Error state: invalid generation ID or network error
  if (editorState === 'error') {
    return (
      <ErrorStatePuckView
        overrides={puckOverrides}
        errorType="invalid-generation-id"
      />
    );
  }
  
  // If ready state but no template data, show error state inside Puck
  if (editorState === 'ready' && (!templateConfig || !templateData)) {
    return (
      <ErrorStatePuckView
        overrides={puckOverrides}
        errorType="no-template-data"
      />
    );
  }

  // ============================================================================
  // Main Puck Rendering (for loading, generating, and ready edit mode)
  // ============================================================================
  
  // Always wrap Puck with providers to prevent remounting when transitioning to ready state
  // Use empty mappings if blockIndexMappings doesn't exist yet
  const mappings = blockIndexMappings || {};

  return (
    <div className="w-full h-screen bg-gray-50">
      <div className="h-full puck-editor-container">
        <BlockIndexMappingProvider mappings={mappings}>
          <HighlightProvider>
            <PuckWrapper
              puckKey={puckKey}
              puckConfig={puckConfig}
              puckData={dataToPassToPuck}
              puckOverrides={puckOverrides}
              onPublish={onPublishClick}
              onChange={onChange}
              editorState={editorState}
            />
          </HighlightProvider>
        </BlockIndexMappingProvider>
      </div>
      
      {/* Render modals */}
      <EditorModals
        editorState={editorState}
        isModalOpen={isModalOpen}
        generationVersionId={generationVersionId}
        onOpenGenerationModal={onOpenGenerationModal}
        onCloseGenerationModal={onCloseGenerationModal}
        isGenerationModalManuallyOpened={isGenerationModalManuallyOpened}
        generationStatus={generationStatus}
        updateTemplateGenerationStatus={updateTemplateGenerationStatus}
        sidebarState={sidebarState}
        sidebarHandlers={sidebarHandlers}
        onPageClick={onPageClick}
        onSaveBeforeGenerate={onSaveBeforeGenerate}
        isPageGenerationStarting={isPageGenerationStarting}
        sectionBrowser={sectionBrowser}
        sectionInsertion={sectionInsertion}
        publishState={publishState}
        publishHandlers={publishHandlers}
        isNonHomepage={
          (templateData?.root?.props?.page_structure_info?.page_type ?? "homepage") !== "homepage"
        }
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render when props that affect Puck rendering change
  // Sidebar state changes (like sidebarModalOpen) don't affect Puck, so we ignore them
  
  // Props that affect Puck rendering
  if (prevProps.editorState !== nextProps.editorState) return false;
  if (prevProps.iframeContentType !== nextProps.iframeContentType) return false;
  if (prevProps.isModalOpen !== nextProps.isModalOpen) return false;
  if (prevProps.generationStatus?.status !== nextProps.generationStatus?.status) return false;
  if (prevProps.generationStatus?.progress !== nextProps.generationStatus?.progress) return false;
  if (prevProps.updateTemplateGenerationStatus?.status !== nextProps.updateTemplateGenerationStatus?.status) return false;
  if (prevProps.updateTemplateGenerationStatus?.progress !== nextProps.updateTemplateGenerationStatus?.progress) return false;
  if (prevProps.updateTemplateGenerationOverlayOverride !== nextProps.updateTemplateGenerationOverlayOverride) return false;
  if (prevProps.templateConfig !== nextProps.templateConfig) return false;
  if (prevProps.templateData !== nextProps.templateData) return false;
  if (prevProps.isEditMode !== nextProps.isEditMode) return false;
  if (prevProps.generationVersionId !== nextProps.generationVersionId) return false;
  if (prevProps.fieldTypes !== nextProps.fieldTypes) return false;
  if (prevProps.overrides !== nextProps.overrides) return false;
  if (prevProps.onChange !== nextProps.onChange) return false;
  if (prevProps.onPublishClick !== nextProps.onPublishClick) return false;
  if (prevProps.previewOverrideData !== nextProps.previewOverrideData) return false;
  if (prevProps.onPreviewInternalLinkClick !== nextProps.onPreviewInternalLinkClick) return false;
  
  // Props that DON'T affect Puck rendering - we ignore these to prevent unnecessary re-renders
  // sidebarState - only affects modals, not Puck
  // publishState - only affects publish dialog, not Puck
  // sectionBrowser - only affects modals, not Puck
  // sectionInsertion - only affects modals, not Puck
  
  // All relevant props are equal - skip render
  return true;
});

export default UnifiedEditorView;
