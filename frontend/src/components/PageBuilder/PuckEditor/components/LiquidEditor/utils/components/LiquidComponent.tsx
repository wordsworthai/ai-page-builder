import { ComponentConfig, Fields } from "@measured/puck";
import LiquidPreview from "./renderer";
import { ROOT_ZONE_COMPOUNDS } from "./createPuckRoot";
import { updateLiquidDataFromPuckUpdatedData } from "../parsing/fieldChangeDetector";
import { parseFieldName } from "../../../../fields/utils/fieldNameParser";

// ============================================
// TYPES & INTERFACES
// ============================================

export type LiquidCodeProps = {
    liquid_section_type: string;
    liquid_section_set: string;
    liquid_section_name: string;
    liquid_section_id: string;
    liquid_data_puck: string;
    liquid_data_schema: string;
    liquid_section: string;
    liquid_section_compiler_dependencies: string;
};

/** Device type based on viewport width */
type DeviceType = 'mobile' | 'desktop';

/** Represents an element in the iframe with its full context */
interface IframeElement {
    elementId: string;
    blockType: string;
    blockIndex: number;
}

/** Result of querying existing elements from iframe */
interface ExistingElementsResult {
    elementIds: Set<string>;
    elements: IframeElement[];
    isAvailable: boolean;
}

/** Context object containing all data needed for field filtering */
interface FieldFilterContext {
    sectionId: string;
    currentDevice: DeviceType;
    elementIds: Set<string>;
    elements: IframeElement[];
    isIframeAvailable: boolean;
    blockIndexMapping?: Record<string, Record<number, number>>;
}

// ============================================
// CONSTANTS
// ============================================

/** Breakpoint for mobile vs desktop (in pixels) */
const MOBILE_BREAKPOINT = 768;

/** Element types to skip during element existence check */
const SKIP_ELEMENT_CHECK_FOR: Set<string> = new Set([
    'outer_container',
]);

// ============================================
// IFRAME UTILITIES
// ============================================

/**
 * Get existing elements from the iframe preview for a specific section.
 * Uses direct DOM access since iframe is same-origin (srcDoc).
 */
function getExistingElementsFromIframe(sectionId: string): ExistingElementsResult {
    try {
        const iframe = document.querySelector<HTMLIFrameElement>('#preview-frame');
        const iframeDoc = iframe?.contentDocument;
        if (!iframeDoc) {
            return { elementIds: new Set(), elements: [], isAvailable: false };
        }
        
        const sectionEl = iframeDoc.querySelector(`.section-${sectionId}`);
        if (!sectionEl) {
            return { elementIds: new Set(), elements: [], isAvailable: false };
        }
        
        const domElements = sectionEl.querySelectorAll('[data-wwai-element-id]');
        const elementIds = new Set<string>();
        const elements: IframeElement[] = [];
        
        domElements.forEach((el) => {
            const elementId = el.getAttribute('data-wwai-element-id');
            const blockType = el.getAttribute('data-wwai-block-type') || 'wwai_base_settings';
            const blockIndexStr = el.getAttribute('data-wwai-block-index');
            const blockIndex = blockIndexStr !== null ? parseInt(blockIndexStr, 10) : -1;
            
            if (elementId) {
                elementIds.add(elementId);
                elements.push({ elementId, blockType, blockIndex });
            }
        });
        
        return { elementIds, elements, isAvailable: true };
    } catch {
        return { elementIds: new Set(), elements: [], isAvailable: false };
    }
}

/**
 * Check if a specific block element exists in the iframe.
 * Matches by elementId, blockType, and blockIndex (with index mapping).
 */
function doesBlockElementExist(
    elements: IframeElement[],
    elementId: string,
    blockType: string,
    blockIndex: number,
    blockIndexMapping?: Record<string, Record<number, number>>
): boolean {
    // Convert per-type index to global index using mapping
    let globalBlockIndex = blockIndex;
    if (blockIndexMapping?.[blockType]?.[blockIndex] !== undefined) {
        globalBlockIndex = blockIndexMapping[blockType][blockIndex];
    }
    
    return elements.some(el => 
        el.elementId === elementId && 
        el.blockType === blockType && 
        el.blockIndex === globalBlockIndex
    );
}

