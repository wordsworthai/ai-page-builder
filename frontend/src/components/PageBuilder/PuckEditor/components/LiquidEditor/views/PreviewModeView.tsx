import React from 'react';
import { Button } from '@measured/puck';
import IframeRenderWrapper from 'puck-internal/IframeRenderWrapper';
import { EditorModals } from './EditorModals';
import type { EditorState } from '../hooks';
import type { GenerationStatus } from '@/streaming/types/generation';
import type { PageHtmlEntry } from '@/components/PageBuilder/Dashboard/PublishSiteContainer';

interface PreviewModeViewProps {
  templateConfig?: any;
  templateData?: any;
  onEditModeChange?: (isEdit: boolean) => void;
  editorState: EditorState;
  isModalOpen: boolean;
  generationVersionId?: string;
  generationStatus?: GenerationStatus;
  sidebarState?: {
    sidebarModalOpen: boolean;
    sidebarModalMode: 'customise' | 'add';
    selectedCategory: any;
  };
  sidebarHandlers?: {
    onCloseSidebarModal: () => void;
    onCategoryClick: (category: any) => void;
  };
  publishState?: {
    publishDialogOpen: boolean;
    generatedHtml: string | null;
    isGeneratingHtml: boolean;
    pageHtmls?: PageHtmlEntry[];
  };
  publishHandlers?: {
    onClosePublishDialog: () => void;
  };
  /** When provided, intercepts internal link clicks in preview and invokes this callback */
  onInternalLinkClick?: (path: string) => void;
}

/**
 * Component for preview mode (ready state with isEditMode=false).
 * 
 * Renders template using IframeRenderWrapper instead of Puck editor.
 * Shows a floating button to return to edit mode.
 */
export const PreviewModeView: React.FC<PreviewModeViewProps> = ({
  templateConfig,
  templateData,
  onEditModeChange,
  editorState,
  isModalOpen,
  generationVersionId,
  generationStatus,
  sidebarState,
  sidebarHandlers,
  publishState,
  publishHandlers,
  onInternalLinkClick,
}) => {
  // No template data - show empty state
  if (!templateConfig || !templateData) {
    return (
      <div className="w-full h-screen bg-gray-50">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-700 mb-2">No Content</h1>
            <p className="text-gray-500 mb-4">Switch to edit mode to add content</p>
            {onEditModeChange && (
              <Button
                onClick={() => onEditModeChange(true)}
                variant="secondary"
              >
                Go to Edit Mode
              </Button>
            )}
          </div>
        </div>
        <EditorModals
          editorState={editorState}
          isModalOpen={isModalOpen}
          generationVersionId={generationVersionId}
          generationStatus={generationStatus}
          sidebarState={sidebarState}
          sidebarHandlers={sidebarHandlers}
          publishState={publishState}
          publishHandlers={publishHandlers}
          isNonHomepage={(templateData?.root?.props?.page_structure_info?.page_type ?? "homepage") !== "homepage"}
        />
      </div>
    );
  }
  
  return (
    <div className="w-full h-screen bg-gray-50">
      <div className="w-full h-full relative">
        {templateData?.content ? (
          <div className="w-full h-full">
            {/* Floating Return Button */}
            {onEditModeChange && (
              <button
                onClick={() => onEditModeChange(true)}
                className="fixed top-6 right-6 z-50 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-full p-3 shadow-lg transition-all duration-200 hover:shadow-xl"
                title="Back to Edit Mode"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            
            {/* Preview Content */}
            <div className="w-full h-full puck-preview-container" style={{ padding: 0, margin: 0 }}>
              <IframeRenderWrapper
                config={templateConfig}
                data={templateData}
                width="100%"
                height="100%"
                onInternalLinkClick={onInternalLinkClick}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-700 mb-2">No Content</h1>
              <p className="text-gray-500 mb-4">Switch to edit mode to add content</p>
              {onEditModeChange && (
                <Button
                  onClick={() => onEditModeChange(true)}
                  variant="secondary"
                >
                  Go to Edit Mode
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      <EditorModals
        editorState={editorState}
        isModalOpen={isModalOpen}
        generationVersionId={generationVersionId}
        generationStatus={generationStatus}
        sidebarState={sidebarState}
        sidebarHandlers={sidebarHandlers}
        publishState={publishState}
        publishHandlers={publishHandlers}
        isNonHomepage={(templateData?.root?.props?.page_structure_info?.page_type ?? "homepage") !== "homepage"}
      />
    </div>
  );
};
