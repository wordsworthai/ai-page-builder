/**
 * Custom hook to fetch batch section templates for rendering in previews.
 *
 * This hook uses the batch section template API to efficiently fetch and process
 * multiple sections at once for preview rendering (e.g., in BrowseTemplatesModal).
 */
import { useQuery } from "@tanstack/react-query";
import { TemplatesService } from "@/client";
import { processDataForPuck } from "@/components/PageBuilder/PuckEditor/components/LiquidEditor/utils/data-processing/process_data_for_puck";
import type { TemplateBuildOutput } from "@/components/PageBuilder/PuckEditor/components/LiquidEditor/utils/api/template_types";
import type { LoadedSectionData } from "@/components/PageBuilder/PuckEditor/components/LiquidEditor/SectionAddition.types";
import { compileCompleteTemplate } from "liquid-compiler/liquid_renderer/liquidService";

interface BatchSectionResult {
  sections: (LoadedSectionData & { compiledHtml?: string })[];
  puckData: {
    content: any[];
    root: { props: Record<string, unknown> };
  };
}

const processBatchResponse = (
  tbo: TemplateBuildOutput,
  targetStoreUrl: string = ''
): LoadedSectionData[] => {
  const puckData = processDataForPuck(tbo, targetStoreUrl);
  return puckData.map(sectionPuckData => ({
    section_id: sectionPuckData.liquid_section_id,
    display_name: sectionPuckData.liquid_section_name || sectionPuckData.liquid_section_id,
    category_key: '',
    liquid_section_type: sectionPuckData.liquid_section_type,
    liquid_section_set: sectionPuckData.liquid_section_set,
    liquid_section_name: sectionPuckData.liquid_section_name,
    liquid_section_id: sectionPuckData.liquid_section_id,
    liquid_data_puck: sectionPuckData.liquid_data_puck,
    liquid_data_schema: sectionPuckData.liquid_data_schema,
    liquid_section: sectionPuckData.liquid_section,
    liquid_section_compiler_dependencies: sectionPuckData.liquid_section_compiler_dependencies,
  }));
};

const buildPuckDataFromSections = (
  sections: (LoadedSectionData & { compiledHtml?: string })[]
): { content: any[]; root: { props: Record<string, unknown> } } => {
  return {
    content: sections.map((s, index) => ({
      type: s.liquid_section_type,
      props: {
        id: `preview-section-${index}-${s.section_id}`,
        liquid_section: s.liquid_section,
        liquid_section_id: s.liquid_section_id,
        liquid_section_type: s.liquid_section_type,
        liquid_section_set: s.liquid_section_set,
        liquid_section_name: s.liquid_section_name,
        liquid_data_puck: s.liquid_data_puck,
        liquid_data_schema: s.liquid_data_schema,
        liquid_section_compiler_dependencies: s.liquid_section_compiler_dependencies,
        compiledHtml: s.compiledHtml,
      },
    })),
    root: { props: {} },
  };
};

const fetchBatchSectionTemplates = async (
  sectionIds: string[],
  templateJsonType: string = 'ipsum_lorem'
): Promise<BatchSectionResult> => {
  const tbo = await TemplatesService.getBatchSectionTemplatesApiTemplatesSectionsCompileBatchPost({
    section_ids: sectionIds,
    template_json_type: templateJsonType as any,
  }) as unknown as TemplateBuildOutput;

  const sections = processBatchResponse(tbo, '');
  const compilationResult = await compileCompleteTemplate(tbo);

  const sectionsWithHtml = sections.map(section => {
    const compiled = compilationResult.section_results.find(r => r.section_id === section.section_id);
    return {
      ...section,
      compiledHtml: compiled?.success ? compiled.html : undefined
    };
  });

  const puckData = buildPuckDataFromSections(sectionsWithHtml);
  return { sections: sectionsWithHtml, puckData };
};

export const useBatchSectionTemplates = (
  sectionIds: string[] | undefined,
  enabled: boolean = true,
  templateJsonType: string = 'ipsum_lorem'
) => {
  return useQuery<BatchSectionResult>({
    queryKey: ['batchSectionTemplates', sectionIds, templateJsonType],
    queryFn: () => fetchBatchSectionTemplates(sectionIds!, templateJsonType),
    enabled: enabled && !!sectionIds?.length,
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
};
