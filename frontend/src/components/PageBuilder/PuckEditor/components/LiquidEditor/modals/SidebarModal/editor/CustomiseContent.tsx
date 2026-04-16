import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp, LayoutGrid, Palette, RefreshCw, Sparkles } from 'lucide-react';
import { ColorThemeSidebar } from './ColorThemeSidebar';
import { ColorScheme, getFontFamilyFromPalette } from '@/components/PageBuilder/CreateSite/colorPaletteConstants';
import { useGenerationConfigs } from '@/hooks/api';
import { usePartialAutopop } from '@/hooks/api/PageBuilder/Editor/usePartialAutopop';
import { useRegenerateContent } from '@/hooks/api/PageBuilder/Editor/useRegenerateContent';
import { CreditConfirmationModal, ActionType } from './CreditConfirmationModal';
import { useGenerationState } from '@/context/generation_state/useGenerationState';

const baseButton =
  'w-full px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#8E94F2] focus:ring-offset-1';
const secondaryButton =
  'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:shadow-sm active:scale-[0.99]';
const secondaryButtonNoBorder =
  'bg-white hover:bg-gray-50 text-gray-700 active:scale-[0.99]';
const primaryButton =
  'border border-[#7a80e0] bg-[#8E94F2] hover:bg-[#7a80e0] text-white hover:shadow-md active:scale-[0.99]';

interface CustomiseContentProps {
  /** Opens Browse templates modal (use-template) */
  onOpenBrowseTemplates?: () => void;
  /** Current generation version ID – used to highlight its color palette from generation config (workflow_input) */
  generationVersionId?: string;
  /** Save unsaved changes before triggering generation */
  onSaveBeforeGenerate?: () => Promise<void>;
}

