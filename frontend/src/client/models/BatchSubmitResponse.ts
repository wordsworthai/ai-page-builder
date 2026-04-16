/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BatchJobInfo } from './BatchJobInfo';
/**
 * Response from batch submission
 */
export type BatchSubmitResponse = {
    success: boolean;
    trade_type: string;
    message: string;
    batches_submitted: number;
    batch_jobs?: Record<string, BatchJobInfo>;
};

