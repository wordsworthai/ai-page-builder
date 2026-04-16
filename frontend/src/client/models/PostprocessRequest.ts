/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to post-process variations for a trade.
 */
export type PostprocessRequest = {
    /**
     * Trade type to process
     */
    trade_type: string;
    /**
     * Number of images to process per call
     */
    batch_size?: number;
};

