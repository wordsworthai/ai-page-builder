import React, { useState } from 'react';
import { GeneratingSidebarModal } from '../modals/SidebarModal/generation';
import { EditorSidebarModal } from '../modals/SidebarModal/editor';
import { InsertPositionPopup } from '../modals/SidebarModal/editor/InsertPositionPopup';
import { BrowseTemplatesModal } from '../modals/BrowseTemplatesModal';
import { PublishDialog } from '@/components/PageBuilder/Publishing/PublishDialog';
import type { EditorState } from '../hooks';
import type { GenerationStatus } from '@/streaming/types/generation';
import type { SectionInsertionProps, SectionBrowserProps } from '../SectionAddition.types';
import type { PageHtmlEntry } from '@/components/PageBuilder/Dashboard/PublishSiteContainer';

interface EditorModalsProps {
  editorState: EditorState;
  isModalOpen: boolean;
  generationVersionId?: string;
  onOpenGenerationModal?: () => void;
  onCloseGenerationModal?: () => void;
  isGenerationModalManuallyOpened?: boolean;
  generationStatus?: GenerationStatus;
  /** Update existing template generation status (for updating existing template) - takes priority for modal */
  updateTemplateGenerationStatus?: GenerationStatus;
  sidebarState?: {
    sidebarModalOpen: boolean;
    sidebarModalMode: 'customise' | 'add';
    selectedCategory: any;
    initialAddTab?: 'page' | 'section' | 'headerFooter';
  };
  sidebarHandlers?: {
    onCloseSidebarModal: () => void;
    onCategoryClick: (category: any) => void;
  };
  // Section browser (available sections)
  sectionBrowser?: SectionBrowserProps;
  // Section insertion (click-to-add)
  sectionInsertion?: SectionInsertionProps;
  publishState?: {
    publishDialogOpen: boolean;
    generatedHtml: string | null;
    isGeneratingHtml: boolean;
    pageHtmls?: PageHtmlEntry[];
  };
  publishHandlers?: {
    onClosePublishDialog: () => void;
  };
  // Callbacks
  onPageClick?: (page: any) => void;
  /** Save unsaved changes before generation (for CustomiseContent) */
  onSaveBeforeGenerate?: () => Promise<void>;
  // Loading state for page generation
  isPageGenerationStarting?: boolean;
  /** When true, hide Replace Header/Footer in Add Content (non-homepage pages) */
  isNonHomepage?: boolean;
}

/**
 * Component to render modals based on editor state.
 * 
 * - Checking/loading: No modals
 * - Generating: Both modals render, generation modal open, sidebar modal closed
 * - Ready: Both modals render, sidebar modal open, generation modal closed (unless opened)
 */
export const EditorModals: React.FC<EditorModalsProps> = ({
  editorState,
  isModalOpen,
  generationVersionId,
  onOpenGenerationModal,
  onCloseGenerationModal,
  isGenerationModalManuallyOpened = false,
  generationStatus,
  updateTemplateGenerationStatus,
  sidebarState,
  sidebarHandlers,
  sectionBrowser,
  sectionInsertion,
  onPageClick,
  onSaveBeforeGenerate,
  isPageGenerationStarting = false,
  publishState,
  publishHandlers,
  isNonHomepage = false,
}) => {
  const [browseTemplatesModalOpen, setBrowseTemplatesModalOpen] = useState(false);

  if (editorState === 'checking' || editorState === 'loading') {
    return null; // No modals for checking/loading state
  }
  
  // Determine if we're in generating or ready state
  const isReady = editorState === 'ready';
  
  // In generating state: generation modal open, sidebar modal closed
  // In ready state: sidebar modal open (based on state), generation modal closed (unless opened)
  const sidebarModalOpen = isReady && sidebarState?.sidebarModalOpen ? true : false;
  
  return (
    <>
      {/* Sidebar modal - always renders, open in ready state, closed in generating state */}
      <EditorSidebarModal
        isOpen={sidebarModalOpen}
        mode={sidebarState?.sidebarModalMode || 'customise'}
        onClose={sidebarHandlers?.onCloseSidebarModal || (() => {})}
        onCategoryClick={sidebarHandlers?.onCategoryClick || (() => {})}
        onPageClick={onPageClick}
        selectedCategory={sidebarState?.selectedCategory || null}
        initialAddTab={sidebarState?.initialAddTab}
        sectionBrowser={sectionBrowser}
        sectionInsertion={sectionInsertion}
        onOpenBrowseTemplates={isReady && generationVersionId ? () => setBrowseTemplatesModalOpen(true) : undefined}
        generationVersionId={generationVersionId}
        onSaveBeforeGenerate={onSaveBeforeGenerate}
        isNonHomepage={isNonHomepage}
      />
      {/* Browse templates modal (use-template) - ready state only */}
      {isReady && generationVersionId && (
        <BrowseTemplatesModal
          open={browseTemplatesModalOpen}
          onClose={() => setBrowseTemplatesModalOpen(false)}
          sourceGenerationVersionId={generationVersionId}
        />
      )}
      
      {/* Insert Position Popup - shows when user clicks a section */}
      {isReady && sectionInsertion && (
        <InsertPositionPopup
          isOpen={sectionInsertion.state.isInsertPopupOpen}
          onClose={sectionInsertion.handlers.onCloseInsertPopup}
          selectedSection={sectionInsertion.state.selectedSection}
          currentSections={sectionInsertion.state.currentSections}
          onInsert={sectionInsertion.handlers.onInsertSection}
          isInserting={sectionInsertion.state.isInserting}
        />
      )}
      
      {/* Generation modal - always renders as overlay, open in generating state, closed in ready state (unless opened) */}
        {/* Only use update status if it's actually processing, otherwise use regular generation status */}
      <GeneratingSidebarModal
        isOpen={isModalOpen}
        generationStatus={
          (updateTemplateGenerationStatus?.status === 'processing') 
            ? updateTemplateGenerationStatus 
            : generationStatus
        }
        isOverlay={true}
        onOpenModal={onOpenGenerationModal}
        onCloseModal={onCloseGenerationModal || undefined}
        isManuallyOpened={isGenerationModalManuallyOpened}
      />
      
      
      {/* Ready state only modals */}
      {isReady && publishState && publishHandlers && (
        <>
          <PublishDialog
            open={publishState.publishDialogOpen}
            onClose={publishHandlers.onClosePublishDialog}
            htmlContent={publishState.generatedHtml}
            pageHtmls={publishState.pageHtmls && publishState.pageHtmls.length > 0 ? publishState.pageHtmls : undefined}
          />
          
          {publishState.isGeneratingHtml && (
            <div 
              className="fixed inset-0 flex items-center justify-center z-50"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            >
              <div className="bg-white rounded-lg p-6 flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-gray-700 font-medium">Generating HTML...</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Page Generation Starting Loading Modal */}
      {isPageGenerationStarting && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-9999"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="bg-white rounded-lg p-6 flex flex-col items-center shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-700 font-medium">Starting page generation...</p>
          </div>
        </div>
      )}
    </>
  );
};
