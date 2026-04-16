/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_publish_from_editor_api_publishing_publish_from_editor_post } from '../models/Body_publish_from_editor_api_publishing_publish_from_editor_post';
import type { Body_publish_page_api_publishing_publish_page_post } from '../models/Body_publish_page_api_publishing_publish_page_post';
import type { Body_quick_publish_api_publishing_quick_publish_post } from '../models/Body_quick_publish_api_publishing_quick_publish_post';
import type { EditorDefaultsResponse } from '../models/EditorDefaultsResponse';
import type { PublishFromEditorResponse } from '../models/PublishFromEditorResponse';
import type { PublishPageResponse } from '../models/PublishPageResponse';
import type { QuickPublishResponse } from '../models/QuickPublishResponse';
import type { SetActiveGenerationRequest } from '../models/SetActiveGenerationRequest';
import type { SetActiveGenerationResponse } from '../models/SetActiveGenerationResponse';
import type { SubdomainCheckRequest } from '../models/SubdomainCheckRequest';
import type { SubdomainCheckResponse } from '../models/SubdomainCheckResponse';
import type { WebsiteListResponse } from '../models/WebsiteListResponse';
import type { WebsitePageListResponse } from '../models/WebsitePageListResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PublishingService {
    /**
     * Get Editor Defaults
     * Get pre-fill data for editor publish modal.
     * @returns EditorDefaultsResponse Successful Response
     * @throws ApiError
     */
    public static getEditorDefaultsApiPublishingEditorDefaultsGet(): CancelablePromise<EditorDefaultsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/publishing/editor-defaults',
        });
    }
    /**
     * Publish From Editor
     * Unified publish endpoint for editor. Supports single-page and multi-page publishing.
     *
     * **Features:**
     * - Deterministic Hashed Storage (security/obscurity).
     * - Auto-Backups on Business ID.
     * - Safe renaming with cleanup control.
     * - Multi-page publishing: pass page_routes + page_html_files to publish all pages at once.
     * @param formData
     * @returns PublishFromEditorResponse Successful Response
     * @throws ApiError
     */
    public static publishFromEditorApiPublishingPublishFromEditorPost(
        formData: Body_publish_from_editor_api_publishing_publish_from_editor_post,
    ): CancelablePromise<PublishFromEditorResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/publishing/publish-from-editor',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Quick Publish
     * Create website + homepage + publish in one call (LEGACY - use publish-from-editor instead)
     * @param formData
     * @returns QuickPublishResponse Successful Response
     * @throws ApiError
     */
    public static quickPublishApiPublishingQuickPublishPost(
        formData: Body_quick_publish_api_publishing_quick_publish_post,
    ): CancelablePromise<QuickPublishResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/publishing/quick-publish',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Publish Page
     * Publish a specific page to S3 and CloudFront.
     * @param formData
     * @returns PublishPageResponse Successful Response
     * @throws ApiError
     */
    public static publishPageApiPublishingPublishPagePost(
        formData: Body_publish_page_api_publishing_publish_page_post,
    ): CancelablePromise<PublishPageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/publishing/publish-page',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Check Subdomain Availability
     * Check if a subdomain is available
     * @param requestBody
     * @returns SubdomainCheckResponse Successful Response
     * @throws ApiError
     */
    public static checkSubdomainAvailabilityApiPublishingCheckSubdomainPost(
        requestBody: SubdomainCheckRequest,
    ): CancelablePromise<SubdomainCheckResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/publishing/check-subdomain',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List User Websites
     * Get all websites for the current user
     * @returns WebsiteListResponse Successful Response
     * @throws ApiError
     */
    public static listUserWebsitesApiPublishingWebsitesGet(): CancelablePromise<WebsiteListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/publishing/websites',
        });
    }
    /**
     * List Website Pages
     * Get all pages for a specific website
     * @param websiteId
     * @returns WebsitePageListResponse Successful Response
     * @throws ApiError
     */
    public static listWebsitePagesApiPublishingWebsitesWebsiteIdPagesGet(
        websiteId: string,
    ): CancelablePromise<WebsitePageListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/publishing/websites/{website_id}/pages',
            path: {
                'website_id': websiteId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Set Homepage Active Generation
     * Set the active generation (current_generation_id) for a page.
     * If page_id is provided in the body, targets that page; otherwise defaults to homepage.
     * The generation must exist in workflow_input for the user's business.
     *
     * Returns the new active generation ID, preview_link, and whether compilation is needed.
     * @param requestBody
     * @returns SetActiveGenerationResponse Successful Response
     * @throws ApiError
     */
    public static setHomepageActiveGenerationApiPublishingHomepageActiveGenerationPatch(
        requestBody: SetActiveGenerationRequest,
    ): CancelablePromise<SetActiveGenerationResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/publishing/homepage/active-generation',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Publishing Health Check
     * Health check for publishing service
     * @returns any Successful Response
     * @throws ApiError
     */
    public static publishingHealthCheckApiPublishingHealthGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/publishing/health',
        });
    }
}
