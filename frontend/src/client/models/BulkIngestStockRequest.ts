/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request schema for bulk stock ingestion by query.
 */
export type BulkIngestStockRequest = {
    /**
     * Search query for Shutterstock
     */
    query: string;
    /**
     * Trade type (e.g., 'plumbing', 'hvac')
     */
    trade_type: string;
    /**
     * Media type: 'image' or 'video'
     */
    media_type?: string;
    /**
     * Number of results to ingest (default: 15)
     */
    limit?: number;
};

