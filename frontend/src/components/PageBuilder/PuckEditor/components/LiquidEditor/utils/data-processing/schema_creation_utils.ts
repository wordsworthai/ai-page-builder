/**
 * Utility functions for creating and processing schema entries for liquid data.
 */

/**
 * Convert Shopify element type to corresponding Puck type.
 */
export function getPuckTypeForShopifyType(shopifyType: string, settingsObj: any, blockType: any, sectionEditorVisibilityMap: any): string {
    if (sectionEditorVisibilityMap) {
        const lookup_key = `${settingsObj.id}||${blockType}`;
        const sectionEditorVisibilityObject = sectionEditorVisibilityMap[lookup_key];
        if (!sectionEditorVisibilityObject) {
            return "hiddenText"
        }
        if (!sectionEditorVisibilityObject['is_visible']) {
            return "hiddenText"
        }    
    }

    // Special case: select type with label "Font Family|Font Weight" gets custom UI
    if (shopifyType === 'select' && settingsObj?.label === 'Font Family|Font Weight') {
        return 'liquid.font_picker';
    } else if (shopifyType === 'html' && settingsObj?.label === 'Map Link') {
        return 'liquid.map_picker';
    } else if (shopifyType === 'html' && settingsObj?.label === 'Svg Text') {
        return 'liquid.icon_svg_text_picker';
    }
    const typeMapping: Record<string, string> = {
        'color': 'liquid.color_picker',
        'color_background': 'liquid.color_picker',
        'product': 'textarea',
        'range': 'number',
        'collection': 'textarea',
        'font_picker': 'text',
        'richtext': 'liquid.expandable_text',
        'text': 'liquid.expandable_text',
        'textarea': 'liquid.expandable_text',
        'inline_richtext': 'liquid.expandable_text',
        'number': 'number',
        'select': 'select',
        'checkbox': 'radio',
        'image_picker': 'liquid.image_picker',
        'url': 'liquid.href_picker',
        'video': 'liquid.video_picker',
        'html': 'liquid.expandable_text',
        'text_alignment': 'select',
        'radio': 'select'
    };
    
    if (!(shopifyType in typeMapping)) {
        console.log(`Unmapped Shopify type: ${shopifyType}`);
        throw new Error(`No mapping defined for Shopify type: ${shopifyType} ${JSON.stringify(settingsObj)}`);
    }
    
    return typeMapping[shopifyType];
}

/**
 * Create the base schema entry for a setting object.
 */
function _createBaseSchemaEntry(settingsObj: any): [string | null, string | null, string | null] {
    if (!settingsObj || typeof settingsObj !== 'object' || !('id' in settingsObj)) {
        return [null, null, null];
    }
    
    const objId = settingsObj.id;
    if (!objId) { // Skip if id is empty
        return [null, null, null];
    }
    
    const labelValue = settingsObj.label || '';
    const shopifyType = settingsObj.type || '';
    
    return [objId, labelValue, shopifyType];
}

/**
 * Add range-specific properties (min, max, step) to a schema entry.
 */
function _addRangeProperties(schemaEntry: any, sourceObj: any): void {
    if ('min' in sourceObj) {
        schemaEntry.min = sourceObj.min;
    }
    if ('max' in sourceObj) {
        schemaEntry.max = sourceObj.max;
    }
    if ('step' in sourceObj) {
        schemaEntry.step = sourceObj.step;
    }
}

/**
 * Add checkbox-specific options (True/False) to a schema entry.
 */
function _addCheckboxOptions(schemaEntry: any): void {
    schemaEntry.options = [
        {"label": "True", "value": "true"},
        {"label": "False", "value": "false"}
    ];
}

/**
 * Add select-specific options from source object to a schema entry.
 */
function _addSelectOptions(schemaEntry: any, sourceObj: any): void {
    if ('options' in sourceObj) {
        schemaEntry.options = sourceObj.options;
    }
}

/**
 * Add radio-specific options from source object to a schema entry.
 */
function _addRadioOptions(schemaEntry: any, sourceObj: any): void {
    if ('options' in sourceObj) {
        schemaEntry.options = sourceObj.options;
    }
}

/**
 * Add image picker meta information to a schema entry.
 */
function _addImagePickerMeta(schemaEntry: any, brandUrl: string): void {
    schemaEntry.meta = {
        type: 'image',
        api_endpoint: 'media/fetch-image-list/',
        brand_url: brandUrl
    };
}

/**
 * Add product meta information to a schema entry.
 */
function _addProductMeta(schemaEntry: any, brandUrl: string): void {
    schemaEntry.meta = {
        type: 'product',
        api_endpoint: 'products/',
        brand_url: brandUrl
    };
}

/**
 * Add video meta information to a schema entry.
 */
