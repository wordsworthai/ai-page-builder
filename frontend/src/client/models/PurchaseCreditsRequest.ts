/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to purchase a credit pack.
 */
export type PurchaseCreditsRequest = {
    /**
     * Credit pack ID to purchase
     */
    pack_id?: string;
    /**
     * Custom success URL after purchase
     */
    success_url?: (string | null);
    /**
     * Custom cancel URL
     */
    cancel_url?: (string | null);
};

