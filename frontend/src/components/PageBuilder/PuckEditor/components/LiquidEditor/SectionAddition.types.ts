/**
 * Section Addition Type Definitions
 * 
 * This file contains all type definitions related to the section addition system.
 * It serves as a single source of truth for types used across:
 * - Section browsing (displaying available sections)
 * - Section insertion (click-to-add workflow)
 * - Dynamic loading (placeholder components and data fetching)
 * - Position selection (choosing where to insert sections)
 */

import type { ComponentConfig } from '@measured/puck';
import type { LiquidCodeProps } from './utils/components/LiquidComponent';

// ============================================================================
// SECTION METADATA & CATEGORIES
// Core data types for sections
// ============================================================================

// Categories are now fetched from backend API - see useCategories hook

/**
 * Section metadata for display in the modal (lightweight, no full data)
 * Shows on LHS, even before full code is fetched.
 */
export interface SectionMetadata {
  section_id: string;
  display_name: string;
  category_key: string;
  preview_image_url?: string;
  description?: string;
}

/**
 * Full section data including all props needed for rendering, This includes the code and the schema.
 */
export interface LoadedSectionData extends LiquidCodeProps {
  section_id: string;
  display_name: string;
  category_key: string;
}

// ============================================================================
// DYNAMIC SECTION LOADING
// Types for managing section loading state and data fetching
// When a section is loaded, we add a placeholder section to the template. Then in the background, 
// we fetch the full section data.
// When the full section data is fetched, we replace the placeholder with the full section data.
// ============================================================================

/**
 * Loading state for a section
 */
export type SectionLoadingState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * State for tracking section loading
 */
export interface SectionLoadState {
  state: SectionLoadingState;
  error?: string;
  data?: LoadedSectionData;
}

/**
 * Hook return type for useDynamicSectionLoader
 */
export interface UseDynamicSectionLoaderReturn {
  /** Load a section by ID */
  loadSection: (sectionId: string) => Promise<LoadedSectionData | null>;
  /** Check if a section is currently loading */
  isLoading: (sectionId: string) => boolean;
  /** Check if a section has been loaded */
  isLoaded: (sectionId: string) => boolean;
  /** Get the loaded section data */
  getLoadedSection: (sectionId: string) => LoadedSectionData | undefined;
  /** Get the loading state for a section */
  getLoadState: (sectionId: string) => SectionLoadState | undefined;
  /** Get all loaded sections */
  getAllLoadedSections: () => Map<string, LoadedSectionData>;
  /** Clear a section from the cache (for retry) */
  clearSection: (sectionId: string) => void;
  /** Clear all cached sections */
  clearAllSections: () => void;
  /** Register a section that's already loaded (from template data) */
  registerLoadedSection: (sectionId: string, data: LoadedSectionData) => void;
}

/**
 * Parameters for useDynamicSectionLoader hook
 */
export interface UseDynamicSectionLoaderParams {
  /** API base URL for fetching sections (Phase 2) */
  apiBaseUrl?: string;
  /** Custom fetch function for section data */
  fetchSectionData?: (sectionId: string) => Promise<LoadedSectionData>;
}

// ============================================================================
// POSITION SELECTION
// Used when selecting where to insert a new section in the template
// ============================================================================

/**
 * Represents a section currently in the template for position selection.
 * Used in the InsertPositionPopup to show "Insert after Section X" options.
 */
export interface CurrentSection {
  /** Unique ID from data.content[i].props.id */
  id: string;
  /** Display name or type of the section */
  displayName: string;
  /** Index in data.content array */
  index: number;
}

/**
 * Props for InsertPositionPopup component
 */
export interface InsertPositionPopupProps {
  /** Whether the popup is open */
  isOpen: boolean;
  /** Called when popup should close */
  onClose: () => void;
  /** The section being added */
  selectedSection: SectionMetadata | null;
  /** Current sections in the template */
  currentSections: CurrentSection[];
  /** Called when user confirms insertion */
  onInsert: (sectionId: string, position: number) => void;
  /** Whether insert is in progress */
  isInserting?: boolean;
}

// ============================================================================
// SECTION BROWSER
// Used for displaying available sections in a category
// ============================================================================

/**
 * Props for SectionTemplatesContent component.
 * Displays a grid of available sections for a category.
 */
export interface SectionTemplatesContentProps {
  /** Category name for display */
  categoryName: string;
  /** Category key for filtering sections */
  categoryKey: string;
  /** Available sections for this category */
  sections?: SectionMetadata[];
  /** Loading sections state per section ID */
  loadingSections?: Set<string>;
  /** Called when a section card is clicked */
  onSectionClick?: (section: SectionMetadata) => void;
}

/**
 * Grouped props for section browser feature.
 * Handles loading and displaying available sections for a category.
 */
