/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DateRange } from './DateRange';
import type { TrafficSource } from './TrafficSource';
/**
 * Response for GET /analytics/website/{website_id}/sources
 */
export type SourcesResponse = {
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
     * Traffic sources sorted by pageviews
     */
    sources: Array<TrafficSource>;
    /**
     * Total number of unique sources
     */
    total_sources: number;
};

