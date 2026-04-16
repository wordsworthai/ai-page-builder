/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddSectionInPlaceRequest } from '../models/AddSectionInPlaceRequest';
import type { Body_compile_preview_api_generations_internal_compile_preview_post } from '../models/Body_compile_preview_api_generations_internal_compile_preview_post';
import type { CompilePreviewResponse } from '../models/CompilePreviewResponse';
import type { GeneratePageRequest } from '../models/GeneratePageRequest';
import type { GeneratePageResponse } from '../models/GeneratePageResponse';
import type { GenerationCallbackRequest } from '../models/GenerationCallbackRequest';
import type { GenerationConfigListResponse } from '../models/GenerationConfigListResponse';
import type { GenerationPerformanceMetrics } from '../models/GenerationPerformanceMetrics';
import type { GenerationStatusResponse } from '../models/GenerationStatusResponse';
import type { NodeUpdatePayload } from '../models/NodeUpdatePayload';
import type { RegenerateColorThemeRequest } from '../models/RegenerateColorThemeRequest';
import type { RegenerateContentRequest } from '../models/RegenerateContentRequest';
import type { RegenerateSectionRequest } from '../models/RegenerateSectionRequest';
import type { TriggerLoadTestRequest } from '../models/TriggerLoadTestRequest';
import type { TriggerLoadTestResponse } from '../models/TriggerLoadTestResponse';
import type { UseSectionIdsRequest } from '../models/UseSectionIdsRequest';
import type { UseTemplateResponse } from '../models/UseTemplateResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PageGenerationService {
    /**
     * Trigger Page Generation
     * Trigger AI page generation.
     * @param requestBody
     * @returns GeneratePageResponse Successful Response
     * @throws ApiError
     */
    public static triggerPageGenerationApiGenerationsTriggerPost(
        requestBody: GeneratePageRequest,
    ): CancelablePromise<GeneratePageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/generations/trigger',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Generation Metrics
     * List recent performance metrics for the current user's business. Requires RECORD_PERFORMANCE_METRICS=True.
     * @param limit
     * @returns GenerationPerformanceMetrics Successful Response
     * @throws ApiError
     */
    public static listGenerationMetricsApiGenerationsMetricsGet(
        limit: number = 50,
    ): CancelablePromise<Array<GenerationPerformanceMetrics>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/generations/metrics',
            query: {
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Generation Status
     * Poll generation status.
     * SIMPLIFIED: execution_log entries no longer have phase/parallel fields.
     * @param generationVersionId
     * @returns GenerationStatusResponse Successful Response
     * @throws ApiError
     */
    public static getGenerationStatusApiGenerationsGenerationVersionIdStatusGet(
        generationVersionId: string,
    ): CancelablePromise<GenerationStatusResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/generations/{generation_version_id}/status',
            path: {
                'generation_version_id': generationVersionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Generation Metrics
     * Get persisted performance metrics for a generation. Requires ownership. 404 if metrics disabled or not found.
     * @param generationVersionId
     * @returns GenerationPerformanceMetrics Successful Response
     * @throws ApiError
     */
    public static getGenerationMetricsApiGenerationsGenerationVersionIdMetricsGet(
        generationVersionId: string,
    ): CancelablePromise<GenerationPerformanceMetrics> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/generations/{generation_version_id}/metrics',
            path: {
                'generation_version_id': generationVersionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Retry Generation
     * Retry a failed generation by resuming the landing page workflow from its last checkpoint.
     * Verifies ownership, loads workflow inputs from Mongo, resets Redis, runs run_landing_page_workflow again.
     * @param generationVersionId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static retryGenerationApiGenerationsGenerationVersionIdRetryPost(
        generationVersionId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/generations/{generation_version_id}/retry',
            path: {
                'generation_version_id': generationVersionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Regenerate Color Theme
     * Regenerate color theme using AutopopOnlyWorkflow.
     * Creates new GenerationVersion, runs autopop-only with new palette/font.
     * @param generationVersionId
     * @param requestBody
     * @returns GeneratePageResponse Successful Response
     * @throws ApiError
     */
    public static regenerateColorThemeApiGenerationsGenerationVersionIdRegenerateColorThemePost(
        generationVersionId: string,
        requestBody: RegenerateColorThemeRequest,
    ): CancelablePromise<GeneratePageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/generations/{generation_version_id}/regenerate-color-theme',
            path: {
                'generation_version_id': generationVersionId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Regenerate Content
     * Regenerate content using AutopopOnlyWorkflow with regenerate_mode="text".
     * Creates new GenerationVersion, runs autopop-only for text only.
     * @param generationVersionId
     * @param requestBody
     * @returns GeneratePageResponse Successful Response
     * @throws ApiError
     */
    public static regenerateContentApiGenerationsGenerationVersionIdRegenerateContentPost(
        generationVersionId: string,
        requestBody: RegenerateContentRequest,
    ): CancelablePromise<GeneratePageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/generations/{generation_version_id}/regenerate-content',
            path: {
                'generation_version_id': generationVersionId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Regenerate Section
     * Regenerate content for a single section using RegenerateSection workflow.
     * Creates new GenerationVersion, triggers regenerate_section workflow.
     * No redirect - stay on page, show overlay, poll status.
     * @param generationVersionId
     * @param requestBody
     * @returns GeneratePageResponse Successful Response
     * @throws ApiError
     */
    public static regenerateSectionApiGenerationsGenerationVersionIdRegenerateSectionPost(
        generationVersionId: string,
        requestBody: RegenerateSectionRequest,
    ): CancelablePromise<GeneratePageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/generations/{generation_version_id}/regenerate-section',
            path: {
                'generation_version_id': generationVersionId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add Section In Place
     * Add or replace a section in a generation's 3 DBs in place (no new generation).
     * Updates generation_template_sections, autopopulation_snapshots, generated_templates_with_values with lorem content.
     * @param generationVersionId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static addSectionInPlaceApiGenerationsGenerationVersionIdAddSectionInPlacePost(
        generationVersionId: string,
        requestBody: AddSectionInPlaceRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/generations/{generation_version_id}/add-section-in-place',
            path: {
                'generation_version_id': generationVersionId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Use Section Ids
     * Create a new generation using a specific list of section IDs.
     * Similar to use-template but allows passing IDs directly (e.g. from curated pages).
     * @param requestBody
     * @returns UseTemplateResponse Successful Response
     * @throws ApiError
     */
    public static useSectionIdsApiGenerationsUseSectionIdsPost(
        requestBody: UseSectionIdsRequest,
    ): CancelablePromise<UseTemplateResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/generations/use-section-ids',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Trigger Load Test
     * Internal load-test trigger: creates generation record and triggers orchestration. No user auth; requires X-Load-Test-Secret header.
     * @param requestBody
     * @returns TriggerLoadTestResponse Successful Response
     * @throws ApiError
     */
    public static triggerLoadTestApiGenerationsInternalTriggerLoadTestPost(
        requestBody: TriggerLoadTestRequest,
    ): CancelablePromise<TriggerLoadTestResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/generations/internal/trigger-load-test',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Generation Node Update
     * Internal webhook: orchestration service POSTs node completion updates. No auth.
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static generationNodeUpdateApiGenerationsInternalNodeUpdatePost(
        requestBody: NodeUpdatePayload,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/generations/internal/node-update',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Generation Callback
     * Internal callback from landing page workflow on completion.
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static generationCallbackApiGenerationsInternalCallbackPost(
        requestBody: GenerationCallbackRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/generations/internal/callback',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Compile Preview
     * Compile and upload preview HTML to S3.
     * @param formData
     * @returns CompilePreviewResponse Successful Response
     * @throws ApiError
     */
    public static compilePreviewApiGenerationsInternalCompilePreviewPost(
        formData: Body_compile_preview_api_generations_internal_compile_preview_post,
    ): CancelablePromise<CompilePreviewResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/generations/internal/compile-preview',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Generation Configs
     * List generation configs from MongoDB workflow_input for the current user's business. Optionally filter by page_id.
     * @param pageId Filter configs by page ID
     * @returns GenerationConfigListResponse Successful Response
     * @throws ApiError
     */
    public static listGenerationConfigsApiGenerationsConfigsGet(
        pageId?: (string | null),
    ): CancelablePromise<GenerationConfigListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/generations/configs',
            query: {
                'page_id': pageId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Generation Count
     * Get the count of generations for the current user's business.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getGenerationCountApiGenerationsCountGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/generations/count',
        });
    }
    /**
     * Generation Health Check
     * Health check for generation service.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static generationHealthCheckApiGenerationsHealthGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/generations/health',
        });
    }
}