export const CustomiseContent: React.FC<CustomiseContentProps> = ({
  onOpenBrowseTemplates,
  generationVersionId,
  onSaveBeforeGenerate,
}) => {
  const [isColorThemeOpen, setIsColorThemeOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    actionType: ActionType | null;
  }>({ open: false, actionType: null });
  // Store pending palette selection for color theme confirmation
  const [pendingPalette, setPendingPalette] = useState<{
    paletteId: string;
    colors: ColorScheme;
  } | null>(null);

  const { data: configsData } = useGenerationConfigs();
  const configs = configsData?.configs ?? [];
  const currentConfig = generationVersionId
    ? configs.find((c) => c.generation_version_id === generationVersionId)
    : undefined;
  const highlightPaletteId = currentConfig?.config?.color_palette_id ?? null;
  
  const { mutateAsync: triggerPartialAutopop, isPending: isRegenerating } = usePartialAutopop();
  const { mutateAsync: triggerRegenerateContent, isPending: isRegeneratingContent } = useRegenerateContent();
  const navigate = useNavigate();
  const location = useLocation();
  const { setActiveGeneration } = useGenerationState();

  const openConfirmModal = (actionType: ActionType) => {
    setConfirmModal({ open: true, actionType });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ open: false, actionType: null });
    setPendingPalette(null);
  };

  // Called when "Change Theme" button is clicked in ColorThemeSidebar
  const handleChangeThemeRequest = (paletteId: string, colors: ColorScheme) => {
    setPendingPalette({ paletteId, colors });
    openConfirmModal('color_theme');
  };

  const handleConfirmAction = async () => {
    const { actionType } = confirmModal;
    if (!actionType) return;

    await onSaveBeforeGenerate?.();

    // If color theme was confirmed with a pending palette, trigger partial autopop
    if (actionType === 'color_theme' && pendingPalette && generationVersionId) {
      try {
        const result = await triggerPartialAutopop({
          generationVersionId,
          palette_id: pendingPalette.paletteId,
          palette: {
            palette_id: pendingPalette.paletteId,
            ...pendingPalette.colors,
          },
          font_family: getFontFamilyFromPalette(pendingPalette.paletteId),
        });
        
        // Store pending generation ID in context instead of navigating immediately
        // The Editor will poll status for this pending generation and show modal/overlay
        // Navigation will happen automatically when generation completes
        setActiveGeneration({
          generationVersionId: result.generation_version_id,
          type: 'partial-color',
          sourceGenerationVersionId: generationVersionId,
          fromPartialAutopop: true
        });
        navigate(location.pathname, { replace: true });
      } catch (error) {
        // Error handling happens in the hook's onError callback
        console.error('Failed to trigger partial autopop:', error);
      }
    }

    // If content regeneration was confirmed, trigger content regeneration
    if (actionType === 'content' && generationVersionId) {
      try {
        const result = await triggerRegenerateContent({
          generationVersionId,
        });
        
        // Store pending generation ID in context instead of navigating immediately
        // The Editor will poll status for this pending generation and show modal/overlay
        // Navigation will happen automatically when generation completes
        setActiveGeneration({
          generationVersionId: result.generation_version_id,
          type: 'partial-content',
          sourceGenerationVersionId: generationVersionId,
          fromPartialAutopop: true
        });
        navigate(location.pathname, { replace: true });
      } catch (error) {
        // Error handling happens in the hook's onError callback
        console.error('Failed to trigger content regeneration:', error);
      }
    }

    closeConfirmModal();
  };

  return (
    <div className="p-4 space-y-3">
      {/* 1. Browse Templates */}
      {onOpenBrowseTemplates && (
        <button
          type="button"
          onClick={onOpenBrowseTemplates}
          className={`${baseButton} ${secondaryButton} justify-center`}
        >
          <LayoutGrid size={18} className="text-gray-600 shrink-0" />
          <span>Browse Templates</span>
        </button>
      )}

      {/* 2. Regenerate Color Theme (accordion) */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setIsColorThemeOpen(!isColorThemeOpen)}
          className={`${baseButton} ${secondaryButtonNoBorder} justify-between rounded-none rounded-t-lg`}
        >
          <span className="flex items-center gap-2">
            <Palette size={18} className="text-gray-600 shrink-0" />
            <span>Regenerate Color Theme</span>
          </span>
          {isColorThemeOpen ? (
            <ChevronUp size={18} className="text-gray-600 shrink-0" />
          ) : (
            <ChevronDown size={18} className="text-gray-600 shrink-0" />
          )}
        </button>
        {isColorThemeOpen && (
          <div className="bg-white border-t border-gray-200">
            <ColorThemeSidebar
              onChangeThemeRequest={handleChangeThemeRequest}
              highlightPaletteId={highlightPaletteId}
            />
          </div>
        )}
        {isRegenerating && (
          <div className="px-4 py-2 text-sm text-gray-600 bg-blue-50 border-t border-gray-200">
            Regenerating color theme...
          </div>
        )}
      </div>

      {/* 3. Regenerate Content */}
      <button
        type="button"
        onClick={() => openConfirmModal('content')}
        className={`${baseButton} ${secondaryButton} justify-center`}
      >
        <RefreshCw size={18} className="text-gray-600 shrink-0" />
        <span>Regenerate Content</span>
      </button>

      {/* 4. Regenerate Full Page */}
      {/* <button
        type="button"
        onClick={() => openConfirmModal('full_page')}
        className={`${baseButton} ${primaryButton} justify-center`}
      >
        <Sparkles size={18} className="text-white shrink-0" />
        <span>Regenerate Full Page</span>
      </button> */}

      {/* Credit Confirmation Modal */}
      <CreditConfirmationModal
        open={confirmModal.open}
        onClose={closeConfirmModal}
        actionType={confirmModal.actionType}
        onConfirm={handleConfirmAction}
        returnOrigin={
          generationVersionId && confirmModal.actionType
            ? {
                path: `/editor/${generationVersionId}`,
                context: { action: confirmModal.actionType },
              }
            : undefined
        }
      />
    </div>
  );
};

export default CustomiseContent;

