import React, { useEffect } from "react";
import { createUsePuck, IconButton } from "@measured/puck";
import { Button } from "@mui/material";
import { Globe, PanelLeft, PanelRight, Redo2, Undo2, ArrowLeft, Plus, SlidersHorizontal, Save, Monitor } from "lucide-react";
import { useCurrentUser } from "@/hooks";
import { VersionSwitcherDropdown } from "./components/VersionSwitcherDropdown";
import { PageSwitcherDropdown } from "./components/PageSwitcherDropdown";
import type { WebsitePageRead_Output } from "@/client/models/WebsitePageRead_Output";

const usePuck = createUsePuck();

export type WwaiPuckHeaderProps = {
  onFullPreview: () => void;
  onPublish: (data: any) => void;
  onSave?: (data: any) => void;
  isSaving?: boolean;
  onCustomiseClick?: () => void;
  onLeftSidebarClose?: () => void;
  onBackToDashboard?: () => void;
  // Disable all buttons (for seamless transitions across states)
  allButtonsDisabled?: boolean;
  // Allow dashboard button to be enabled even when allButtonsDisabled is true
  enableDashboardButton?: boolean;
  // Open section templates modal
  onOpenSectionTemplates?: () => void;
  // Current generation version ID (from route) for version switcher
  generationVersionId?: string;
  // Multi-page context
  currentPageId?: string;
  isHomepage?: boolean;
  pages?: WebsitePageRead_Output[];
};

