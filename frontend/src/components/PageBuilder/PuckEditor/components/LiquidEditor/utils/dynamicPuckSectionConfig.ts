import type { ComponentConfig } from '@measured/puck';

import {
    generateComponentConfig,
    type LiquidCodeProps,
} from './components/LiquidComponent';
import { 
  generatePlaceholderConfig,
  getPlaceholderComponentKey,
} from './components/placeholderConfig';
import type { LoadedSectionData } from '../SectionAddition.types';
import { extractDisplayName } from './hooks/editorDataProvider';

/**
 * Generates a component key for a liquid section component.
 * Used to register real section components in Puck config.
 * 
 * @param sectionId - The section ID
 * @returns The liquid component key (e.g., "LIQUID__section_123")
 */
export function getLiquidComponentKey(sectionId: string): string {
  return `LIQUID__${sectionId}`;
}

/**
 * Extracts the base section ID for API calls (e.g. regenerate_section).
 * The backend template_unique_section_id_map uses keys like {base}_{index}.
 * Frontend liquid_section_id can be {base}_{index} or {base}_{instanceId}.
 * Returns the base part (ObjectId) so the backend can form the correct key.
 */
export function getBaseSectionIdForApi(liquidSectionId: string): string {
  const parts = liquidSectionId.split('_');
  return parts[0] ?? liquidSectionId;
}

/**
 * Type for Puck config with components
 */
export interface PuckConfig {
  root?: any;
  categories?: Record<string, any>;
  components: Record<string, ComponentConfig>;
}

/**
 * Type for Puck data content item
 */
export interface PuckContentItem {
  type: string;
  props: {
    id: string;
    [key: string]: any;
  };
}

/**
 * Type for Puck data
 */
export interface PuckData {
  content: PuckContentItem[];
  root?: { props: any };
  zones?: Record<string, PuckContentItem[]>;
}

/**
 * Result of adding a component to config
 */
export interface AddComponentResult {
  config: PuckConfig;
  componentKey: string;
  success: boolean;
}

/**
 * Result of replacing a placeholder with a real component
 */
export interface ReplacePlaceholderResult {
  config: PuckConfig;
  data: PuckData;
  success: boolean;
  error?: string;
}

/**
 * Creates a new config with an added placeholder component.
 * This is used when a user starts dragging a section from the templates modal.
 * 
 * @param currentConfig - Current Puck config
 * @param sectionId - Section ID for the placeholder
 * @param displayName - Display name for the section
 * @param categoryKey - Category key for skeleton styling
 * @returns New config with placeholder component added
 */
export function addPlaceholderToConfig(
  currentConfig: PuckConfig,
  sectionId: string,
  displayName: string,
  categoryKey: string
): AddComponentResult {
  const componentKey = getPlaceholderComponentKey(sectionId);
  
  // Check if placeholder already exists
  if (currentConfig.components[componentKey]) {
    return {
      config: currentConfig,
      componentKey,
      success: true,
    };
  }
  
  const placeholderConfig = generatePlaceholderConfig(sectionId, displayName, categoryKey);
  
  const newConfig: PuckConfig = {
    ...currentConfig,
    components: {
      ...currentConfig.components,
      [componentKey]: placeholderConfig,
    },
  };
  
  return {
    config: newConfig,
    componentKey,
    success: true,
  };
}

/**
 * Creates a new config with a real liquid component added.
 * This is used after section data has been loaded.
 * 
 * @param currentConfig - Current Puck config
 * @param sectionData - Loaded section data
 * @returns New config with liquid component added
 */
export function addLiquidComponentToConfig(
  currentConfig: PuckConfig,
  sectionData: LoadedSectionData
): AddComponentResult {
  // Use liquid_section_id (actual ID from response) to generate component key
  // This ensures consistency with what's in the template data
  const sectionIdForKey = sectionData.liquid_section_id || sectionData.section_id;
  const componentKey = getLiquidComponentKey(sectionIdForKey);
  
  // Check if component already exists
  if (currentConfig.components[componentKey]) {
    return {
      config: currentConfig,
      componentKey,
      success: true,
    };
  }
  
  const liquidProps: LiquidCodeProps = {
    liquid_section_type: sectionData.liquid_section_type,
    liquid_section_set: sectionData.liquid_section_set,
    liquid_section_name: sectionData.liquid_section_name,
    liquid_section_id: sectionData.liquid_section_id,
    liquid_data_puck: sectionData.liquid_data_puck,
    liquid_data_schema: sectionData.liquid_data_schema,
    liquid_section: sectionData.liquid_section,
    liquid_section_compiler_dependencies: sectionData.liquid_section_compiler_dependencies,
  };
  
  const componentConfig = generateComponentConfig(
    extractDisplayName(sectionData.liquid_section_name), 
    liquidProps
  );
  
  const newConfig: PuckConfig = {
    ...currentConfig,
    components: {
      ...currentConfig.components,
      [componentKey]: componentConfig,
    },
  };
  
  return {
    config: newConfig,
    componentKey,
    success: true,
  };
}

/**
 * Removes a placeholder component from config.
 * Called after the placeholder has been replaced with a real component.
 * 
 * @param currentConfig - Current Puck config
 * @param sectionId - Section ID of the placeholder to remove
 * @returns New config without the placeholder
 */
