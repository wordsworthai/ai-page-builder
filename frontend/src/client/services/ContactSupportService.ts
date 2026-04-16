/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_submit_contact_support_api_contact_support_submit_post } from '../models/Body_submit_contact_support_api_contact_support_submit_post';
import type { ContactSupportResponse } from '../models/ContactSupportResponse';
import type { SupportTicketsListResponse } from '../models/SupportTicketsListResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ContactSupportService {
    /**
     * Submit contact support form
     * **PUBLIC ENDPOINT** - No authentication required.
     *
     * Submit a contact support form with optional screenshot upload.
     *
     * - Captures user details (name, email)
     * - Optional category and subject
     * - Required message
     * - Optional screenshot (uploaded to S3)
     * - Auto-captures metadata (page, user agent, device type, etc.)
     * - Stores submission in MongoDB (contact_us.customer_support_form)
     * @param formData
     * @returns ContactSupportResponse Successful Response
     * @throws ApiError
     */
    public static submitContactSupportApiContactSupportSubmitPost(
        formData: Body_submit_contact_support_api_contact_support_submit_post,
    ): CancelablePromise<ContactSupportResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/contact-support/submit',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get user's support tickets
     * **AUTHENTICATED ENDPOINT** - Requires authentication.
     *
     * Get all support tickets submitted by the current user.
     *
     * Returns:
     * - List of all tickets submitted by the user
     * - Total count of tickets
     * - Average response time
     * @returns SupportTicketsListResponse Successful Response
     * @throws ApiError
     */
    public static getMyTicketsApiContactSupportMyTicketsGet(): CancelablePromise<SupportTicketsListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/contact-support/my-tickets',
        });
    }
}
