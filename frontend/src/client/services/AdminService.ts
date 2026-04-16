/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminService {
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
