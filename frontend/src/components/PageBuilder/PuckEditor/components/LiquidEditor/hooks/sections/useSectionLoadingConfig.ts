import { useEffect } from 'react';
import { setPlaceholderOptions } from '../../utils/components/placeholderConfig';
import { fetchAndProcessSectionForPuck } from '../../utils/api/api_integration';
import type { LoadedSectionData } from '../../SectionAddition.types';
import type { DynamicComponentsRegistrationFunctions } from '../../SectionAddition.types';

interface UseSectionLoadingConfigParams {
  dynamicRegistrationFunctions?: DynamicComponentsRegistrationFunctions;
}

/**
 * Hook to configure section loading for placeholder components.
 * 
 * Sets up the fetchSectionData and onRegisterComponent callbacks
 * that are used by PlaceholderRenderer to load and register sections.
 * 
 * @param dynamicRegistrationFunctions - Functions for registering components in Puck config
 */
export function useSectionLoadingConfig({
  dynamicRegistrationFunctions,
}: UseSectionLoadingConfigParams): void {
  useEffect(() => {
    const fetchSectionData = async (sectionId: string): Promise<LoadedSectionData> => {
      return await fetchAndProcessSectionForPuck(
        sectionId,
        '', // Empty targetStoreUrl
        'ipsum_lorem' // Default template_json_type
      );
    };

    // Create onRegisterComponent callback that uses registerLiquidComponent
    const onRegisterComponent = (componentKey: string, componentConfig: any) => {
      if (!dynamicRegistrationFunctions) {
        console.warn('[useSectionLoadingConfig] dynamicRegistrationFunctions not available when onRegisterComponent called');
        return;
      }
      
      // Extract sectionData from componentConfig to call registerLiquidComponent
      // The componentConfig has defaultProps with all the liquid props
      const defaultProps = componentConfig.defaultProps || {};
      
      // Extract section_id from componentKey (remove LIQUID__ prefix)
      const sectionIdFromKey = componentKey.replace('LIQUID__', '');
      
      const sectionData: LoadedSectionData = {
        section_id: defaultProps.liquid_section_id || sectionIdFromKey,
        display_name: componentConfig.label || defaultProps.liquid_section_name || '',
        category_key: '',
        liquid_section_type: defaultProps.liquid_section_type || '',
        liquid_section_set: defaultProps.liquid_section_set || '',
        liquid_section_name: defaultProps.liquid_section_name || '',
        liquid_section_id: defaultProps.liquid_section_id || sectionIdFromKey,
        liquid_data_puck: defaultProps.liquid_data_puck || '',
        liquid_data_schema: defaultProps.liquid_data_schema || '',
        liquid_section: defaultProps.liquid_section || '',
        liquid_section_compiler_dependencies: defaultProps.liquid_section_compiler_dependencies || '',
      };
      
      dynamicRegistrationFunctions.registerLiquidComponent(sectionData);
    };

    setPlaceholderOptions({
      fetchSectionData,
      onRegisterComponent,
    });
  }, [dynamicRegistrationFunctions]);
}
