/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Body_submit_contact_support_api_contact_support_submit_post = {
    /**
     * User's name
     */
    name: string;
    /**
     * User's email address
     */
    email: string;
    /**
     * Category of inquiry
     */
    category?: (string | null);
    /**
     * Subject line (optional)
     */
    subject?: (string | null);
    /**
     * Message content
     */
    message: string;
    /**
     * Current page path
     */
    current_page?: (string | null);
    /**
     * Full current URL
     */
    current_url?: (string | null);
    /**
     * User agent string
     */
    user_agent?: (string | null);
    /**
     * Device type
     */
    device_type?: (string | null);
    /**
     * Optional screenshot image
     */
    screenshot?: (Blob | null);
};

