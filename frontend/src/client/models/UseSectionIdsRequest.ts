/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to create a new generation using specific section IDs.
 */
export type UseSectionIdsRequest = {
    /**
     * Generation to use as source (same page)
     */
    source_generation_version_id: string;
    /**
     * List of section IDs to use
     */
    section_ids: Array<string>;
    /**
     * Website intention (if different from source)
     */
    intent?: (string | null);
    /**
     * Page path for new page (e.g., '/about'). If provided, creates a new WebsitePage.
     */
    page_path?: (string | null);
    /**
     * Page title for new page (e.g., 'About Us'). Required if page_path is provided.
     */
    page_title?: (string | null);
    /**
     * Page type slug (e.g., 'contact-us', 'services'). If not provided, derived from page_path.
     */
    page_type?: (string | null);
};

