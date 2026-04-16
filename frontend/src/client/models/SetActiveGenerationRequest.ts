/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request body for PATCH /publishing/homepage/active-generation
 */
export type SetActiveGenerationRequest = {
    /**
     * Generation version ID to set as active
     */
    generation_version_id: string;
    /**
     * Page ID to set active generation for. If not provided, defaults to homepage.
     */
    page_id?: (string | null);
};

