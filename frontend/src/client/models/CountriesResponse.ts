/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CountryData } from './CountryData';
import type { DateRange } from './DateRange';
/**
 * Response for GET /analytics/website/{website_id}/countries
 */
export type CountriesResponse = {
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
     * Countries sorted by pageviews
     */
    countries: Array<CountryData>;
    /**
     * Total number of unique countries
     */
    total_countries: number;
};

