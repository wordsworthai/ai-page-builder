/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExistingWebsiteInfo_Output } from './ExistingWebsiteInfo_Output';
/**
 * Response for editor publish modal pre-fill data.
 * Includes business info and existing website (if any).
 */
export type EditorDefaultsResponse = {
    business_name: string;
    suggested_subdomain: string;
    existing_website?: (ExistingWebsiteInfo_Output | null);
};