export interface SectionBrowserProps {
  /** Available sections for the selected category */
  availableSections: SectionMetadata[];
  /** Set of section IDs currently loading */
  loadingSections: Set<string>;
  /** Whether sections are being loaded */
  isLoading: boolean;
  /** Error state if sections failed to load */
  error?: Error | null;
  /** Called when a section card is clicked */
  onSectionClick?: (section: SectionMetadata) => void;
  /** Called to retry fetching sections */
  onRetry?: () => void;
}

// ============================================================================
// SECTION INSERTION (Click-to-Add Flow)
// Main workflow for adding sections to the template
// ============================================================================

/**
 * State for section insertion workflow
 */
export interface SectionInsertionState {
  /** Currently selected section to insert */
  selectedSection: SectionMetadata | null;
  /** Whether the insert position popup is open */
  isInsertPopupOpen: boolean;
  /** Whether insertion is in progress */
  isInserting: boolean;
  /** Current sections in the template for position selection */
  currentSections: CurrentSection[];
}

/**
 * Handlers for section insertion workflow
 */
export interface SectionInsertionHandlers {
  /** Called when a section card is clicked (for Add Section - opens position popup) */
  onSectionClick: (section: SectionMetadata) => void;
  /** Called to close the insert position popup */
  onCloseInsertPopup: () => void;
  /** Called to insert section at specified position (sections zone only) */
  onInsertSection: (sectionId: string, position: number) => void;
  /** Called to replace header slot */
  onReplaceHeader?: (section: SectionMetadata) => void;
  /** Called to replace footer slot */
  onReplaceFooter?: (section: SectionMetadata) => void;
}

/**
 * Combined props for section insertion feature.
 * Groups state and handlers for cleaner prop passing.
 */
export interface SectionInsertionProps {
  state: SectionInsertionState;
  handlers: SectionInsertionHandlers;
}

// ============================================================================
// PLACEHOLDER COMPONENTS
// Used for showing loading state while section data is being fetched
// ============================================================================

/**
 * Props for placeholder components during dynamic section loading.
 * Minimal props needed to show loading state and trigger data fetch.
 */
export interface PlaceholderComponentProps {
  /** The section ID to load */
  section_id: string;
  /** Display name for the section */
  display_name: string;
  /** Category key of the section */
  category_key: string;
  /** Unique ID for this placeholder instance */
  id: string;
  /** Whether this is a placeholder (always true for this component) */
  is_placeholder: boolean;
  /** Callback when section data is loaded */
  onSectionLoaded?: (sectionData: any) => void;
  /** Callback when loading fails */
  onLoadError?: (error: Error) => void;
  /** Function to fetch section data */
  fetchSectionData?: (sectionId: string) => Promise<any>;
}

/**
 * Options for configuring placeholder component behavior.
 * Set these once during editor initialization via setPlaceholderOptions().
 */
export interface PlaceholderConfigOptions {
  /** Function to fetch section data - YOUR API INTEGRATION POINT */
  fetchSectionData?: (sectionId: string) => Promise<LoadedSectionData>;
  /** Callback when a new component needs to be registered in config */
  onRegisterComponent?: (componentKey: string, componentConfig: ComponentConfig) => void;
}

/**
 * Props for PlaceholderRenderer component.
 * Extends PlaceholderComponentProps with callback functions.
 */
export interface PlaceholderRendererProps {
  /** The section ID to load */
  section_id: string;
  /** Display name for the section */
  display_name: string;
  /** Category key of the section */
  category_key: string;
  /** Unique ID for this placeholder instance */
  id: string;
  /** Whether this is a placeholder (always true) */
  is_placeholder: boolean;
  /** Function to fetch section data - YOUR API INTEGRATION POINT */
  fetchSectionData?: (sectionId: string) => Promise<LoadedSectionData>;
  /** Function to register a new component in config */
  onRegisterComponent?: (componentKey: string, componentConfig: any) => void;
}

// ============================================================================
// DYNAMIC COMPONENT REGISTRATION
// Methods for registering and managing dynamic section components in Puck
// ============================================================================

/**
 * Methods for dynamic component registration in Puck.
 * Provided by usePuckDynamicComponentRegistration hook.
 */
export interface DynamicComponentsRegistrationFunctions {
  /** Register a placeholder component in config */
  registerPlaceholderComponent: (sectionId: string, displayName: string, categoryKey: string) => string;
  /** Register a real liquid component in config */
  registerLiquidComponent: (sectionData: LoadedSectionData) => string;
  /** Replace a placeholder with a real section */
  replacePlaceholder: (placeholderItemId: string, sectionData: LoadedSectionData) => boolean;
  /** Get current config */
  getConfig: () => any;
  /** Get current data */
  getData: () => any;
}
