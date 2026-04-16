/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DateRange } from './DateRange';
import type { PageDetail } from './PageDetail';
/**
 * Response for GET /analytics/website/{website_id}/pages
 */
export type PagesResponse = {
    /**
     * Website UUID
     */
    website_id: string;
    /**
     * Website subdomain
     */
    subdomain: string;
    date_range: DateRange;
    /**
     * List of pages with analytics
     */
    pages: Array<PageDetail>;
    /**
     * Total number of pages returned
     */
    total_pages: number;
};

