/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TemplateOption } from './TemplateOption';
/**
 * Response for GET /generations/{generation_version_id}/templates
 */
export type GenerationTemplatesResponse = {
    /**
     * Available template options (typically 3) with is_current set for the one in use
     */
    templates?: Array<TemplateOption>;
};

