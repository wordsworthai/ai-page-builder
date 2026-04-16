/**
 * Utility functions for detecting and logging Puck field changes
 */

export interface FieldChangeInfo {
  fieldName: string;
  puckType: string;
  label: string;
  jsType: string;
  value: any;
  length: number | string;
}

export interface FieldSchema {
  [fieldName: string]: {
    type: string;
    label?: string;
    [key: string]: any;
  };
}

/**
 * Extract only the fields that actually changed from Puck's changed object
 */
export function extractChangedFields(changed: Partial<Record<string | number, boolean> & { id: string }>): string[] {
  return Object.entries(changed)
    .filter(([fieldName, hasChanged]) => hasChanged === true)
    .map(([fieldName]) => fieldName);
}

/**
 * Get changed fields and their field info, filtering out unknown or no-label fields
 */
export function getChangedFieldsAndFieldsInfo(
  changed: Partial<Record<string | number, boolean> & { id: string }>,
  props: Record<string, any>,
  liquidDataSchema: string
): Record<string, FieldChangeInfo> {
  // Extract only the fields that actually changed
  const changedFields = extractChangedFields(changed);

  // Extract fieldInfo for all the changed fields
  const fieldInfo = getFieldSchemaInfo(changedFields, props, liquidDataSchema);

  // Filter out fields with unknown puck type or no label and create a dictionary
  const fieldInfoDict: Record<string, FieldChangeInfo> = {};
  
  for (let index = 0; index < changedFields.length; index++) {
    const field = changedFields[index];
    const puckFieldType = fieldInfo[index].puckType;
    
    // The fields with Unknow and No label are liquid related fields,
    // which exist in the puck data but not in liquid_data_schema.
    if (puckFieldType !== 'Unknown' && puckFieldType !== 'No label') {
      fieldInfoDict[field] = fieldInfo[index];
    } else {
      ;
    }
  }

  return fieldInfoDict;
}

/**
 * Get field schema information for changed fields
 */
export function getFieldSchemaInfo(
  changedFields: string[],
  props: Record<string, any>,
  liquidDataSchema: string
): FieldChangeInfo[] {
  try {
    const fieldSchema: FieldSchema = JSON.parse(liquidDataSchema || '{}');
    
    return changedFields.map(fieldName => {
      const fieldDef = fieldSchema[fieldName];
      const value = props[fieldName];
      
      return {
        fieldName,
        puckType: fieldDef?.type || 'Unknown',
        label: fieldDef?.label || 'No label',
        jsType: typeof value,
        value,
        length: value?.length || 'N/A'
      };
    });
  } catch (error) {
    console.error('Error parsing liquid_data_schema:', error);
    return [];
  }
}

/**
 * Update a settings field, handling link fields and regular fields
 */
export function updateSettingsField(
  settings: Record<string, any>,
  fieldName: string,
  fieldValue: any
): void {
  if (fieldName in settings) {
    // Check if this is a link field
    if (typeof fieldValue === 'object' && fieldValue !== null && 'resolved_url' in fieldValue && 'media' in fieldValue) {
      // This is a link field, we need to convert it to a link object
      settings[fieldName] = fieldValue.media;
    } else {
      // Regular field update
      settings[fieldName] = fieldValue;
    }
  } else {
    console.log(`⚠️ Field ${fieldName} not found in settings`);
  }
}

/**
 * Update multiple settings fields in a settings object, using updateSettingsField internally
 */
export function updateMultipleSettings(
  settings: Record<string, any>,
  fieldUpdates: Record<string, any>
): void {  
  // Only update settings if fieldUpdates is not empty
  if (fieldUpdates) {
    for (const [fieldName, fieldValue] of Object.entries(fieldUpdates)) {
      updateSettingsField(settings, fieldName, fieldValue);
    }  
  }
}

/**
 * Check if a Puck field corresponds to a block type
 */
export function doesPuckFieldCorrespondToBlock(
  puckFieldType: string,
  fieldValue: any,
  fieldName: string,
  blockTypes: Set<unknown>
): boolean {
  return puckFieldType === 'array' && Array.isArray(fieldValue) && blockTypes.has(fieldName);
}

/**
 * Update block settings for a specific block type
 */
