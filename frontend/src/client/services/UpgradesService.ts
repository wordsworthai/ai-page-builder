/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreditPackRequest } from '../models/CreditPackRequest';
import type { UpgradeRequest } from '../models/UpgradeRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UpgradesService {
    /**
     * Get Upgrade Options
     * Get available upgrade options for the current user.
     *
     * Returns:
     * - For FREE users: BASIC subscription option
     * - For BASIC+ users: Credit pack purchase options
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getUpgradeOptionsApiUpgradesOptionsGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/upgrades/options',
        });
    }
    /**
     * Create Upgrade Checkout
     * Create checkout session for upgrading to BASIC plan.
     *
     * Only available for FREE users. BASIC+ users should use /credits/purchase instead.
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static createUpgradeCheckoutApiUpgradesCheckoutPost(
        requestBody?: UpgradeRequest,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/upgrades/checkout',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Purchase Credit Pack
     * Purchase a credit pack.
     *
     * Only available for BASIC+ subscribers. FREE users should upgrade first.
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static purchaseCreditPackApiUpgradesCreditsPost(
        requestBody?: CreditPackRequest,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/upgrades/credits',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
