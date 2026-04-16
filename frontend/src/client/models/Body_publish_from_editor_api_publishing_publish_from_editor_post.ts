/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Body_publish_from_editor_api_publishing_publish_from_editor_post = {
    /**
     * Subdomain name (e.g., 'joeshvac')
     */
    subdomain: string;
    /**
     * Website title (e.g., 'Joe's HVAC')
     */
    website_title: string;
    /**
     * HTML file to upload (homepage for single-page, or fallback)
     */
    html_file: Blob;
    /**
     * Meta description (optional)
     */
    description?: (string | null);
    /**
     * Favicon file (optional)
     */
    favicon_file?: (Blob | null);
    /**
     * Delete old S3 folder if subdomain changes
     */
    cleanup_old_resources?: boolean;
    /**
     * JSON array of page paths for multi-page publish
     */
    page_routes?: (string | null);
    /**
     * HTML files per page, matching page_routes order
     */
    page_html_files?: (Array<Blob> | null);
    /**
     * JSON array of page titles matching page_routes order
     */
    page_titles?: (string | null);
};

