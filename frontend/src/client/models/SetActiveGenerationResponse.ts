/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response for PATCH /publishing/homepage/active-generation
 */
export type SetActiveGenerationResponse = {
    /**
     * Updated active generation ID on homepage
     */
    current_generation_id: string;
    /**
     * Preview link for the active version
     */
    preview_link?: (string | null);
    /**
     * True if the version needs to be compiled (no cached preview)
     */
    needs_compilation?: boolean;
};

