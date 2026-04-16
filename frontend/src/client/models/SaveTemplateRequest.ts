/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SectionUpdate } from './SectionUpdate';
/**
 * Request to save template JSON updates.
 */
export type SaveTemplateRequest = {
    section_updates: Record<string, SectionUpdate>;
    section_order?: (Array<string> | null);
    deleted_sections?: (Array<string> | null);
};

