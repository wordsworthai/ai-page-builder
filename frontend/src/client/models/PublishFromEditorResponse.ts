/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response for publishing from editor
 */
export type PublishFromEditorResponse = {
    success: boolean;
    message: string;
    website_id: string;
    page_id: string;
    subdomain: string;
    cloudfront_url: string;
    s3_path: string;
    invalidation_id: (string | null);
    is_new_website: boolean;
    subdomain_changed: boolean;
    pages_published?: number;
};

