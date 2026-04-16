/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Status of post-processing for trades.
 */
export type PostprocessStatusResponse = {
    success: boolean;
    message?: (string | null);
    trade_type?: (string | null);
    postprocess_status?: (string | null);
    total_images?: (number | null);
    processed_images?: (number | null);
    remaining?: (number | null);
    progress_percent?: (number | null);
    trades?: null;
    total_trades?: (number | null);
    summary?: (Record<string, any> | null);
};

