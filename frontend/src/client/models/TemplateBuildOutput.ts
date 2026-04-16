/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SectionBuildData } from './SectionBuildData';
/**
 * Response model for compiled template - matches template_json_builder structure.
 */
export type TemplateBuildOutput = {
    sections: Record<string, SectionBuildData>;
    enabled_section_ids: Array<string>;
    section_id_list: Array<string>;
};

