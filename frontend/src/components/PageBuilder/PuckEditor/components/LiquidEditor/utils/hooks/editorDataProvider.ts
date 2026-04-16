import { fetchAndProcessTemplateForPuck } from '../api/api_integration';
import { generateComponentConfig } from '../components/LiquidComponent';
import Root, { ROOT_ZONE_COMPOUNDS } from '../components/createPuckRoot';
import type { PageStructureInfo } from '../api/template_types';

type SectionSlotType = 'header' | 'sections' | 'footer';

export interface EditorDataProvider {
    fetchTemplateData: (
        generationVersionId: string,
        targetStoreUrl: string,
        templateJsonType?: string
    ) => Promise<{
        config: any;
        data: any;
        brandUrl: string | null;
    }>;
}

function isInList(id: string, list: string[] | undefined): boolean {
    return Array.isArray(list) && list.includes(id);
}

// Extract the display name from the section name. This is the name the shows in section list on LHS of 
// editor.
export const extractDisplayName = (sectionName: string): string => {
    // Remove "section_" prefix
    let cleaned = sectionName.replace(/^section_/, '');
    // Remove date pattern (e.g., "07nov" - matches digits followed by lowercase letters)
    cleaned = cleaned.replace(/^\d+[a-z]+_/, '');
    // Split by underscores to handle the trailing hash/id
    const parts = cleaned.split('_');
    // Remove the last part if it looks like a hash/id (short alphanumeric, typically 4-6 chars)
    // Keep it if there's only one part left or if it looks like a word
    let nameParts = parts;
    if (parts.length > 1) {
        const lastPart = parts[parts.length - 1];
        // If last part is short and looks like a hash (all alphanumeric, no obvious word pattern)
        if (lastPart.length <= 6 && /^[a-z0-9]+$/i.test(lastPart)) {
            nameParts = parts.slice(0, -1);
        }
    }
    // Convert underscores to spaces and apply title case
    const displayName = nameParts
        .join(' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    return displayName;
};

// Standardize the brand URL to the format https://<brand-slug>.com or https://<brand-slug>.co
export const standardizeBrandUrl = (rawUrl: string): string => {
    try {
        const urlObj = new URL(rawUrl);
        const match = urlObj.hostname.match(/^([a-z0-9\-]+)\.myshopify\.com$/i);
        if (match) {
            let brandSlug = match[1].replace(/-\d+$/, "");
            if (brandSlug.endsWith("-co")) {
                brandSlug = brandSlug.replace(/-co$/, "");
                return `https://${brandSlug}.co`;
            }
            return `https://${brandSlug}.com`;
        }
        return rawUrl.replace(/\/+$/, "");
    } catch (e) {
        console.warn("standardizeBrandUrl: Invalid URL", rawUrl);
        return rawUrl;
    }
};

/** Build a Puck component object from raw section data. */
function buildSectionComponent(section: any, templateId: string, index: number): any {
    const sectionName = section.liquid_section_name;
    const sectionId = section.liquid_section_id;
    let key = '';
    if (typeof window !== "undefined") {
        key = btoa(`template-builder-${templateId}-${sectionName}-${index}`);
    }
    return {
        type: `LIQUID__${sectionId}`,
        props: {
            id: `LIQUID__${section.liquid_section_name}__${key}`,
            liquid_section_type: section.liquid_section_type,
            liquid_section_set: section.liquid_section_set,
            liquid_section_name: section.liquid_section_name,
            liquid_section_id: sectionId,
            liquid_data_puck: section.liquid_data_puck,
            liquid_data_schema: section.liquid_data_schema,
            liquid_section: section.liquid_section,
            liquid_section_compiler_dependencies: section.liquid_section_compiler_dependencies,
            ...JSON.parse(section.liquid_data_puck)
        }
    };
}

/** Classify section as header, footer, or body based on pageStructureInfo. 
 * When pageStructureInfo is null, all are body. 
 * This is used to assign sections to the correct zone in the puck editor. */ 
function classifySlot(
    sectionId: string,
    pageStructureInfo: PageStructureInfo | null,
    headerIds: string[],
    footerIds: string[]
): SectionSlotType {
    if (!pageStructureInfo) return "sections";
    if (isInList(sectionId, headerIds)) return "header";
    if (isInList(sectionId, footerIds)) return "footer";
    return "sections";
}

/** Assign classified components to zones using pageStructureInfo order (header → body → footer). */
function assignZonesFromPageStructureInfo(
    classified: { component: any; slot: SectionSlotType }[],
    headerIds: string[],
    bodyIds: string[],
    footerIds: string[]
): { header: any[]; body: any[]; footer: any[] } {
    const orderedIds = [...headerIds, ...bodyIds, ...footerIds];
    const byId = new Map(classified.map(c => [c.component.props.liquid_section_id, c]));
    const header: any[] = [];
    const body: any[] = [];
    const footer: any[] = [];
    for (const id of orderedIds) {
        const entry = byId.get(id);
        if (!entry) continue;
        if (isInList(id, headerIds)) header.push(entry.component);
        else if (isInList(id, footerIds)) footer.push(entry.component);
        else body.push(entry.component);
    }
    return { header, body, footer };
}

/** Fallback: when pageStructureInfo is null or empty, assign first header slot and last footer slot; 
 * rest go to body. This is used to assign sections to the correct zone in the puck editor when 
 * pageStructureInfo is not available. */
function assignZonesFallback(
    classified: { component: any; slot: SectionSlotType }[]
): { header: any[]; body: any[]; footer: any[] } {
    let headerAssigned = false;
    let lastFooterIndex = -1;
    for (let i = classified.length - 1; i >= 0; i--) {
        if (classified[i].slot === 'footer') {
            lastFooterIndex = i;
            break;
        }
    }
    const header: any[] = [];
    const body: any[] = [];
    const footer: any[] = [];
    for (let i = 0; i < classified.length; i++) {
        if (classified[i].slot === 'header' && !headerAssigned) {
            header.push(classified[i].component);
            headerAssigned = true;
        } else if (classified[i].slot === 'footer' && i === lastFooterIndex) {
            footer.push(classified[i].component);
        } else {
            body.push(classified[i].component);
        }
    }
    return { header, body, footer };
}

export const useEditorDataProvider = (): EditorDataProvider => {
    const processingLayer = (puckData: any, templateId: string, pageStructureInfo: PageStructureInfo | null) => {
        const headerIds = pageStructureInfo?.header_unique_ids ?? [];
        const bodyIds = pageStructureInfo?.body_unique_ids ?? [];
        const footerIds = pageStructureInfo?.footer_unique_ids ?? [];

        // Initialize output structure: content (body), root with page_structure_info, empty zones
        const processedData: any = {
            content: [],
            root: {
                props: {
                    title: "Webpage Builder",
                    ...(pageStructureInfo && { page_structure_info: pageStructureInfo }),
                },
            },
            zones: {
                [ROOT_ZONE_COMPOUNDS.header]: [],
                [ROOT_ZONE_COMPOUNDS.footer]: [],
            }
        };

        // First pass: build Puck components from raw sections and classify each as header/body/footer
        const classified: { component: any; slot: SectionSlotType }[] = puckData.map((section: any, index: number) => {
            const component = buildSectionComponent(section, templateId, index);
            const slot = classifySlot(section.liquid_section_id, pageStructureInfo, headerIds, footerIds);
            return { component, slot };
        });

        // Second pass: assign components to zones.
        // Use Page structure info order when available; 
        // otherwise fallback (header-first, footer-last)
        const hasPageStructureInfoOrder = pageStructureInfo && (headerIds.length > 0 || bodyIds.length > 0 || footerIds.length > 0);
        const { header: headerComps, body: bodyComps, footer: footerComps } = hasPageStructureInfoOrder
            ? assignZonesFromPageStructureInfo(classified, headerIds, bodyIds, footerIds)
            : assignZonesFallback(classified);

        processedData.zones[ROOT_ZONE_COMPOUNDS.header] = headerComps;
        processedData.zones[ROOT_ZONE_COMPOUNDS.footer] = footerComps;
        processedData.content = bodyComps;

        return { processedData, key: '' };
    };

    const createSetsAndComponents = (jsonData: any) => {
        const components: any = {};
        const sets: any = {};
        
        const sections = jsonData;
        sections.forEach((config: any) => {
            const name = config.liquid_section_name;
            const setName = `LIQUID__${config.liquid_section_set.replace(/\s+/g, '_')}`; 
            
            const displayName = extractDisplayName(name);
            
            const componentKey = `LIQUID__${config.liquid_section_id}`;
            components[componentKey] = generateComponentConfig(displayName, config);
            
            if (!sets[setName]) {
                sets[setName] = {
                    title: config.liquid_section_set,
                    components: [],
                    expanded: true,
                    visible: true
                };
            }
            
            sets[setName].components.push(`LIQUID__${name}`);
        });
        
        return { sets, components };
    };

    const fetchTemplateData = async (
        generationVersionId: string,
        targetStoreUrl: string,
        templateJsonType?: string
    ) => {
        try {            
            // Step 1: Fetch and process template using new API
            const { puckData, pageStructureInfo } = await fetchAndProcessTemplateForPuck(
                generationVersionId,
                targetStoreUrl,
                templateJsonType
            );
                        
            // Step 3: Create sets and components (same as existing logic)
            const { sets, components } = createSetsAndComponents(puckData);
            
            // Step 4: Create config (same structure as existing)
            // Root for the editor is created here. This already reads page structure info
            // from props and makes sure that in editor, sections are assigned to the correct zone.
            const config = {
                root: {
                    render: Root,
                },
                categories: sets,
                components: components
            };
            
            // Step 5: Process data layer (use PSI for header/footer when available)
            const { processedData } = processingLayer(puckData, generationVersionId, pageStructureInfo);
            
            // Step 6: Standardize brand URL
            const brandUrl = targetStoreUrl ? standardizeBrandUrl(targetStoreUrl) : null;
            
            console.log(`Successfully processed template ${generationVersionId} with ${puckData.length} sections`);
            
            return { config, data: processedData, brandUrl };
            
        } catch (error) {
            console.error(`Error fetching template ${generationVersionId}:`, error);
            throw new Error(`Failed to fetch template ${generationVersionId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    return {
        fetchTemplateData
    };
};
