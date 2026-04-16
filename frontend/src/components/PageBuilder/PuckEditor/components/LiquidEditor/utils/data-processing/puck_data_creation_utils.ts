/**
 * Utility functions for creating and processing puck data from template JSON.
 */

function _processProductMedia(lookupValue: any): any {
    /**
     * Process product media and return featured image URL.
     */
    if ('featured_image' in lookupValue && 
        typeof lookupValue.featured_image === 'object' && 
        'src' in lookupValue.featured_image) {
        return {
            resolved_url: lookupValue.featured_image.src,
            media: lookupValue
        };
    }
    return null;
}

function _processVideoMedia(lookupValue: any): any {
    /**
     * Process video media and return preview image or source URL.
     */
    // Try preview image first
    if ('preview_image' in lookupValue && 
        typeof lookupValue.preview_image === 'object' && 
        'url' in lookupValue.preview_image) {
        return {
            resolved_url: lookupValue.preview_image.url,
            media: lookupValue
        };
    }
    
    // Fallback to first source URL
    if ('sources' in lookupValue && 
        Array.isArray(lookupValue.sources) && 
        lookupValue.sources.length > 0 && 
        typeof lookupValue.sources[0] === 'object' && 
        'url' in lookupValue.sources[0]) {
        return {
            resolved_url: lookupValue.sources[0].url,
            media: lookupValue
        };
    }
    
    return null;
}

function _processImageMedia(lookupValue: any): any {
    /**
     * Process image media and return source URL.
     */
    if ('src' in lookupValue) {
        return {
            resolved_url: lookupValue.src,
            media: lookupValue
        };
    }
    return null;
}

function _processMediaByType(assetType: string, lookupValue: any): any {
    /**
     * Process media based on its type and return resolved URL.
     */
    // Handle products
    if (assetType === 'product') {
        return _processProductMedia(lookupValue);
    }
    
    // Handle videos
    else if (assetType === 'video') {
        return _processVideoMedia(lookupValue);
    }
    
    // Handle images (default case)
    else {
        return _processImageMedia(lookupValue);
    }
}

export function processMediaValue(value: any): any {
    /**
     * Process a value to replace media references with their source URLs.
     */
    if (typeof value !== 'object' || value === null) {
        return value;
    }
    
    let assetType: string;
    if ('sources' in value) {
        assetType = 'video';
    } else if ('src' in value) {
        assetType = 'image';
    } else if ('featured_image' in value) {
        assetType = 'product';
    } else {
        throw new Error("Unknown media type");
    }
    
    // Look for this shopify reference value as a key in the media categories
    const result = _processMediaByType(assetType, value);
    if (!result) {
        throw new Error("No result found for media value");
    }
    return result;
}

function _extractMainSettings(sectionExpandedTemplateJson: any): Record<string, any> {
    /**
     * Extract and process main settings from template JSON.
     * Only transformation we make between template json and puck template json is to update
     * image, video and product and replace the lookup object with a preview url and lookup object.
     * We use the preview url to preview the resource and the lookup object for upload purposes.
     */ 
    const mainSettings = sectionExpandedTemplateJson.settings || {};
    if (typeof mainSettings !== 'object' || mainSettings === null) {
        return {};
    }
    
    // Process each setting to replace media references
    const processedSettings: Record<string, any> = {};
    for (const [key, value] of Object.entries(mainSettings)) {
        processedSettings[key] = processMediaValue(value);
    }
    
    return processedSettings;
}

function _processBlockSettings(blockSettings: any): Record<string, any> {
    /**
     * Process block settings to replace media references.
     * Same as we do in main settings, we replace the media references with their source URLs and lookup objects.
     */
    if (typeof blockSettings !== 'object' || blockSettings === null) {
        return {};
    }
    
    const processedBlockSettings: Record<string, any> = {};
    for (const [key, value] of Object.entries(blockSettings)) {
        processedBlockSettings[key] = processMediaValue(value);
    }
    
    return processedBlockSettings;
}

function _extractAndGroupBlocks(sectionExpandedTemplateJson: any): {
    blockGroups: Record<string, any[]>;
    blockIndexMapping: Record<string, Record<number, number>>;
} {
    /**
     * Extract blocks from template JSON and group them by type.
     * The settings inside the block are handled the same way.
     * We group blocks by block type and inside that, we have the ordered list of blocks with 
     * their settings. Any block type will be a heading and its elements will be rendered 
     * as a list of elements under it.
     * 
     * Also creates a mapping from per-type index to global index for block highlighting.
     */
    
    const blocksList = sectionExpandedTemplateJson.blocks || [];
    const blockGroups: Record<string, any[]> = {};
    const blockIndexMapping: Record<string, Record<number, number>> = {};
    const perTypeIndexCounters: Record<string, number> = {};
    
    // Process each block
    for (let globalIndex = 0; globalIndex < blocksList.length; globalIndex++) {
        const blockData = blocksList[globalIndex];
        if (typeof blockData !== 'object' || blockData === null) {
            continue;
        }
        
        // Get the block type
        const blockType = blockData.type;
        if (!blockType) {
            continue;
        }
        
        // Get the block settings
        const blockSettings = blockData.settings;
        if (typeof blockSettings !== 'object' || blockSettings === null) {
            continue;
        }
        
        // Process block settings
        const processedBlockSettings = _processBlockSettings(blockSettings);
        
        // Initialize the group for this block type if it doesn't exist
        if (!(blockType in blockGroups)) {
            blockGroups[blockType] = [];
            blockIndexMapping[blockType] = {};
            perTypeIndexCounters[blockType] = 0;
        }
        
        // Get the per-type index (current count for this block type)
        const perTypeIndex = perTypeIndexCounters[blockType];
        
        // Store the mapping: per-type index -> global index
        blockIndexMapping[blockType][perTypeIndex] = globalIndex;
        
        // Increment the per-type counter
        perTypeIndexCounters[blockType]++;
        
        // Add these settings to the appropriate group
        blockGroups[blockType].push(processedBlockSettings);
    }
    
    return { blockGroups, blockIndexMapping };
}

export function constructLiquidDataPuck(sectionExpandedTemplateJson: any): Record<string, any> {
    /**
     * Construct the liquid_data_puck from section_id_to_template_json in the template document.
     * Two main operations happen here:
     * 1/ We updated media objects with their source URLs and lookup objects.
     * 2/ We group blocks by block type and inside that, we have the ordered list of blocks with 
     * their settings. Any block type will be a heading and its elements will be rendered 
     * as a list of elements under it.
     * 3/ We store a mapping from per-type index to global index for block highlighting.
     */
    const result: Record<string, any> = {};
        
    // Extract and process main settings
    const mainSettings = _extractMainSettings(sectionExpandedTemplateJson);
    Object.assign(result, mainSettings);
    
    // Extract and process blocks
    const { blockGroups, blockIndexMapping } = _extractAndGroupBlocks(sectionExpandedTemplateJson);
    Object.assign(result, blockGroups);
    
    // Store the block index mapping for highlighting
    result.__block_index_mapping__ = blockIndexMapping;
    
    return result;
}
