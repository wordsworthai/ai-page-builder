/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HomepageInfo_Input } from './HomepageInfo_Input';
/**
 * Existing website information for editor pre-fill
 */
export type ExistingWebsiteInfo_Input = {
    website_id: string;
    subdomain: string;
    website_name: string;
    is_published: boolean;
    published_at: (string | null);
    live_url: (string | null);
    homepage: HomepageInfo_Input;
};

