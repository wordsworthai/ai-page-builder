/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to submit batches for a trade
 */
export type BatchSubmitRequest = {
    /**
     * Trade type to process
     */
    trade_type: string;
    /**
     * Organization ID for S3 path
     */
    org_id: string;
    /**
     * Style modifier prepended to each prompt
     */
    style_modifier?: string;
    /**
     * Output resolution: 1K, 2K, 4K
     */
    image_size?: string;
    /**
     * Gemini model to use
     */
    model?: string;
};

