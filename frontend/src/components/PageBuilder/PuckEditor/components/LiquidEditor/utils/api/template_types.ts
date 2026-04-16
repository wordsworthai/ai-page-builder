/**
 * Type definitions for TemplateBuildOutput - mirrors template_json_builder.models.template_build_output
 */

export interface SectionCompilerDeps {
  template_json_for_compiler: Record<string, unknown>;
  css_js_assets_path: string;
  snippets_for_compiler: Record<string, string>;
  file_asset_base_url: string;
  parsed_file_asset_url_mapping: Record<string, unknown>;
}

export interface SectionBuildData {
  compiler_deps: SectionCompilerDeps;
  section_mapping: Record<string, unknown>;
  editor_field_visibility: Record<string, unknown>;
  code_generation_config: Record<string, unknown>;
}

export interface TemplateBuildOutput {
  sections: Record<string, SectionBuildData>;
  enabled_section_ids: string[];
  section_id_list: string[];
}

export interface PageStructureInfo {
  page_type: string;
  header_unique_ids?: string[];
  body_unique_ids?: string[];
  footer_unique_ids?: string[];
}

export interface TemplateWithPageInfo {
  template_build_output: TemplateBuildOutput;
  page_structure_info: PageStructureInfo;
}
