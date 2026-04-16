import { useCallback } from 'react';
import type { Config as PuckConfig, Data as PuckData } from '@measured/puck';
import {
  addLiquidComponentToConfig,
  replacePlaceholderWithSection,
} from '../../utils/dynamicPuckSectionConfig';
import {
  getPlaceholderComponentKey,
  generatePlaceholderConfig,
} from '../../utils/components/placeholderConfig';
import type { LoadedSectionData } from '../../SectionAddition.types';

interface usePuckDynamicComponentRegistrationProps {
  config: PuckConfig | null;
  currentData: PuckData | null;
  setConfig: React.Dispatch<React.SetStateAction<PuckConfig | null>>;
  setCurrentData: React.Dispatch<React.SetStateAction<PuckData | null>>;
  extractBlockIndexMappings: (data: PuckData) => void;
  onDataChange?: (data: PuckData) => void;
}

/**
 * Hook to manage dynamic component registration for Puck.
 * Handles registration of placeholder components, liquid components,
 * and replacement of placeholders with real sections.
 */
export function usePuckDynamicComponentRegistration({
  config,
  currentData,
  setConfig,
  setCurrentData,
  extractBlockIndexMappings,
  onDataChange,
}: usePuckDynamicComponentRegistrationProps) {
  /**
   * Register a placeholder component in the config.
   * Used when inserting a new section via click-to-add flow.
   * 
   * @param sectionId - The section ID
   * @param displayName - Display name for the section
   * @param categoryKey - Category key for skeleton styling
   * @returns The component key for the placeholder
   */
  const registerPlaceholderComponent = useCallback(
    (sectionId: string, displayName: string, categoryKey: string): string => {
      const componentKey = getPlaceholderComponentKey(sectionId);
      
      setConfig((prevConfig) => {
        if (!prevConfig) {
          console.warn('[usePuckDynamicComponentRegistration] Cannot register placeholder: config is null');
          return prevConfig;
        }
        
        // Check if already registered
        if (prevConfig.components[componentKey]) {
          return prevConfig;
        }
        
        // Generate the placeholder component config
        const placeholderConfig = generatePlaceholderConfig(sectionId, displayName, categoryKey);
        
        // CRITICAL: Mutate the config.components object in-place!
        // Puck holds an internal reference to config, so we must mutate it
        // rather than creating a new object
        prevConfig.components[componentKey] = placeholderConfig;
        
        return { ...prevConfig }; // Return new object to trigger React re-render
      });
      
      return componentKey;
    },
    [setConfig]
  );

  /**
   * Register a real liquid component in the config.
   * This is called after section data has been loaded.
   * 
   * IMPORTANT: Uses functional state update to avoid stale closure issues.
   * 
   * @param sectionData - The loaded section data
   * @returns The component key for the liquid component
   */
  const registerLiquidComponent = useCallback(
    (sectionData: LoadedSectionData): string => {
      // Calculate the key outside of setConfig so we can return it
      // Use liquid_section_id (actual ID from response) for consistency
      const sectionIdForKey = sectionData.liquid_section_id || sectionData.section_id;
      const componentKey = `LIQUID__${sectionIdForKey}`;
      
      setConfig((prevConfig) => {
        if (!prevConfig) {
          console.warn('[usePuckDynamicComponentRegistration] Cannot register component: prevConfig is null');
          return prevConfig;
        }

        const result = addLiquidComponentToConfig(prevConfig, sectionData);
        
        if (result.success && result.config !== prevConfig) {
          return result.config;
        }
        
        return prevConfig;
      });
      
      return componentKey;
    },
    [setConfig]
  );

  /**
   * Replace a placeholder with a real section component.
   * Updates both config and data atomically.
   * 
   * @param placeholderItemId - ID of the placeholder item in data.content
   * @param sectionData - The loaded section data
   * @returns Success status
   */
  const replacePlaceholder = useCallback(
    (placeholderItemId: string, sectionData: LoadedSectionData): boolean => {
      if (!config || !currentData) {
        console.warn('[usePuckDynamicComponentRegistration] Cannot replace placeholder: config or data is null');
        return false;
      }

      const result = replacePlaceholderWithSection(
        config as PuckConfig,
        currentData as any,
        placeholderItemId,
        sectionData
      );

      if (!result.success) {
        console.error('[usePuckDynamicComponentRegistration] Failed to replace placeholder:', result.error);
        return false;
      }

      // Update both config and data
      setConfig(result.config);
      setCurrentData(result.data as any);
      extractBlockIndexMappings(result.data as any);
      
      console.log(`[usePuckDynamicComponentRegistration] Replaced placeholder ${placeholderItemId} with real section`);
      
      // Notify external listeners of data change
      if (onDataChange) {
        onDataChange(result.data as any);
      }

      return true;
    },
    [config, currentData, setConfig, setCurrentData, extractBlockIndexMappings, onDataChange]
  );

  /**
   * Get the current config (for use in dispatch functions)
   */
  const getConfig = useCallback(() => config, [config]);

  /**
   * Get the current data (for use in dispatch functions)
   */
  const getData = useCallback(() => currentData, [currentData]);

  return {
    registerPlaceholderComponent,
    registerLiquidComponent,
    replacePlaceholder,
    getConfig,
    getData,
  };
}
