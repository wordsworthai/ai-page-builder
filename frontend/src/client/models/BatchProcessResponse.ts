/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response from processing completed batches
 */
export type BatchProcessResponse = {
    success: boolean;
    trade_type: string;
    message: string;
    skipped?: boolean;
    total_images?: number;
    uploaded_count?: number;
    inserted_count?: number;
    skipped_count?: number;
    failed_count?: number;
    errors?: Array<Record<string, any>>;
};

