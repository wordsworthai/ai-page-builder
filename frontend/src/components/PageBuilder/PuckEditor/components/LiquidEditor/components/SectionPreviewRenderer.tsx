import { useMemo } from 'react';
import IframeRenderWrapper from 'puck-internal/IframeRenderWrapper';
import { useBatchSectionTemplates } from '@/hooks/api/PageBuilder/Editor/useBatchSectionTemplates';
import LiquidPreview from '../utils/components/renderer';
import type { Config } from '@measured/puck';

/**
 * Create a minimal Puck config for preview rendering.
 * Uses the same LiquidPreview renderer as the main editor.
 */
const createPreviewConfig = (sectionTypes: string[]): Config => {
  const components: Record<string, any> = {};

  for (const sectionType of sectionTypes) {
    components[sectionType] = {
      render: ({
        liquid_section_id,
        liquid_section_name,
        liquid_section,
        liquid_section_compiler_dependencies,
        compiledHtml
      }: any) => (
        <LiquidPreview
          liquid_section_id={liquid_section_id}
          liquid_section_name={liquid_section_name}
          liquid_section={liquid_section}
          liquid_section_compiler_dependencies={liquid_section_compiler_dependencies}
          compiledHtml={compiledHtml}
        />
      ),
    };
  }

  return {
    components,
    root: {
      render: ({ children }) => <>{children}</>,
    },
  };
};

interface SectionPreviewRendererProps {
  sectionIds: string[];
  templateName: string;
}

/**
 * Component that renders actual sections using IframeRenderWrapper.
 * Isolates Puck-related preview logic from general UI components.
 */
export function SectionPreviewRenderer({
  sectionIds,
  templateName,
}: SectionPreviewRendererProps) {
  const { data, isLoading, error } = useBatchSectionTemplates(sectionIds, true);

  // Create config based on loaded section types
  const previewConfig = useMemo(() => {
    if (!data?.sections.length) return null;
    const sectionTypes = data.sections.map((s) => s.liquid_section_type);
    return createPreviewConfig(sectionTypes);
  }, [data?.sections]);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-lg"
        style={{ width: 520, height: 400 }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading preview...</span>
        </div>
      </div>
    );
  }

  if (error || !data?.puckData || !previewConfig) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-lg border border-red-200"
        style={{ width: 520, height: 200 }}
      >
        <span className="text-sm text-red-500">Failed to load preview</span>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden border border-bold border-black bg-white"
      style={{ width: '100%', height: '100%' }}
    >
      <IframeRenderWrapper
        config={previewConfig}
        data={data.puckData}
        width="100%"
        height="100%"
      />
    </div>
  );
}

export default SectionPreviewRenderer;
