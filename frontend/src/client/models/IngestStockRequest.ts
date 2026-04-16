/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request schema for stock ingestion
 */
export type IngestStockRequest = {
    /**
     * Search query used to find this stock media
     */
    search_query: string;
    /**
     * Business ID (optional for generic stock)
     */
    business_id?: (string | null);
    /**
     * Trade type for generic stock media
     */
    trade_type?: (string | null);
};