export function removePlaceholderFromConfig(
  currentConfig: PuckConfig,
  sectionId: string
): PuckConfig {
  const placeholderKey = getPlaceholderComponentKey(sectionId);
  
  if (!currentConfig.components[placeholderKey]) {
    return currentConfig;
  }
  
  const { [placeholderKey]: _, ...remainingComponents } = currentConfig.components;
  
  return {
    ...currentConfig,
    components: remainingComponents,
  };
}

/**
 * Replaces a placeholder item in data.content with a real section item.
 * 
 * @param currentData - Current Puck data
 * @param placeholderItemId - ID of the placeholder item to replace
 * @param sectionData - Loaded section data
 * @returns New data with placeholder replaced
 */
export function replacePlaceholderInData(
  currentData: PuckData,
  placeholderItemId: string,
  sectionData: LoadedSectionData
): PuckData {
  const componentKey = getLiquidComponentKey(sectionData.section_id);
  
  // Parse the liquid data to get default props
  let parsedPuckData = {};
  try {
    parsedPuckData = JSON.parse(sectionData.liquid_data_puck);
  } catch (e) {
    console.error('[dynamicConfig] Failed to parse liquid_data_puck:', e);
  }
  
  // Create the new props for the real component
  const newProps = {
    id: placeholderItemId, // Keep the same ID to maintain position
    liquid_section_type: sectionData.liquid_section_type,
    liquid_section_set: sectionData.liquid_section_set,
    liquid_section_name: sectionData.liquid_section_name,
    liquid_section_id: sectionData.section_id,
    liquid_data_puck: sectionData.liquid_data_puck,
    liquid_data_schema: sectionData.liquid_data_schema,
    liquid_section: sectionData.liquid_section,
    liquid_section_compiler_dependencies: sectionData.liquid_section_compiler_dependencies,
    ...parsedPuckData,
  };
  
  // Replace the placeholder in content array
  const newContent = currentData.content.map((item) => {
    if (item.props.id === placeholderItemId) {
      return {
        type: componentKey,
        props: newProps,
      };
    }
    return item;
  });
  
  return {
    ...currentData,
    content: newContent,
  };
}

/**
 * Combined function to replace a placeholder with a real component.
 * Updates both config and data atomically.
 * 
 * @param currentConfig - Current Puck config
 * @param currentData - Current Puck data
 * @param placeholderItemId - ID of the placeholder item to replace
 * @param sectionData - Loaded section data
 * @returns New config and data with placeholder replaced
 */
export function replacePlaceholderWithSection(
  currentConfig: PuckConfig,
  currentData: PuckData,
  placeholderItemId: string,
  sectionData: LoadedSectionData
): ReplacePlaceholderResult {
  // Find the placeholder item
  const placeholderItem = currentData.content.find(
    (item) => item.props.id === placeholderItemId
  );
  
  if (!placeholderItem) {
    return {
      config: currentConfig,
      data: currentData,
      success: false,
      error: `Placeholder item ${placeholderItemId} not found`,
    };
  }
  
  // Add the real component to config
  const configResult = addLiquidComponentToConfig(currentConfig, sectionData);
  
  // Replace placeholder in data
  const newData = replacePlaceholderInData(currentData, placeholderItemId, sectionData);
  
  // Optionally remove placeholder component from config
  // (keeping it doesn't hurt, but cleaning up is nice)
  const finalConfig = removePlaceholderFromConfig(configResult.config, sectionData.section_id);
  
  return {
    config: finalConfig,
    data: newData,
    success: true,
  };
}

/**
 * Creates initial props for a placeholder component instance in data.content
 * 
 * @param instanceId - Unique ID for this instance
 * @param sectionId - Section ID being loaded
 * @param displayName - Display name for the section
 * @param categoryKey - Category for skeleton styling
 * @returns Props object for the placeholder instance
 */
export function createPlaceholderInstanceProps(
  instanceId: string,
  sectionId: string,
  displayName: string,
  categoryKey: string
): Record<string, any> {
  return {
    id: instanceId,
    section_id: sectionId,
    display_name: displayName,
    category_key: categoryKey,
    is_placeholder: true,
  };
}

/**
 * Checks if a content item is a placeholder
 * 
 * @param item - Content item to check
 * @returns True if the item is a placeholder
 */
export function isPlaceholderItem(item: PuckContentItem): boolean {
  return item.type.startsWith('PLACEHOLDER__') || item.props.is_placeholder === true;
}

/**
 * Gets the section ID from a placeholder item
 * 
 * @param item - Placeholder item
 * @returns Section ID or null if not a placeholder
 */
export function getSectionIdFromPlaceholder(item: PuckContentItem): string | null {
  if (item.type.startsWith('PLACEHOLDER__')) {
    return item.type.replace('PLACEHOLDER__', '');
  }
  if (item.props.section_id) {
    return item.props.section_id;
  }
  return null;
}

/**
 * Finds all placeholder items in data.content
 * 
 * @param data - Puck data
 * @returns Array of placeholder items with their indices
 */
export function findPlaceholderItems(data: PuckData): Array<{ item: PuckContentItem; index: number }> {
  return data.content
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => isPlaceholderItem(item));
}