// ============================================
// VIEWPORT UTILITIES
// ============================================

/** Determine device type from viewport width */
function getDeviceTypeFromWidth(width: number): DeviceType {
    return width <= MOBILE_BREAKPOINT ? 'mobile' : 'desktop';
}

/** Check if a field name is device-specific and matches the current device */
function checkDeviceSpecificField(fieldName: string, currentDevice: DeviceType): { 
    isDeviceSpecific: boolean; 
    shouldShow: boolean;
} {
    const isMobileField = fieldName.endsWith('_mobile');
    const isDesktopField = fieldName.endsWith('_desktop');
    
    if (!isMobileField && !isDesktopField) {
        return { isDeviceSpecific: false, shouldShow: true };
    }
    
    const shouldShow = 
        (isMobileField && currentDevice === 'mobile') ||
        (isDesktopField && currentDevice === 'desktop');
    
    return { isDeviceSpecific: true, shouldShow };
}

// ============================================
// FIELD FILTERING
// ============================================

/**
 * Build the context object needed for field filtering from Puck data and appState.
 */
function buildFieldFilterContext(
    data: { props?: Record<string, any> },
    appState: any,
    sectionId: string
): FieldFilterContext {
    const viewportWidth = appState?.ui?.viewports?.current?.width || 1280;
    const { elementIds, elements, isAvailable } = getExistingElementsFromIframe(sectionId);
    
    return {
        sectionId,
        currentDevice: getDeviceTypeFromWidth(viewportWidth),
        elementIds,
        elements,
        isIframeAvailable: isAvailable,
        blockIndexMapping: data.props?.__block_index_mapping__ as Record<string, Record<number, number>> | undefined,
    };
}

/**
 * Check if a field should be visible based on element existence in iframe.
 * Handles both section-level and block-level fields.
 */
function shouldShowFieldByElement(
    fieldName: string,
    elementId: string,
    context: FieldFilterContext
): boolean {
    // Skip check for elements without data attributes
    if (SKIP_ELEMENT_CHECK_FOR.has(elementId)) {
        return true;
    }
    
    const parsed = parseFieldName(fieldName);
    
    // Block field: match elementId + blockType + blockIndex
    if (parsed.isBlockField && parsed.blockType && parsed.blockIndex !== undefined) {
        return doesBlockElementExist(
            context.elements,
            elementId,
            parsed.blockType,
            parsed.blockIndex,
            context.blockIndexMapping
        );
    }
    
    // Section field: simple elementId check
    return context.elementIds.has(elementId);
}

/**
 * Filter array fields (block subfields) based on viewport.
 * Hides device-specific fields that don't match the current device.
 */
function filterArrayFields(
    arrayFields: Record<string, any>,
    currentDevice: DeviceType
): Record<string, any> {
    const filtered: Record<string, any> = {};
    
    for (const [subFieldName, subField] of Object.entries(arrayFields)) {
        const deviceCheck = checkDeviceSpecificField(subFieldName, currentDevice);
        
        if (deviceCheck.isDeviceSpecific && !deviceCheck.shouldShow) {
            filtered[subFieldName] = { ...subField, visible: false };
        } else {
            filtered[subFieldName] = subField;
        }
    }
    
    return filtered;
}

/**
 * Main field filtering function.
 * Filters fields based on element existence and viewport settings.
 */
