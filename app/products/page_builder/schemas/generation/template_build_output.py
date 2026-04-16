"""Schema for TemplateBuildOutput - mirrors template_json_builder.models.template_build_output.

Used as response_model for template fetch/section endpoints when template_json_builder
is not directly available. Structure must match the orchestration's TemplateBuildOutput.
"""
from typing import Any, Dict, List

from pydantic import BaseModel, Field


class SectionCompilerDeps(BaseModel):
    """Compiler dependencies for a single section."""

    template_json_for_compiler: Dict[str, Any]
    css_js_assets_path: str
    snippets_for_compiler: Dict[str, str]
    file_asset_base_url: str
    parsed_file_asset_url_mapping: Dict[str, Any]


class SectionBuildData(BaseModel):
    """Build data for a single section."""

    compiler_deps: SectionCompilerDeps
    section_mapping: Dict[str, Any]
    editor_field_visibility: Dict[str, Any] = {}
    code_generation_config: Dict[str, Any] = {}


class TemplateBuildOutput(BaseModel):
    """Response model for compiled template - matches template_json_builder structure."""

    sections: Dict[str, SectionBuildData]
    enabled_section_ids: List[str]
    section_id_list: List[str]


class PageStructureInfo(BaseModel):
    """Page-level metadata and section grouping for a template."""

    page_type: str
    header_unique_ids: List[str] = Field(default_factory=list)
    body_unique_ids: List[str] = Field(default_factory=list)
    footer_unique_ids: List[str] = Field(default_factory=list)


class TemplateWithPageInfo(BaseModel):
    """Template build output plus page structure metadata."""

    template_build_output: TemplateBuildOutput
    page_structure_info: PageStructureInfo
