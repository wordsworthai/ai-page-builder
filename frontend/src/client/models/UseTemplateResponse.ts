/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response from POST /generations/use-section-ids or use-template (legacy compatibility)
 */
export type UseTemplateResponse = {
    /**
     * New generation version ID
     */
    generation_version_id: string;
    /**
     * pending, processing
     */
    status?: string;
    /**
     * Human-readable message
     */
    message?: string;
    /**
     * Page ID (present when a new page was created)
     */
    page_id?: (string | null);
};