function filterFields(fields: Fields, context: FieldFilterContext): Fields {
    const filtered: Fields = {};
    
    for (const [fieldName, field] of Object.entries(fields)) {
        const fieldConfig = field as any;
        
        // Check 1: Element existence (only if iframe is available)
        let shouldShow = true;
        if (context.isIframeAvailable && fieldConfig.elementId) {
            shouldShow = shouldShowFieldByElement(fieldName, fieldConfig.elementId, context);
        }
        
        // Check 2: Device-specific fields
        if (shouldShow) {
            const deviceCheck = checkDeviceSpecificField(fieldName, context.currentDevice);
            if (deviceCheck.isDeviceSpecific && !deviceCheck.shouldShow) {
                shouldShow = false;
            }
        }
        
        // Check 3: For array fields, also filter their subfields
        if (fieldConfig.type === 'array' && fieldConfig.arrayFields) {
            const filteredArrayFields = filterArrayFields(fieldConfig.arrayFields, context.currentDevice);
            filtered[fieldName] = {
                ...fieldConfig,
                arrayFields: filteredArrayFields,
                ...(shouldShow ? {} : { visible: false }),
            };
        } else {
            filtered[fieldName] = shouldShow ? field : { ...fieldConfig, visible: false };
        }
    }
    
    return filtered;
}

export function generateComponentConfig(
    label: string, 
    defaultProps: LiquidCodeProps
): ComponentConfig {
    let data_schema;
    let data_default;

    try {
        data_schema = JSON.parse(defaultProps.liquid_data_schema);
    } catch (error) {
        console.error("Error parsing 'data_schema':", error, defaultProps.liquid_section_name, defaultProps.liquid_section_type);
        // Optionally set a fallback or handle the error appropriately
        data_schema = {}; // Setting to an empty object as fallback, adjust based on your requirements
    }

    try {
        data_default = JSON.parse(defaultProps.liquid_data_puck);
    } catch (error) {
        console.error("Error parsing 'data':", error, defaultProps.liquid_section_name, defaultProps.liquid_section_type);
        // Optionally set a fallback or handle the error appropriately
        data_default = {}; // Setting to an empty object as fallback, adjust based on your requirements
    }

    return {
        label: label,
        fields: {
            liquid_section_type: { type: "hiddenText" },
            liquid_section_set:  { type: "hiddenText" },
            liquid_section_name: { type: "hiddenText" },
            liquid_section_id: { type: "hiddenText" },
            liquid_data_puck: { type: "hiddenText" },
            liquid_data_schema: { type: "hiddenText" },
            liquid_section: { type: "hiddenText" },
            liquid_section_compiler_dependencies: { type: "hiddenText" },
            ...data_schema
        },
        defaultProps: {...defaultProps, ...data_default},
        
        /**
         * Dynamically filters fields when a section is selected.
         * - Hides fields for elements that don't exist in the preview
         * - Shows only device-specific fields matching the current viewport
         */
        resolveFields: async (data, { fields, appState }) => {
            const sectionId = data.props?.liquid_section_id;
            if (!sectionId) {
                return fields;
            }
            
            const context = buildFieldFilterContext(data, appState, sectionId);
            return filterFields(fields, context);
        },
        resolveData: async ({ props }, { changed }) => {
            // Use utility function to update liquid data from Puck changes
            const updatedProps = updateLiquidDataFromPuckUpdatedData(
                changed, 
                props, 
                props['liquid_data_schema']
            );
            // Return updated props with reverted data
            return { props: updatedProps };
        },
        resolvePermissions: (data, { permissions, appState }) => {
            // Header/footer: restrict actions. Permissions: duplicate (copy), drag (reorder), delete (remove).
            // Always: duplicate=false, drag=false (single-slot zones), delete=false (use Replace to swap, not delete).
            const indexes = (appState as any)?.indexes;
            if (!indexes?.nodes || !data?.props?.id) return permissions;
            const node = indexes.nodes[data.props.id];
            if (!node) return permissions;
            const zoneCompound = `${node.parentId}:${node.zone}`;
            if (zoneCompound === ROOT_ZONE_COMPOUNDS.header || zoneCompound === ROOT_ZONE_COMPOUNDS.footer) {
                return { ...permissions, duplicate: false, drag: false, delete: false };
            }
            return permissions;
        },
        render: ({ liquid_section_id, liquid_section_name, liquid_section, liquid_section_compiler_dependencies }) => {
            return (
                <LiquidPreview 
                    liquid_section_id={liquid_section_id} 
                    liquid_section_name={liquid_section_name} 
                    liquid_section={liquid_section} 
                    liquid_section_compiler_dependencies={liquid_section_compiler_dependencies} 
                />
            );
        },
    };
}