/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Status of all batches for a trade
 */
export type BatchStatusResponse = {
    trade_type: string;
    status: string;
    total_batches: number;
    pending: number;
    succeeded: number;
    failed: number;
    processed: number;
    batch_jobs?: Record<string, Record<string, any>>;
};

