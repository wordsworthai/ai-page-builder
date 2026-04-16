/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreditsBalanceResponse } from '../models/CreditsBalanceResponse';
import type { CreditsInfoResponse } from '../models/CreditsInfoResponse';
import type { CreditTransactionListResponse } from '../models/CreditTransactionListResponse';
import type { PurchaseCreditsRequest } from '../models/PurchaseCreditsRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CreditsService {
    /**
     * Get Credits Balance
     * Get current credit balance for the user's business.
     *
     * Returns:
     * CreditsBalanceResponse with current balance and plan info
     * @returns CreditsBalanceResponse Successful Response
     * @throws ApiError
     */
    public static getCreditsBalanceApiCreditsBalanceGet(): CancelablePromise<CreditsBalanceResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/credits/balance',
        });
    }
    /**
     * Get Credit Transactions
     * Get credit transaction history for the user's business.
     *
     * Args:
     * limit: Maximum number of transactions to return (default 50)
     * offset: Number of transactions to skip (for pagination)
     *
     * Returns:
     * CreditTransactionListResponse with list of transactions
     * @param limit
     * @param offset
     * @returns CreditTransactionListResponse Successful Response
     * @throws ApiError
     */
    public static getCreditTransactionsApiCreditsTransactionsGet(
        limit: number = 50,
        offset?: number,
    ): CancelablePromise<CreditTransactionListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/credits/transactions',
            query: {
                'limit': limit,
                'offset': offset,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Credits Info
     * Get complete credit information including balance and costs.
     *
     * Returns:
     * CreditsInfoResponse with balance, plan, costs, and generation availability
     * @returns CreditsInfoResponse Successful Response
     * @throws ApiError
     */
    public static getCreditsInfoApiCreditsInfoGet(): CancelablePromise<CreditsInfoResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/credits/info',
        });
    }
    /**
     * Purchase Credits
     * Purchase a credit pack.
     *
     * Only available to BASIC+ subscribers.
     * FREE users should upgrade to BASIC first.
     *
     * Args:
     * request: PurchaseCreditsRequest with pack_id
     *
     * Returns:
     * Checkout session info with URL to complete purchase
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static purchaseCreditsApiCreditsPurchasePost(
        requestBody?: PurchaseCreditsRequest,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/credits/purchase',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
