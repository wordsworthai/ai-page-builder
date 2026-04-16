/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type WebsitePageRead_Output = {
    /**
     * Path for the page (e.g., '/', '/menu')
     */
    page_path: string;
    /**
     * Title of the page
     */
    page_title: string;
    /**
     * Page meta description
     */
    description?: (string | null);
    page_id: string;
    website_id: string;
    is_published: boolean;
    published_at: (string | null);
    last_published_at: (string | null);
    last_s3_path: (string | null);
    last_cloudfront_url: (string | null);
    last_invalidation_id: (string | null);
    publish_count: number;
    last_edited_at: (string | null);
    created_at: (string | null);
    preview_link?: (string | null);
    dev_task_id?: (string | null);
    current_generation_id?: (string | null);
};

