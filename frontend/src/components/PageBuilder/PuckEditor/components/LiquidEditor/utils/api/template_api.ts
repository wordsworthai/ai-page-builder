import { TemplatesService } from '@/client';
import type { TemplateBuildOutput, TemplateWithPageInfo } from './template_types';
import type { BatchSectionTemplateRequest } from '@/client';

/**
 * Fetch compiled template for a generation version.
 * Returns TemplateWithPageInfo (template_build_output + page_structure_info).
 */
export async function fetchCompiledTemplate(
  generationVersionId: string,
  templateJsonType?: string
): Promise<TemplateWithPageInfo> {
  const response = await TemplatesService.getCompiledTemplateApiTemplatesGenerationVersionIdGet(
    generationVersionId,
    templateJsonType ?? undefined
  );
  return response as unknown as TemplateWithPageInfo;
}

/**
 * Fetch compiled template for a single section.
 * Uses generated API client.
 */
export async function fetchSectionTemplate(
  sectionId: string,
  templateJsonType?: string
): Promise<TemplateBuildOutput> {
  const response = await TemplatesService.getSectionTemplateApiTemplatesSectionsSectionIdTemplateGet(
    sectionId,
    templateJsonType ?? undefined
  );
  return response as unknown as TemplateBuildOutput;
}

/**
 * Fetch compiled templates for multiple sections.
 * Uses generated API client.
 */
export async function fetchBatchSectionTemplates(
  request: BatchSectionTemplateRequest
): Promise<TemplateBuildOutput> {
  const response = await TemplatesService.getBatchSectionTemplatesApiTemplatesSectionsCompileBatchPost(
    request
  );
  return response as unknown as TemplateBuildOutput;
}
