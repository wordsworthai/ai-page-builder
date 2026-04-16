/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for incoming form submission from published website.
 * All fields are dynamic except domain and page_path.
 */
export type FormSubmissionCreate = {
    /**
     * Website domain (e.g., mysite.example.com)
     */
    domain: string;
    /**
     * Page path (e.g., /contact)
     */
    page_path: string;
    /**
     * Form type if specified in HTML
     */
    form_type?: (string | null);
    /**
     * Dynamic form field data
     */
    data: Record<string, any>;
};

