/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GenerationConfigItem } from './GenerationConfigItem';
/**
 * Response for GET /generations/configs
 */
export type GenerationConfigListResponse = {
    /**
     * Generation configs for the user's business, newest first
     */
    configs?: Array<GenerationConfigItem>;
};