function _addVideoMeta(schemaEntry: any, brandUrl: string): void {
    schemaEntry.meta = {
        type: 'video',
        api_endpoint: 'media/fetch-video-list/',
        brand_url: brandUrl
    };
}

/**
 * Transform snake_case string to readable Title Case.
 * Example: "hero_section_title" -> "Hero Section Title"
 */
function snakeCaseToTitleCase(str: string): string {
    if (!str) return '';
    return str
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Process all field type properties for a schema entry.
 * Handles both meta properties and dynamic properties that need source object access.
 */
function _processFieldTypeProperties(schemaEntry: any, shopifyType: string, sourceObj: any, brandUrl: string): void {
    // Handle meta properties (image, product, video)
    if (shopifyType === 'image_picker') {
        _addImagePickerMeta(schemaEntry, brandUrl);
    } else if (shopifyType === 'product') {
        _addProductMeta(schemaEntry, brandUrl);
    } else if (shopifyType === 'video') {
        _addVideoMeta(schemaEntry, brandUrl);
    }
    
    // Handle dynamic properties that need source object access
    if (shopifyType === 'checkbox') {
        _addCheckboxOptions(schemaEntry);
    } else if (shopifyType === 'select') {
        _addSelectOptions(schemaEntry, sourceObj);
    } else if (shopifyType === 'radio') {
        _addRadioOptions(schemaEntry, sourceObj);
    } else if (shopifyType === 'range') {
        _addRangeProperties(schemaEntry, sourceObj);
    }
}

/**
 * Process an array of settings and return processed schema entries grouped by element_id.
 */
function _processSettingsArray(
    settingsArray: any[], 
    brandUrl: string, 
    sectionEditorVisibilityMap: any,
    sectionId?: string
): Record<string, any> {
    const processedSettings: Record<string, any> = {};
    
    // Group settings by element_id
    const settingsByElementId: Record<string, any[]> = {};
    const elementIdOrder: string[] = []; 
    
    for (const settingsObj of settingsArray) {
        // Create base schema entry
        const [objId, labelValue, shopifyType] = _createBaseSchemaEntry(settingsObj);
        if (!objId) {
            continue;
        }
        
        // Get element_id from visibility map
        const lookup_key = `${objId}||wwai_base_settings`;
        const visibilityInfo = sectionEditorVisibilityMap?.[lookup_key];
        const elementId = visibilityInfo?.element_id || '_ungrouped';
        // Track order of element_ids
        if (!settingsByElementId[elementId]) {
            settingsByElementId[elementId] = [];
            elementIdOrder.push(elementId);
        }
        // Store the setting info for later processing
        settingsByElementId[elementId].push({
            objId,
            labelValue,
            shopifyType,
            settingsObj
        });
    }
    // Process grouped settings with headers
    for (const elementId of elementIdOrder) {
        const settingsInGroup = settingsByElementId[elementId];
        // First, determine which settings are visible (not hiddenText)
        const visibleSettings: any[] = [];
        for (const setting of settingsInGroup) {
            const { objId, labelValue, shopifyType, settingsObj } = setting;
            const puckType = getPuckTypeForShopifyType(
                shopifyType!, 
                settingsObj, 
                'wwai_base_settings', 
                sectionEditorVisibilityMap
            );
            if (puckType !== 'hiddenText') {
                visibleSettings.push(setting);
            }
        }
        // Only add header if there are visible settings in this group
        if (elementId !== '_ungrouped' && visibleSettings.length > 0) {
            const headerId = `_header_${elementId}`;
            const headerText = snakeCaseToTitleCase(elementId);
            processedSettings[headerId] = {
                type: 'liquid.section_header',
                label: headerText,
                headerText: headerText,
                elementId: elementId,
                sectionId: sectionId
            };
        }
        // Process all settings (including hidden ones for data persistence)
        for (const setting of settingsInGroup) {
            const { objId, labelValue, shopifyType, settingsObj } = setting;
            // Create the formatted entry
            const puckType = getPuckTypeForShopifyType(
                shopifyType!, 
                settingsObj, 
                'wwai_base_settings', 
                sectionEditorVisibilityMap
            );
            processedSettings[objId] = {
                type: puckType,
                label: labelValue,
                elementId: elementId,
                sectionId: sectionId
            };
            
            // Process all field type properties using the common function
            _processFieldTypeProperties(processedSettings[objId], shopifyType!, settingsObj, brandUrl);
        }
    }
    
    return processedSettings;
}

/**
 * Process an array of block settings and return processed schema entries grouped by element_id.
 */
function _processBlockSettingsArray(settingsArray: any[], brandUrl: string, blockType: any, sectionEditorVisibilityMap: any, sectionId?: string): Record<string, any> {
    const blockSettings: Record<string, any> = {};
    
    // Group settings by element_id
    const settingsByElementId: Record<string, any[]> = {};
    const elementIdOrder: string[] = [];

    for (const settingObj of settingsArray) {
        // Create base schema entry
        const [settingId, settingLabel, shopifyType] = _createBaseSchemaEntry(settingObj);
        if (!settingId) {
            continue;
        }
        // Get element_id from visibility map
        const lookup_key = `${settingId}||${blockType}`;
        const visibilityInfo = sectionEditorVisibilityMap?.[lookup_key];
        const elementId = visibilityInfo?.element_id || '_ungrouped';
        // Track order of element_ids
        if (!settingsByElementId[elementId]) {
            settingsByElementId[elementId] = [];
            elementIdOrder.push(elementId);
        }
        // Store the setting info for later processing
        settingsByElementId[elementId].push({
            settingId,
            settingLabel,
            shopifyType,
            settingObj
        });
    }
    // Process grouped settings with headers
    for (const elementId of elementIdOrder) {
        const settingsInGroup = settingsByElementId[elementId];
        // First, determine which settings are visible (not hiddenText)
        const visibleSettings: any[] = [];
        for (const setting of settingsInGroup) {
            const { settingId, settingLabel, shopifyType, settingObj } = setting;
            const puckType = getPuckTypeForShopifyType(
                shopifyType!, 
                settingObj, 
                blockType, 
                sectionEditorVisibilityMap
            );
            if (puckType !== 'hiddenText') {
                visibleSettings.push(setting);
            }
        }
        // Only add header if there are visible settings in this group
        if (elementId !== '_ungrouped' && visibleSettings.length > 0) {
            const headerId = `_header_${elementId}`;
            const headerText = snakeCaseToTitleCase(elementId);
            blockSettings[headerId] = {
                type: 'liquid.section_header',
                label: headerText,
                headerText: headerText,
                elementId: elementId,
                sectionId: sectionId,
                blockType: blockType
            };
        }
        // Process all settings (including hidden ones for data persistence)
        for (const setting of settingsInGroup) {
            const { settingId, settingLabel, shopifyType, settingObj } = setting;
            
            // Create the formatted entry
            const puckType = getPuckTypeForShopifyType(
                shopifyType!, 
                settingObj, 
                blockType, 
                sectionEditorVisibilityMap
            );
            blockSettings[settingId] = {
                type: puckType,
                label: settingLabel,
                elementId: elementId,
                sectionId: sectionId,
                blockType: blockType
            };
            
            // Process all field type properties using the common function
            _processFieldTypeProperties(blockSettings[settingId], shopifyType!, settingObj, brandUrl);
        }
    }
    
    return blockSettings;
}

/**
 * Process an array of blocks and return processed schema entries.
 */
function _processBlocksArray(
    blocksArray: any[], 
    brandUrl: string, 
    sectionEditorVisibilityMap: any,
    sectionId?: string
): Record<string, any> {
    const processedBlocks: Record<string, any> = {};
    
    for (const blockObj of blocksArray) {
        if (!blockObj || typeof blockObj !== 'object') {
            continue;
        }
        
        // Get block type and name
        const blockType = blockObj.type;
        const blockName = blockObj.name || '';
        if (!blockType) { // Skip if no type
            continue;
        }
        
        // Process settings within this block
        let blockSettings: Record<string, any> = {};
        if ('settings' in blockObj && Array.isArray(blockObj.settings)) {
            blockSettings = _processBlockSettingsArray(
                blockObj.settings, 
                brandUrl, 
                blockType, 
                sectionEditorVisibilityMap,
                sectionId
            );
        }
        
        // Add this block to our schema result
        processedBlocks[blockType] = {
            type: 'array',
            label: blockName,
            arrayFields: blockSettings
        };
    }
    
    return processedBlocks;
}

/**
 * Construct the liquid_data_schema directly from the section document.
 */
export function constructLiquidDataSchema(
    liquidSchema: any, 
    brandUrl: string,
    sectionEditorVisibilityMap: any,
    sectionId?: string
): Record<string, any> {
    const schemaResult: Record<string, any> = {};
    // PART 1: Process main settings
    if ('settings' in liquidSchema && Array.isArray(liquidSchema.settings)) {
        const mainSettings = _processSettingsArray(
            liquidSchema.settings, 
            brandUrl, 
            sectionEditorVisibilityMap,
            sectionId
        );
        Object.assign(schemaResult, mainSettings);
    }
    
    // PART 2: Process blocks
    if ('blocks' in liquidSchema && Array.isArray(liquidSchema.blocks)) {
        const processedBlocks = _processBlocksArray(
            liquidSchema.blocks, 
            brandUrl, 
            sectionEditorVisibilityMap,
            sectionId
        );
        Object.assign(schemaResult, processedBlocks);
    }
    
    return schemaResult;
}
