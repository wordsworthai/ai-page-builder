/**
 * Hook to fetch template options for a generation (from smb_section_cache).
 * Used by the editor Browse templates modal to list the 3 cached templates
 * and which one is currently in use.
 */
import { useQuery } from '@tanstack/react-query';
import { OpenAPI } from '@/client/core/OpenAPI';
import { request } from '@/client/core/request';
import type { ApiRequestOptions } from '@/client/core/ApiRequestOptions';

export interface TemplateOption {
  template_id: string;
  template_name: string;
  section_count: number;
  index: number;
  is_current: boolean;
  section_ids: string[];
  section_desktop_urls?: string[] | null;
  intent?: string | null;
}

export interface GenerationTemplatesResponse {
  templates: TemplateOption[];
}

async function getGenerationTemplates(generationVersionId?: string): Promise<GenerationTemplatesResponse> {
  const options: ApiRequestOptions = {
    method: 'GET',
    url: '/api/templates/browse',
    query: { generation_version_id: generationVersionId },
  };
  const body = await request<GenerationTemplatesResponse>(OpenAPI, options);
  return body;
}

export const useGenerationTemplates = (generationVersionId: string | null = null, enabled = true) => {
  return useQuery({
    queryKey: ['generation-templates', generationVersionId],
    queryFn: () => getGenerationTemplates(generationVersionId || undefined),
    enabled: enabled,
  });
};
