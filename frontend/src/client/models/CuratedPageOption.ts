/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Single curated page option from MongoDB curated_pages collection.
 */
export type CuratedPageOption = {
    /**
     * Path of the curated page
     */
    page_path: string;
    /**
     * Title of the curated page
     */
    page_title: string;
    /**
     * List of section IDs in the page
     */
    section_ids: Array<string>;
    /**
     * List of desktop screenshot URLs for sections
     */
    section_desktop_urls: Array<string>;
};

