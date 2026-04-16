import { fetchCompiledTemplate, fetchSectionTemplate } from './template_api';
import { processDataForPuck } from '../data-processing/process_data_for_puck';
import type { LoadedSectionData } from '../../SectionAddition.types';
import type { PageStructureInfo } from './template_types';

export interface FetchAndProcessResult {
  puckData: any[];
  pageStructureInfo: PageStructureInfo | null;
}

/**
 * Fetches a template from the backend API and processes it into puck data format.
 *
 * @param generationVersionId - The generation version ID (UUID from backend)
 * @param targetStoreUrl - The target store URL for processing
 * @param templateJsonType - Type of template JSON to use ("real_population" or "ipsum_lorem")
 * @returns Promise<FetchAndProcessResult> - Processed puck data and page structure info
 */
export async function fetchAndProcessTemplateForPuck(
    generationVersionId: string,
    targetStoreUrl: string,
    templateJsonType?: string
): Promise<FetchAndProcessResult> {
    try {
        console.log(`Fetching template for generation ${generationVersionId}`);

        const result = await fetchCompiledTemplate(generationVersionId, templateJsonType);
        const tbo = result.template_build_output;
        const pageStructureInfo = result.page_structure_info ?? null;

        if (!tbo || !tbo.sections || !tbo.enabled_section_ids?.length) {
            throw new Error(`Invalid template response for generation ${generationVersionId}`);
        }

        const puckData = processDataForPuck(tbo, targetStoreUrl);
        return { puckData, pageStructureInfo };
    } catch (error) {
        console.error(`Error fetching generation ${generationVersionId}:`, error);
        throw new Error(`Failed to load template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Fetches a single section from the backend API and processes it into LoadedSectionData format.
 *
 * @param sectionId - The section ID to fetch
 * @param targetStoreUrl - The target store URL for processing
 * @param templateJsonType - Type of template JSON to use ("real_population" or "ipsum_lorem")
 * @returns Promise<LoadedSectionData> - Processed section data ready for Puck
 */
export async function fetchAndProcessSectionForPuck(
    sectionId: string,
    targetStoreUrl: string,
    templateJsonType?: string
): Promise<LoadedSectionData> {
    try {
        const tbo = await fetchSectionTemplate(sectionId, templateJsonType);

        if (!tbo || !tbo.enabled_section_ids?.length) {
            throw new Error(`Invalid template response for section ${sectionId}`);
        }

        const actualSectionId = tbo.enabled_section_ids[0];
        const puckData = processDataForPuck(tbo, targetStoreUrl);

        if (!puckData || puckData.length === 0) {
            throw new Error(`No puck data returned for section ${sectionId}`);
        }

        const sectionPuckData = puckData[0];
        const displayName = sectionPuckData.liquid_section_name || actualSectionId;

        const loadedSectionData: LoadedSectionData = {
            section_id: actualSectionId,
            display_name: displayName,
            category_key: '',
            liquid_section_type: sectionPuckData.liquid_section_type,
            liquid_section_set: sectionPuckData.liquid_section_set,
            liquid_section_name: sectionPuckData.liquid_section_name,
            liquid_section_id: sectionPuckData.liquid_section_id,
            liquid_data_puck: sectionPuckData.liquid_data_puck,
            liquid_data_schema: sectionPuckData.liquid_data_schema,
            liquid_section: sectionPuckData.liquid_section,
            liquid_section_compiler_dependencies: sectionPuckData.liquid_section_compiler_dependencies,
        };

        return loadedSectionData;
    } catch (error) {
        console.error(`Error fetching section ${sectionId}:`, error);
        throw new Error(`Failed to load section: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
