/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request for slot-specific media recommendations.
 */
export type SlotMediaMatchRequest = {
    /**
     * Element ID within the section
     */
    element_id?: (string | null);
    /**
     * Type of block containing the slot (e.g., 'hero', 'gallery')
     */
    block_type?: (string | null);
    /**
     * Index of block within section (0-based)
     */
    block_index?: (number | null);
    /**
     * Identifier of the section containing the slot
     */
    section_id?: (string | null);
    /**
     * Required width in pixels
     */
    width: number;
    /**
     * Required height in pixels
     */
    height: number;
    /**
     * List of sources to fetch from: generated, google_maps, stock
     */
    retrieval_sources?: (Array<string> | null);
    /**
     * Maximum number of recommendations to return (default: 10, will be limited to available images)
     */
    max_recommendations?: number;
    /**
     * Type of media to match: 'image' or 'video' (default: 'image')
     */
    media_type?: (string | null);
};

