/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OnboardingEventCreate } from '../models/OnboardingEventCreate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProductAnalyticsService {
    /**
     * Track Onboarding Event
     * Track business info submission from create-site flow.
     *
     * NO AUTHENTICATION REQUIRED - tracks anonymous user behavior.
     *
     * Event is created every time user clicks "Next" on business info form,
     * regardless of whether they sign up or not.
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static trackOnboardingEventApiProductAnalyticsOnboardingEventPost(
        requestBody: OnboardingEventCreate,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/product-analytics/onboarding-event',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