export const WwaiPuckHeader: React.FC<WwaiPuckHeaderProps> = ({
  onFullPreview,
  onPublish,
  onSave,
  isSaving = false,
  onCustomiseClick,
  onLeftSidebarClose,
  onBackToDashboard,
  allButtonsDisabled = false,
  enableDashboardButton = false,
  onOpenSectionTemplates,
  generationVersionId,
  currentPageId,
  isHomepage = true,
  pages = [],
}) => {
  const { data: currentUser } = useCurrentUser();

  const getBusinessName = () => {
    return currentUser?.business_name ? currentUser.business_name : 'Your Business';
  };

  const appState = usePuck((s) => s.appState);
  const dispatch = usePuck((s) => s.dispatch);
  const history = usePuck((s) => s.history);

  const title = getBusinessName();

  const leftSideBarVisible = Boolean((appState as any)?.ui?.leftSideBarVisible);
  const rightSideBarVisible = Boolean(
    (appState as any)?.ui?.rightSideBarVisible
  );
 
  useEffect(() => {
    if (!leftSideBarVisible && onLeftSidebarClose) {
      onLeftSidebarClose();
    }
  }, [leftSideBarVisible, onLeftSidebarClose]);

  const toggleSidebars = (sidebar: "left" | "right") => {
    const widerViewport = window.matchMedia("(min-width: 638px)").matches;
    const sideBarVisible =
      sidebar === "left" ? leftSideBarVisible : rightSideBarVisible;
    const oppositeKey =
      sidebar === "left" ? "rightSideBarVisible" : "leftSideBarVisible";

    dispatch({
      type: "setUi",
      ui: {
        [`${sidebar}SideBarVisible`]: !sideBarVisible,
        ...(!widerViewport ? { [oppositeKey]: false } : {}),
      } as any,
    });
  };

  // =========================================================================
  // RENDER: Normal editor header (same structure for all states)
  // =========================================================================
  return (
    <header 
      className="bg-white border-b border-gray-200 w-full max-w-[100vw]"
      style={{width: '200vw'}}
    >
      <div className="grid grid-cols-3 items-center gap-1 px-6 py-2">
        {/* Left: sidebar toggles + Customise/Add */}
        <div className="flex items-center justify-start gap-2">
          <div className={`flex items-center gap-1 ${allButtonsDisabled ? 'opacity-50 blur-sm' : ''}`}>
            <IconButton
              type="button"
              onClick={() => toggleSidebars("left")}
              title="Toggle left sidebar"
              variant="secondary"
              disabled={allButtonsDisabled}
            >
              <PanelLeft
                focusable="false"
                className={leftSideBarVisible ? "text-black" : "text-gray-500"}
                size={16}
              />
            </IconButton>
            <IconButton
              type="button"
              onClick={() => toggleSidebars("right")}
              title="Toggle right sidebar"
              variant="secondary"
              disabled={allButtonsDisabled}
            >
              <PanelRight
                focusable="false"
                className={rightSideBarVisible ? "text-black" : "text-gray-500"}
                size={16}
              />
            </IconButton>
          </div>
          {onBackToDashboard && (
            <Button 
              onClick={onBackToDashboard} 
              variant="outlined"
              size="small"
              disabled={allButtonsDisabled && !enableDashboardButton}
              startIcon={<ArrowLeft size={14} />}
            >
              Dashboard
            </Button>
          )}
          <Button 
            onClick={() => {
              console.log('[WwaiPuckHeader] Customise button clicked');
              onCustomiseClick?.();
            }} 
            variant="outlined"
            size="small"
            disabled={allButtonsDisabled}
            startIcon={<SlidersHorizontal size={14} />}
          >
            Customise
          </Button>
          {onOpenSectionTemplates && (
            <Button 
              onClick={() => {
                console.log('[WwaiPuckHeader] Add Section button clicked');
                onOpenSectionTemplates();
              }} 
              variant="outlined"
              size="small"
              disabled={allButtonsDisabled}
              startIcon={<Plus size={14} />}
            >
              Add Components
            </Button>
          )}
        </div>

        {/* Center: title + page switcher + version dropdown */}
        <div className="flex items-center justify-center gap-2">
          <h4 className="text-sm font-semibold text-gray-600 truncate">
            {title}
          </h4>
          {pages.length > 1 && currentPageId && (
            <>
              <span className="text-gray-300">|</span>
              <PageSwitcherDropdown
                pages={pages}
                currentPageId={currentPageId}
                disabled={allButtonsDisabled}
              />
            </>
          )}
          {generationVersionId && (
            <>
              {pages.length > 1 && <span className="text-gray-300">|</span>}
              <VersionSwitcherDropdown
                generationVersionId={generationVersionId}
                disabled={allButtonsDisabled}
                pageId={currentPageId}
              />
            </>
          )}
        </div>

        {/* Right: Full Preview + undo/redo + Publish */}
        <div className={`flex items-center justify-end gap-2 ${allButtonsDisabled ? 'opacity-50' : ''}`}>

          <div className="flex items-center gap-1">
            <IconButton
              type="button"
              onClick={() => history.back()}
              title="Back"
              variant="secondary"
              disabled={allButtonsDisabled || !history.hasPast}
            >
              <Undo2 focusable="false" size={16} />
            </IconButton>
            <IconButton
              type="button"
              onClick={() => history.forward()}
              title="Forward"
              variant="secondary"
              disabled={allButtonsDisabled || !history.hasFuture}
            >
              <Redo2 focusable="false" size={16} />
            </IconButton>
          </div>

          {onSave && (
            <Button 
              onClick={() => onSave((appState as any)?.data)} 
              variant="outlined"
              size="small"
              disabled={allButtonsDisabled || isSaving}
              startIcon={<Save size={14} />}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}

          <Button 
            onClick={onFullPreview} 
            variant="outlined"
            size="small"
            disabled={allButtonsDisabled}
            startIcon={<Monitor size={14} />}
          >
            Full Preview
          </Button>

          <Button
            onClick={() => onPublish((appState as any)?.data)}
            variant="contained"
            color="primary"
            size="small"
            startIcon={<Globe size={14} />}
            disabled={allButtonsDisabled}
          >
            Publish
          </Button>
        </div>
      </div>
    </header>
  );
};


