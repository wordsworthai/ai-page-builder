/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FormSubmissionCreate } from '../models/FormSubmissionCreate';
import type { FormSubmissionResponse } from '../models/FormSubmissionResponse';
import type { FormSubmissionsListResponse } from '../models/FormSubmissionsListResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FormsService {
    /**
     * Get Form Submissions
     * **AUTHENTICATED ENDPOINT** - Requires user login.
     *
     * Get all form submissions for the current user's business.
     * Returns submissions grouped by form_id for tab display.
     *
     * - Uses business_id from current_user
     * - Retrieves all submissions for that business
     * - Groups by form_id
     * @returns FormSubmissionsListResponse Successful Response
     * @throws ApiError
     */
    public static getFormSubmissionsApiFormsFormSubmissionsGet(): CancelablePromise<FormSubmissionsListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/forms/form-submissions',
        });
    }
    /**
     * Submit Form
     * **PUBLIC ENDPOINT** - No authentication required.
     *
     * Submit a form from a published website.
     *
     * - Validates domain exists in websites table
     * - Generates form_id from field structure
     * - Stores submission in MongoDB
     * @param requestBody
     * @returns FormSubmissionResponse Successful Response
     * @throws ApiError
     */
    public static submitFormApiFormsFormSubmissionsPost(
        requestBody: FormSubmissionCreate,
    ): CancelablePromise<FormSubmissionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/forms/form-submissions',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Form Indexes
     * **ADMIN ENDPOINT** - Create MongoDB indexes for form submissions.
     *
     * Should be called once during initial setup or migration.
     * Can be called by any authenticated user (consider restricting to superuser).
     * @returns any Successful Response
     * @throws ApiError
     */
    public static createFormIndexesApiFormsFormSubmissionsCreateIndexesPost(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/forms/form-submissions/create-indexes',
        });
    }
}
