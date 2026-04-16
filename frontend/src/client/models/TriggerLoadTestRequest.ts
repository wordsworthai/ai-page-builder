/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request for internal load-test trigger (no request_id/callback_url; backend sets those).
 */
export type TriggerLoadTestRequest = {
    /**
     * Business name
     */
    business_name: string;
    /**
     * Website goal (e.g., 'generate_leads')
     */
    website_intention: string;
    /**
     * Website tone (e.g., 'professional')
     */
    website_tone: string;
    /**
     * Additional context
     */
    query?: (string | null);
    /**
     * Yelp business URL
     */
    yelp_url?: (string | null);
    /**
     * Color palette
     */
    palette?: (Record<string, any> | null);
    /**
     * Font family
     */
    font_family?: (string | null);
    /**
     * If False, node-update webhooks are not sent; useful for stress testing without Redis streaming.
     */
    enable_streaming?: boolean;
};

