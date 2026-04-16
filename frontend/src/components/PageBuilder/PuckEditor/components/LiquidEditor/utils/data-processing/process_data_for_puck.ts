import { constructLiquidDataPuck } from './puck_data_creation_utils';
import { constructLiquidDataSchema } from './schema_creation_utils';
import type { TemplateBuildOutput } from '../api/template_types';

function cleanUpSectionName(sectionName: string): string {
    if (sectionName.endsWith('.liquid')) {
        sectionName = sectionName.slice(0, -7);
    }
    return sectionName;
}

export function processDataForPuck(
    tbo: TemplateBuildOutput,
    targetStoreUrl: string
): any[] {
    const puckData: any[] = [];
    const enabledSectionIds = tbo.enabled_section_ids;

    for (const sectionId of enabledSectionIds) {
        const sectionData = tbo.sections[sectionId];
        if (!sectionData) continue;

        const section = sectionData.section_mapping as any;
        const compilerDeps = sectionData.compiler_deps;
        const sectionEditorVisibilityMap = sectionData.editor_field_visibility || {};

        const sectionExpandedTemplateJson = compilerDeps.template_json_for_compiler;

        const puckSectionExpandedTemplateJson = constructLiquidDataPuck(
            sectionExpandedTemplateJson
        );
        const liquidSectionName = cleanUpSectionName(section.definition?.section_filename || sectionId);
        const liquidSectionId = sectionId;
        const liquidSectionType = 'liquid';
        const liquidSectionSet = 'all';

        const puckDataSchema = constructLiquidDataSchema(
            section.content?.liquid_schema ?? {},
            targetStoreUrl,
            sectionEditorVisibilityMap,
            liquidSectionId
        );

        puckData.push({
            liquid_section_type: liquidSectionType,
            liquid_section_set: liquidSectionSet,
            liquid_section_name: liquidSectionName,
            liquid_section_id: liquidSectionId,
            liquid_data_puck: JSON.stringify(puckSectionExpandedTemplateJson),
            liquid_data_schema: JSON.stringify(puckDataSchema),
            liquid_section: JSON.stringify(section),
            liquid_section_compiler_dependencies: JSON.stringify(compilerDeps),
        });
    }

    return puckData;
}
