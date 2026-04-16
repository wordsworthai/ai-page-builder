/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BatchSectionTemplateRequest } from '../models/BatchSectionTemplateRequest';
import type { TemplateBuildOutput } from '../models/TemplateBuildOutput';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SectionTemplatesService {
    /**
     * Get Section Template
     * Get compiled template JSON for a single section.
     *
     * Compiles a single section using ipsum_lorem (no autopopulation).
     *
     * Args:
     * section_id: The section ID to compile
     * template_json_type: Ignored - section templates use ipsum_lorem only
     *
     * Returns:
     * TemplateBuildOutput (model_dump) - template JSON for editor
     * @param sectionId
     * @param templateJsonType Type of template JSON (section templates support ipsum_lorem only)
     * @returns TemplateBuildOutput Successful Response
     * @throws ApiError
     */
    public static getSectionTemplateApiTemplatesSectionsSectionIdTemplateGet(
        sectionId: string,
        templateJsonType?: (string | null),
    ): CancelablePromise<TemplateBuildOutput> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/templates/sections/{section_id}/template',
            path: {
                'section_id': sectionId,
            },
            query: {
                'template_json_type': templateJsonType,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Batch Section Templates
     * Get compiled template JSON for multiple sections.
     *
     * Compiles multiple sections in one call using ipsum_lorem.
     *
     * Args:
     * request: BatchSectionTemplateRequest containing section_ids list
     *
     * Returns:
     * TemplateBuildOutput (model_dump) - template JSON for editor
     * @param requestBody
     * @returns TemplateBuildOutput Successful Response
     * @throws ApiError
     */
    public static getBatchSectionTemplatesApiTemplatesSectionsCompileBatchPost(
        requestBody: BatchSectionTemplateRequest,
    ): CancelablePromise<TemplateBuildOutput> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/templates/sections/compile-batch',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
