import React, { useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { registerLiquidFieldTypes } from '../../fields/registerLiquidFieldTypes';
import { usePageGenerationStatus } from '@/streaming/hooks';
import { UnifiedEditorView } from './views/UnifiedEditorView';
import {
  usePuckEditor,
  useSidebar,
  usePublish,
  useTemplateSave,
  useEditorStateMachine,
  useGenerationModal,
  useIframeContent,
  useGenerationTemplateLoader,
  useCloseCustomiseSidebarOnGeneration,
  useCheckingStatusOverlay,
  useSectionAddition,
  useSectionRegeneration,
  useBackgroundCompilePreview,
  useStripeReturnPublishHandler,
  useSelectExistingTemplate,
  useUpdateTemplateGeneration,
  useRedirectToBaseWhenPartialProcessing,
  usePreviewInternalLinkNavigation,
} from './hooks';
import { GenerationEventProvider, useGenerationEventContext } from './contexts/GenerationEventContext';
import { GenerationEventEmitter } from './components/GenerationEventEmitter';
import { CheckingStatusOverlay } from './components/CheckingStatusOverlay';
import { WwaiPuckHeader } from './WwaiPuckHeader';
import { useGenerationRetry } from '@/hooks/api/PageBuilder/Generation/useGenerationRetry';
import { SectionRegenerationProvider } from './contexts/SectionRegenerationContext';
import { CreditConfirmationModal } from './modals/SidebarModal/editor/CreditConfirmationModal';
import { useWebsitePages } from '@/hooks/api/PageBuilder/Websites/useWebsitePages';
import { useGenerationConfigs } from '@/hooks/api/PageBuilder/Generation/useGenerationConfigs';
import type { CuratedPageOption } from '@/hooks/api/PageBuilder/Editor/useCuratedPages';
import ContactDialog from '@/components/Shared/Dialogs/ContactDialog';
import { useCurrentUser } from '@/hooks';
import { useGenerationState } from '@/context/generation_state/useGenerationState';
import {
  getShouldDisableEditorButtons,
  getShouldOpenGenerationModalOnInit,
} from './Editor.utils';
import { useEditorDataProvider } from './utils';

registerLiquidFieldTypes();

interface EditorContentProps {
  // Original loaded template generation version ID and status
  generationVersionId: string;
  generationStatus: any;
  
  // Generation version id and status when template is being updated.
  updateTemplateGenerationStatus?: any;
  updateTemplateGenerationVersionId?: string;
  
  // Status check for the original loaded template.
  isCheckingStatus: boolean;
  statusCheckError: boolean;
}

// Pass generation status and related params to EditorContent.
// Why props instead of just events?
// - Events are for state changes/transitions, but we need the CURRENT state immediately
//   for initial rendering and state machine initialization
// - The state machine needs to know if generation is already complete, in progress, or failed
//   when the component first mounts - it can't wait for events to fire
// - isCheckingStatus and statusCheckError are synchronous loading/error states needed
//   for immediate rendering decisions (showing loading spinner, error states, etc.)
// - Events handle transitions (e.g., GENERATION_STARTED → GENERATION_COMPLETED), but
//   we need the initial state to determine which view to show right away
// In summary: Events = "something changed", Props = "current state"
const EditorContent: React.FC<EditorContentProps> = ({
  generationVersionId,
  generationStatus,
  updateTemplateGenerationStatus,
  updateTemplateGenerationVersionId,
  isCheckingStatus,
  statusCheckError,
}) => {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const { state: genState } = useGenerationState();

  // ===== Contact Support Dialog =====
  const [contactDialogOpen, setContactDialogOpen] = React.useState(false);
  const handleOpenContactSupport = useCallback(() => {
    setContactDialogOpen(true);
  }, []);
  const handleCloseContactSupport = useCallback(() => {
    setContactDialogOpen(false);
  }, []);

  // ===== Multi-Page Context =====
  // Fetch all pages and unfiltered configs to determine which page we're on
  const { data: allPages = [] } = useWebsitePages();
  const { data: allConfigsData } = useGenerationConfigs();
  const { fetchTemplateData } = useEditorDataProvider();

  // Determine current page from generationVersionId by looking up the config's page_id
  const currentPageId = React.useMemo(() => {
    const configs = allConfigsData?.configs ?? [];
    const match = configs.find((c) => c.generation_version_id === generationVersionId);
    return match?.page_id ?? undefined;
  }, [allConfigsData, generationVersionId]);

  const isHomepage = React.useMemo(() => {
    if (!currentPageId) return true; // Default to homepage assumption
    const page = allPages.find((p) => p.page_id === currentPageId);
    return page ? page.page_path === '/' : true;
  }, [currentPageId, allPages]);

  // ===== Preview Mode Internal Link Navigation =====
  const {
    previewOverrideData,
    handlePreviewInternalLinkClick,
    clearPreviewOverride,
  } = usePreviewInternalLinkNavigation({ allPages, currentPageId });

  // ===== Generation Retry (editor) =====
  const { mutate: retryGeneration } = useGenerationRetry();

  // ===== Back to Dashboard =====
  const handleBackToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  // ===== Feature Hooks =====
  const sidebar = useSidebar();

  // Close Customise sidebar when generation starts or when in partial generation state on init
  useCloseCustomiseSidebarOnGeneration(
    sidebar.sidebarHandlers.onCloseSidebarModal,
    updateTemplateGenerationStatus
  );

  // Initialize puckEditor first (manages template data)
  const puckEditor = usePuckEditor({
    onBackToDashboard: handleBackToDashboard,
    onCustomiseClick: sidebar.sidebarHandlers.onCustomiseClick,
    onAddClick: sidebar.sidebarHandlers.onAddClick,
    onLeftSidebarClose: () => {
      if (sidebar.sidebarState.sidebarModalOpen) {
        sidebar.sidebarHandlers.onCloseSidebarModal();
      }
    },
    onSidebarModalClose: sidebar.sidebarHandlers.onCloseSidebarModal,
  });

  // ===== Editor State Machine =====
  // Manages state transitions on what to show to the user: checking → generating → loading → ready
  // Loaded initially from props, but transitions are handled via events.
  const { editorState } = useEditorStateMachine({
    generationStatus,
    isCheckingStatus,
    statusCheckError,
  });

  // Decide what status to check for the generation modal.
  // If the update template generation status is processing, use that. Otherwise, use the generation status.
  const statusToCheck = (updateTemplateGenerationStatus?.status === 'processing') ? updateTemplateGenerationStatus : generationStatus;
  const shouldOpenModalOnInit = getShouldOpenGenerationModalOnInit(genState,  isCheckingStatus, statusToCheck);

  const generationModal = useGenerationModal({
    generationStatus,
    updateTemplateGenerationStatus,
    openModalOnInit: shouldOpenModalOnInit,
  });
  const iframeContent = useIframeContent();

  // ===== Generation Template Loader =====
  // Loads templates based on generation events (GENERATION_COMPLETED, etc.)
  // Takes generationStatus to determine if template is already loaded on mount.
  // Note: Called for side effects (event subscription and template loading)
  // Return value not used, but hook must be called for effects to run
  // Hook internally handles fetchTemplateData and error notifications
  
  // Pass updateTemplateGenerationVersionId to prevent loading intermediate templates for pending generation.
  // if updateTemplateGenerationVersionId is set, we are updating an existing template.
  // In this case, we don't want to load intermediate templates. 
  // The generation events will be fired for the update template generation, but we will not load 
  // a new or intermediate template.
  useGenerationTemplateLoader({
    editorState,
    generationVersionId,
    updateTemplateData: puckEditor.updateTemplateData,
    generationStatus,
    updateTemplateGenerationVersionId,
  });

  // Initialize template save hook (depends on currentData - updates via closure)
  const templateSave = useTemplateSave({
    generationVersionId,
    currentData: puckEditor.templateData.currentData,
  });

  // Save before any generation trigger - persists unsaved changes so they are not lost
  const saveBeforeGenerate = useCallback(async () => {
    const data = puckEditor.templateData.currentData;
    await templateSave.saveHandlers.onSave(data, { silent: true });
  }, [puckEditor.templateData.currentData, templateSave.saveHandlers.onSave]);

  // ===== Section Regeneration (modal + mutation) =====
  const sectionRegenerationHook = useSectionRegeneration({
    generationVersionId,
    getOnBeforeConfirm: () => saveBeforeGenerate,
  });

  // Populate section overrides - onRegenerate/generationVersionId come from SectionRegenerationContext
  puckEditor.setEditorSectionActionBarOverride({
    isHomepage,
    onOpenAddSection: sidebar.sidebarHandlers.onOpenAddSection,
    onReplaceHeaderFooter: sidebar.sidebarHandlers.onOpenReplaceHeaderFooter,
  });

  // Initialize publish hook (depends on config - updates via closure)
  // Passes allPages, currentPageId, and fetchTemplateData so publish builds HTML for ALL pages
  const publish = usePublish({
    config: puckEditor.templateData.config,
    getUpdateTemplateData: () => puckEditor.updateTemplateData,
    allPages,
    currentPageId,
    fetchTemplateData,
  });

  // Compile and build the preview in the background for given generation version id.
  useBackgroundCompilePreview(editorState, generationVersionId);

  // When user returns from Stripe after subscribe-from-publish (URL has open_publish_modal or publish_after_payment + session_id),
  // this hook processes the checkout session, invalidates user/plan/credits, and opens the publish dialog.
  useStripeReturnPublishHandler(publish.publishHandlers.openPublishDialogWithPendingData);

  // Wrap onEditModeChange to set isDirectLoad=true when switching to preview mode
  // This prevents the animation from showing when coming back from preview.
  // Save before switching to preview so unsaved changes are persisted.
  const wrappedOnEditModeChange = useCallback(
    async (isEdit: boolean) => {
      if (isEdit) {
        clearPreviewOverride();
        puckEditor.handlers.onEditModeChange(isEdit);
      } else {
        try {
          // await saveBeforeGenerate();
        } finally {
          iframeContent.setIsDirectLoad(true);
          puckEditor.handlers.onEditModeChange(isEdit);
        }
      }
    },
    [puckEditor.handlers.onEditModeChange, iframeContent, clearPreviewOverride, saveBeforeGenerate]
  );

  // When generation fails inside the editor, use this as the callback for
  // retrying the workflow from the last checkpoint instead of just navigating.
  const handleRetryInEditor = useCallback(() => {
    if (!generationVersionId) {
      // Fallback: if for some reason we don't know the generation id, go back to dashboard
      handleBackToDashboard();
      return;
    }
    retryGeneration(generationVersionId);
  }, [generationVersionId, retryGeneration, handleBackToDashboard]);

  // Start over: navigate to create-site (mirror dashboard "Start Over")
  const handleStartOver = useCallback(() => {
    navigate('/create-site');
  }, [navigate]);

  // ===== Section Addition (Click-to-Add) Logic =====
  // Must be before puckEditorWithHandlers so sectionInsertion is available for action bar.
  // This is relevant because we also provide an option to insert a section from action bar.
  const { sectionInsertion, sectionBrowser } = useSectionAddition(
    puckEditor,
    editorState === 'ready',
    sidebar.sidebarState.selectedCategory?.key || null,
    editorState === 'ready' ? sidebar.sidebarHandlers.onCloseSidebarModal : undefined,
    generationVersionId
      ? {
          generationVersionId,
          onSectionAddedForRegeneration: sectionRegenerationHook.openRegenModal,
        }
      : undefined
  );

  // fields and actionBar overrides are built in usePuckEditor (editor section action bar override via setEditorSectionActionBarOverride)
  const puckEditorWithHandlers = {
    ...puckEditor,
    handlers: {
      ...puckEditor.handlers,
    },
    puckConfig: {
      ...puckEditor.puckConfig,
      overrides: {
        ...puckEditor.puckConfig.overrides,
        header: () => (
          <WwaiPuckHeader
            onFullPreview={() => {
              sidebar.sidebarHandlers.onCloseSidebarModal();
              wrappedOnEditModeChange(false);
            }}
            onPublish={publish.publishHandlers.onPublishClick}
            onSave={templateSave.saveHandlers.onSave}
            isSaving={templateSave.saveState.isSaving}
            onCustomiseClick={sidebar.sidebarHandlers.onCustomiseClick}
            onLeftSidebarClose={() => {
              if (sidebar.sidebarState.sidebarModalOpen) {
                sidebar.sidebarHandlers.onCloseSidebarModal();
              }
            }}
            onBackToDashboard={handleBackToDashboard}
            onOpenSectionTemplates={() => {
              // Open sidebar modal in add mode to show categories
              // User must select a category first - no default selection
              sidebar.sidebarHandlers.onAddClick();
            }}
            generationVersionId={generationVersionId}
            allButtonsDisabled={getShouldDisableEditorButtons(updateTemplateGenerationStatus?.status, editorState, generationStatus?.status)}
            // In all cases, enable the dashboard button, so we can navigate back to the dashboard.
            enableDashboardButton={true}
            currentPageId={currentPageId}
            isHomepage={isHomepage}
            pages={allPages}
          />
        ),
      },
    },
  };

  // ===== Page Selection (Fresh Generation) =====
  const { mutate: selectExistingTemplate, isPending: isPageGenerationStarting } = useSelectExistingTemplate({
    onCloseModal: generationModal.closeModal,
  });

  const handleCuratedPageClick = useCallback(async (page: CuratedPageOption) => {
    if (!generationVersionId) return;
    await saveBeforeGenerate();
    selectExistingTemplate({
      source_generation_version_id: generationVersionId,
      section_ids: page.section_ids,
      page_path: page.page_path,
      page_title: page.page_title,
    });
    // Close sidebar immediately as processing starts
    if (editorState === 'ready') {
      sidebar.sidebarHandlers.onCloseSidebarModal();
    }
  }, [generationVersionId, selectExistingTemplate, editorState, sidebar.sidebarHandlers, saveBeforeGenerate]);

  // =========================================================================
  // RENDER: Always use unified Puck instance (handles all states internally)
  // =========================================================================

  // Puck is mounted immediately (even during checking state) so it's ready
  // when generation completes. All states (checking, loading, generating, ready, error)
  // are handled inside UnifiedEditorView.
  
  // Compute updateTemplateGenerationOverlayOverride: show overlay when update generation is processing.
  // False when status is 'failed' or undefined (reverts to existing template, overlay fades out).
  const updateTemplateGenerationOverlayOverride =
    updateTemplateGenerationStatus?.status === 'processing';

  const sectionRegenContextValue = React.useMemo(
    () => ({
      openRegenModal: sectionRegenerationHook.openRegenModal,
      generationVersionId,
    }),
    [sectionRegenerationHook.openRegenModal, generationVersionId]
  );

  return (
    /**
     * SectionRegenerationProvider: Supplies openRegenModal + generationVersionId to descendants
     * without flowing through setEditorSectionActionBarOverride. This breaks the cyclic dependency between
     * usePuckEditor, useRegenerateContentForSection, and section overrides.
     *
     * Consumer: hooks/puck/usePuckEditor.tsx → SectionActionBarOverride reads via
     * useSectionRegenerationContext() and passes onRegenerate/generationVersionId to
     * StructuralActionBarOverride (Regenerate button).
     */
    <SectionRegenerationProvider value={sectionRegenContextValue}>
    <>
    <UnifiedEditorView
      editorState={editorState}
      iframeContentType={iframeContent.contentType}
      isDirectLoad={iframeContent.isDirectLoad}
      templateConfig={puckEditor.templateData.config}
      templateData={puckEditor.templateData.currentData}
      blockIndexMappings={puckEditor.templateData.blockIndexMappings}
      generationVersionId={generationVersionId}
      generationStatus={generationStatus}
      updateTemplateGenerationOverlayOverride={updateTemplateGenerationOverlayOverride}
      updateTemplateGenerationStatus={updateTemplateGenerationStatus}
      isModalOpen={generationModal.isModalOpen}
      onOpenGenerationModal={generationModal.openModal}
      onCloseGenerationModal={generationModal.closeModal}
      isGenerationModalManuallyOpened={generationModal.isManuallyOpened}
      fieldTypes={puckEditor.puckConfig.fieldTypes}
      overrides={puckEditorWithHandlers.puckConfig.overrides}
      // Pass onChange whenever we have template data, not just when editorState is 'ready'
      // This ensures deletions/updates are captured even if state machine hasn't transitioned yet
      onChange={puckEditor.templateData.config && puckEditor.templateData.currentData
        ? puckEditor.handlers.onChange
        : undefined}
      onPublishClick={editorState === 'ready' ? publish.publishHandlers.onPublishClick : undefined}
      sidebarState={editorState === 'ready' ? sidebar.sidebarState : undefined}
      sidebarHandlers={editorState === 'ready' ? sidebar.sidebarHandlers : undefined}
      sectionBrowser={sectionBrowser}
      sectionInsertion={sectionInsertion}
      onPageClick={handleCuratedPageClick}
      onSaveBeforeGenerate={saveBeforeGenerate}
      isPageGenerationStarting={isPageGenerationStarting}
      publishState={editorState === 'ready' ? { ...publish.publishState, pageHtmls: publish.pageHtmls } : undefined}
      publishHandlers={editorState === 'ready' ? publish.publishHandlers : undefined}
      isEditMode={editorState === 'ready' ? puckEditor.uiState.isEditMode : true}
      onEditModeChange={editorState === 'ready' ? wrappedOnEditModeChange : undefined}
      onBackToDashboard={handleBackToDashboard}
      onRetry={handleRetryInEditor}
      onStartOver={handleStartOver}
      onOpenContactSupport={handleOpenContactSupport}
      previewOverrideData={previewOverrideData}
      onPreviewInternalLinkClick={handlePreviewInternalLinkClick}
    />
    
    {/* Contact Support Dialog */}
    <ContactDialog
      open={contactDialogOpen}
      onClose={handleCloseContactSupport}
      currentUser={currentUser}
      initialCategory="Technical Support"
      initialSubject={`Generation Failed - ${generationStatus?.generation_version_id || 'N/A'}`}
    />

    {/* Section Regeneration Credit Confirmation */}
    <CreditConfirmationModal
      open={sectionRegenerationHook.sectionRegenModal.open}
      onClose={sectionRegenerationHook.closeRegenModal}
      actionType={sectionRegenerationHook.sectionRegenModal.open ? 'section_regeneration' : null}
      onConfirm={sectionRegenerationHook.confirmRegen}
      returnOrigin={{
        path: `/editor/${generationVersionId}`,
        context: { action: 'section_regeneration' },
      }}
    />
  </>
  </SectionRegenerationProvider>
  );
};

/**
 * Inner editor that has access to GenerationEventContext.
 * Calls useUpdateTemplateGeneration with onGenerationFailed so GENERATION_FAILED
 * is emitted before clearActiveGeneration, ensuring useIframeContent receives the event
 * and the overlay fades out on partial regen failure.
 */
const EditorWithGenerationEvents: React.FC = () => {
  const { generationVersionId }: { generationVersionId: string } = useParams() as { generationVersionId: string };
  const { emit } = useGenerationEventContext();
  const [failureRefreshKey, setFailureRefreshKey] = React.useState(0);

  // ===== Generation Status Polling =====
  const {
    data: generationStatus,
    isLoading: isCheckingStatus,
    isError: statusCheckError
  } = usePageGenerationStatus({
    generationId: generationVersionId,
    enabled: true,
  });

  // ===== Update Template Generation (for partial autopop) =====
  // Emit GENERATION_FAILED before clear so overlay fades out (useIframeContent receives event)
  const {
    updateTemplateGenerationVersionId,
    updateTemplateGenerationStatus,
  } = useUpdateTemplateGeneration({
    generationVersionId,
    onGenerationFailed: (genId, error) => {
      emit({ type: 'GENERATION_FAILED', generationId: genId, error });
    },
    onFailure: () => setFailureRefreshKey((k) => k + 1),
  });

  // ===== Checking Status Overlay =====
  const { showCheckingOverlay, isFadingOut } = useCheckingStatusOverlay(isCheckingStatus);

  return (
    <>
      <GenerationEventEmitter generationStatus={generationStatus} />
      {updateTemplateGenerationStatus && (
        <GenerationEventEmitter generationStatus={updateTemplateGenerationStatus} />
      )}
      {showCheckingOverlay && (
        <CheckingStatusOverlay isFadingOut={isFadingOut} />
      )}
      <EditorContent
        key={`${generationVersionId}-${failureRefreshKey}`}
        generationVersionId={generationVersionId}
        generationStatus={generationStatus}
        updateTemplateGenerationStatus={updateTemplateGenerationStatus}
        updateTemplateGenerationVersionId={updateTemplateGenerationVersionId}
        isCheckingStatus={isCheckingStatus}
        statusCheckError={statusCheckError}
      />
    </>
  );
};

export const Editor: React.FC = () => {
  const { generationVersionId }: { generationVersionId: string } = useParams() as { generationVersionId: string };

  useRedirectToBaseWhenPartialProcessing(generationVersionId);

  // ===== Generation Status Polling (for credit invalidation) =====
  const { data: generationStatus } = usePageGenerationStatus({
    generationId: generationVersionId,
    enabled: true,
  });

  // ===== Credit Invalidation on Generation Completion =====
  const queryClient = useQueryClient();
  const prevGenerationStatusRef = useRef<string | undefined>();

  useEffect(() => {
    const currentStatus = generationStatus?.status;
    const prevStatus = prevGenerationStatusRef.current;
    prevGenerationStatusRef.current = currentStatus;

    if (currentStatus === 'completed' && prevStatus && prevStatus !== 'completed') {
      queryClient.invalidateQueries({ queryKey: ['creditsBalance'] });
      queryClient.invalidateQueries({ queryKey: ['creditsInfo'] });
      queryClient.invalidateQueries({ queryKey: ['creditTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['generation-configs'] });
      queryClient.invalidateQueries({ queryKey: ['website-pages'] });
      queryClient.invalidateQueries({ queryKey: ['user-websites'] });
    }
  }, [generationStatus?.status, queryClient]);

  return (
    <GenerationEventProvider>
      <EditorWithGenerationEvents />
    </GenerationEventProvider>
  );
};

export default Editor;