import type { BlockIndexMapping } from '../../contexts/BlockIndexMappingContext';
import type { CategoryResponse } from '@/hooks/api/PageBuilder/Editor/useCategories';
import type { DynamicComponentsRegistrationFunctions } from './SectionAddition.types';

/** Editor section action bar override - passed to Puck overrides (fields, actionBar).
 * Populated via setEditorSectionActionBarOverride.
 * onRegenerate/generationVersionId come from SectionRegenerationContext.
 */
export type EditorSectionActionBarOverride = {
  isHomepage?: boolean;
  onOpenAddSection?: () => void;
  onReplaceHeaderFooter?: () => void;
};

/**
 * Puck Editor Feature
 * Core editor functionality: template data, edit mode, changes
 */
export interface PuckEditorState {
  /** Puck editor configuration */
  config: any;
  /** Current template data being edited */
  currentData: any;
  /** Block index mappings for highlighting */
  blockIndexMappings: BlockIndexMapping;
  /** Whether in edit mode (true) or preview mode (false) */
  isEditMode: boolean;
}

export interface PuckEditorHandlers {
  /** Called when template data changes in editor */
  onChange: (updatedData: any) => void;
  /** Called when edit mode toggles */
  onEditModeChange: (isEdit: boolean) => void;
}

export interface PuckEditorHook {
  templateData: Pick<PuckEditorState, 'config' | 'currentData' | 'blockIndexMappings'>;
  uiState: Pick<PuckEditorState, 'isEditMode'>;
  handlers: PuckEditorHandlers;
  puckConfig: {
    fieldTypes: any;
    overrides: any;
  };
  // Internal setters for updating state
  updateTemplateData: (updates: Partial<Pick<PuckEditorState, 'config' | 'currentData' | 'blockIndexMappings'>>, source?: string) => void;
  /** Populate editor section action bar override for fields/actionBar overrides */
  setEditorSectionActionBarOverride: (overrides: EditorSectionActionBarOverride) => void;
  // Dynamic component registration methods. 
  // These are used to register new sections and components to the template in Puck.
  // Called by section insertion.
  dynamicRegistrationFunctions?: DynamicComponentsRegistrationFunctions;
}

/**
 * Sidebar Feature
 * Sidebar modal management for customise/add content
 */
export interface SidebarState {
  /** Whether sidebar modal is open */
  sidebarModalOpen: boolean;
  /** Current sidebar mode: 'customise' or 'add' */
  sidebarModalMode: 'customise' | 'add';
  /** Currently selected category for templates (when showing section templates) */
  selectedCategory: CategoryResponse | null;
  /** Initial tab when opening add mode (e.g. for Replace Header/Footer from action bar) */
  initialAddTab?: 'page' | 'section' | 'headerFooter';
}

export interface SidebarHandlers {
  /** Open sidebar in customise mode */
  onCustomiseClick: () => void;
  /** Open sidebar in add mode */
  onAddClick: () => void;
  /** Close sidebar modal */
  onCloseSidebarModal: () => void;
  /** Open section templates for category (opens sidebar modal with templates) */
  onCategoryClick: (category: CategoryResponse) => void;
  /** Open sidebar in add mode with Header & Footer tab (for Replace action) */
  onOpenReplaceHeaderFooter: () => void;
  /** Open sidebar in add mode with Add Section tab (for Insert section plus button) */
  onOpenAddSection: () => void;
}

export interface SidebarHook {
  sidebarState: SidebarState;
  sidebarHandlers: SidebarHandlers;
}

/**
 * Publish Feature
 * Publish dialog and HTML generation
 */
export interface PublishState {
  /** Whether publish dialog is open */
  publishDialogOpen: boolean;
  /** Generated HTML content */
  generatedHtml: string | null;
  /** Whether HTML generation is in progress */
  isGeneratingHtml: boolean;
}

export interface PublishHandlers {
  /** Generate HTML and open publish dialog */
  onPublishClick: (newData: any) => Promise<void>;
  /** Close publish dialog */
  onClosePublishDialog: () => void;
  /** Open publish dialog and restore HTML from pending_publish_data (e.g. after Stripe callback) */
  openPublishDialogWithPendingData: () => void;
}

export interface PublishHook {
  publishState: PublishState;
  publishHandlers: PublishHandlers;
}

/**
 * Template Save Feature
 * Template saving functionality
 */
export interface TemplateSaveState {
  /** Whether save operation is in progress */
  isSaving: boolean;
}

export interface TemplateSaveHandlers {
  /** Save template changes. Optional silent mode suppresses "No changes to save" when used as save-before-generate. */
  onSave: (puckData: any, options?: { silent?: boolean }) => Promise<void>;
}

export interface TemplateSaveHook {
  saveState: TemplateSaveState;
  saveHandlers: TemplateSaveHandlers;
}