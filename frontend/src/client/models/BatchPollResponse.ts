/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BatchStatusResponse } from './BatchStatusResponse';
/**
 * Response from polling all batches
 */
export type BatchPollResponse = {
    success: boolean;
    message: string;
    total_trades: number;
    trades_complete: number;
    trades_pending: number;
    details?: Array<BatchStatusResponse>;
};