export function updateBlockSettings(
  blocks: any[],
  blockType: string,
  newBlockSettings: any[]
): void {    
  // Find existing blocks of this type
  const existing_blocks_with_desired_type = blocks.filter((block: any) => block.type === blockType);

  if (existing_blocks_with_desired_type.length != newBlockSettings.length) {
    console.log(`🔧 Error: blocks length mismatch: ${existing_blocks_with_desired_type.length} != ${newBlockSettings.length}`);
    // At this point, we are not supporting block insertion.
    throw new Error(`🔧 Error: blocks length mismatch: ${existing_blocks_with_desired_type.length} != ${newBlockSettings.length}`);
  }
  
  // Find existing block indices of this type
  const existingBlockIndices: number[] = [];
  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
    if (blocks[blockIndex].type === blockType) {
      existingBlockIndices.push(blockIndex);
    }
  }

  // Update each existing block with new settings
  for (const blockIndex of existingBlockIndices) {
    
    // Use the helper function to update multiple settings at once
    updateMultipleSettings(blocks[blockIndex].settings, newBlockSettings[blockIndex]);
  }
}

/**
 * Revert Puck data back to original Shopify template JSON format
 * This is the reverse of constructLiquidDataPuck function
 */
export function revertPuckDataToTemplateJson(puckData: Record<string, any>): any {
  const result: any = {
    settings: {},
    blocks: []
  };

  // Separate main settings from block groups
  const mainSettings: Record<string, any> = {};
  const blockGroups: Record<string, any[]> = {};

  for (const [key, value] of Object.entries(puckData)) {
    // Check if this is a block group (array of block settings)
    if (Array.isArray(value)) {
      blockGroups[key] = value;
    } else {
      // This is a main setting
      mainSettings[key] = value;
    }
  }

  // Process main settings
  result.settings = mainSettings;

  // Convert block groups back to blocks array
  for (const [blockType, blockSettingsArray] of Object.entries(blockGroups)) {
    for (const blockSettings of blockSettingsArray) {
      result.blocks.push({
        type: blockType,
        settings: blockSettings
      });
    }
  }

  return result;
}

/**
 * Update liquid data based on Puck field changes and revert back to Shopify format
 */
export function updateLiquidDataFromPuckUpdatedData(
  changed: Partial<Record<string | number, boolean> & { id: string }>,
  props: Record<string, any>,
  liquidDataSchema: string
): Record<string, any> {
  // Make a copy of props to work with
  const updatedProps = { ...props };
  
  // Step 1: Get changed fields and their field info, filtering out invalid fields
  const fieldInfoDict = getChangedFieldsAndFieldsInfo(changed, props, liquidDataSchema);
  
    // Step 2: Show field schema types from liquid_data_schema
  if (Object.keys(fieldInfoDict).length > 0) {
    // Step 3: Auto-revert Puck data back to Shopify format and update dependencies
    if (updatedProps['liquid_section_compiler_dependencies']) {
      try {
        // Parse compiler dependencies to get the original template structure
        const compilerDeps = JSON.parse(updatedProps['liquid_section_compiler_dependencies']);
        const originalTemplate = compilerDeps.template_json_for_compiler;
        
        if (!originalTemplate) {
          console.warn('⚠️ No template_json_for_compiler found in compiler dependencies');
          return updatedProps;
        }
        
        // Create a copy of the original template to modify
        const updatedTemplate = JSON.parse(JSON.stringify(originalTemplate));
                
        for (const [fieldName, fieldInfo] of Object.entries(fieldInfoDict)) {
          const puckFieldType = fieldInfo.puckType;
          const fieldValue = fieldInfo.value;
          
          const block_types = new Set();
          if (updatedTemplate.blocks) {
            for (const block of updatedTemplate.blocks) {
              block_types.add(block.type);
            }
          }
          
          if (doesPuckFieldCorrespondToBlock(puckFieldType, fieldValue, fieldName, block_types)) {
            // This is a block type - update blocks array
            updatedTemplate.blocks = updatedTemplate.blocks || [];
            
            // Use the helper function to update block settings
            updateBlockSettings(updatedTemplate.blocks, fieldName, fieldValue);
          } else {
              // This is a main setting - update settings object
              updatedTemplate.settings = updatedTemplate.settings || {};
              
              // Use the helper function to update the settings field
              updateSettingsField(updatedTemplate.settings, fieldName, fieldValue);
            }
        }
        
        // Update the template_json_for_compiler with the modified template
        compilerDeps.template_json_for_compiler = updatedTemplate;
        
        // Update the props string
        updatedProps['liquid_section_compiler_dependencies'] = JSON.stringify(compilerDeps);
                
      } catch (error) {
        console.error('❌ Error during Puck data reversion:', error);
      }
    }
  }
  
  // Return the updated props copy
  return updatedProps;
}
