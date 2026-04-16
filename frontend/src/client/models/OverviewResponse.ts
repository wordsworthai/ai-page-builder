/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DailyTrend } from './DailyTrend';
import type { DateRange } from './DateRange';
import type { TopPage } from './TopPage';
/**
 * Response for GET /analytics/website/{website_id}/overview
 */
export type OverviewResponse = {
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
     * Total page views in period
     */
    total_pageviews: number;
    /**
     * Total unique visitors in period
     */
    total_unique_visitors: number;
    /**
     * Daily trend data
     */
    trend: Array<DailyTrend>;
    /**
     * Top 10 pages by views
     */
    top_pages: Array<TopPage>;
    /**
     * Optional message (e.g., no data available)
     */
    message?: (string | null);
};

