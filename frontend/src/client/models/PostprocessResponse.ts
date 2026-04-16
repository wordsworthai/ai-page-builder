/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response from post-processing.
 */
export type PostprocessResponse = {
    success: boolean;
    trade_type: string;
    status?: string;
    message: string;
    processed?: number;
    failed?: number;
    remaining?: number;
    errors?: null;
};

