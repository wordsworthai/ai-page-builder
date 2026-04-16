/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CountriesResponse } from '../models/CountriesResponse';
import type { DevicesResponse } from '../models/DevicesResponse';
import type { OverviewResponse } from '../models/OverviewResponse';
import type { PagesResponse } from '../models/PagesResponse';
import type { SourcesResponse } from '../models/SourcesResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PublishedWebsiteAnalyticsService {
    /**
     * Get Website Overview
     * Get overview analytics for a website.
     *
     * Returns:
     * - Total pageviews and unique visitors
     * - Daily trend data
     * - Top 10 pages
     *
     * **Date Range:**
     * - Default: Last 30 days
     * - Custom: Provide both start_date and end_date
     * - Maximum: Any historical range available
     *
     * **Authorization:** Requires user to own the website
     * @param websiteId
     * @param startDate Start date for analytics (YYYY-MM-DD). Default: 30 days ago
     * @param endDate End date for analytics (YYYY-MM-DD). Default: today
     * @returns OverviewResponse Successful Response
     * @throws ApiError
     */
    public static getWebsiteOverviewApiPublishedWebsiteAnalyticsWebsiteWebsiteIdOverviewGet(
        websiteId: string,
        startDate?: (string | null),
        endDate?: (string | null),
    ): CancelablePromise<OverviewResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/published-website-analytics/website/{website_id}/overview',
            path: {
                'website_id': websiteId,
            },
            query: {
                'start_date': startDate,
                'end_date': endDate,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Pages Breakdown
     * Get page-level analytics breakdown.
     *
     * Returns:
     * - List of pages with pageviews and unique visitors
     * - Sorted by pageviews (descending)
     *
     * **Pagination:**
     * - Use `limit` parameter to control number of results
     * - Maximum: 100 pages
     *
     * **Authorization:** Requires user to own the website
     * @param websiteId
     * @param startDate Start date for analytics (YYYY-MM-DD). Default: 30 days ago
     * @param endDate End date for analytics (YYYY-MM-DD). Default: today
     * @param limit Maximum number of pages to return (1-100)
     * @returns PagesResponse Successful Response
     * @throws ApiError
     */
    public static getPagesBreakdownApiPublishedWebsiteAnalyticsWebsiteWebsiteIdPagesGet(
        websiteId: string,
        startDate?: (string | null),
        endDate?: (string | null),
        limit: number = 50,
    ): CancelablePromise<PagesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/published-website-analytics/website/{website_id}/pages',
            path: {
                'website_id': websiteId,
            },
            query: {
                'start_date': startDate,
                'end_date': endDate,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Traffic Sources
     * Get traffic sources (referrers) breakdown.
     *
     * Returns:
     * - List of traffic sources with pageview counts
     * - Sorted by pageviews (descending)
     *
     * **Source Types:**
     * - `direct`: Direct traffic (no referrer)
     * - `google.com`: Search engines
     * - `facebook.com`: Social media
     * - Domain names: Other referrers
     *
     * **Authorization:** Requires user to own the website
     * @param websiteId
     * @param startDate Start date for analytics (YYYY-MM-DD). Default: 30 days ago
     * @param endDate End date for analytics (YYYY-MM-DD). Default: today
     * @returns SourcesResponse Successful Response
     * @throws ApiError
     */
    public static getTrafficSourcesApiPublishedWebsiteAnalyticsWebsiteWebsiteIdSourcesGet(
        websiteId: string,
        startDate?: (string | null),
        endDate?: (string | null),
    ): CancelablePromise<SourcesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/published-website-analytics/website/{website_id}/sources',
            path: {
                'website_id': websiteId,
            },
            query: {
                'start_date': startDate,
                'end_date': endDate,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Countries
     * Get geographic (country) breakdown.
     *
     * Returns:
     * - List of countries with pageview counts
     * - Sorted by pageviews (descending)
     *
     * **Country Codes:**
     * - ISO 3166-1 alpha-2 format (US, IN, UK, CA, etc.)
     * - Inferred from CloudFront edge location
     *
     * **Authorization:** Requires user to own the website
     * @param websiteId
     * @param startDate Start date for analytics (YYYY-MM-DD). Default: 30 days ago
     * @param endDate End date for analytics (YYYY-MM-DD). Default: today
     * @returns CountriesResponse Successful Response
     * @throws ApiError
     */
    public static getCountriesApiPublishedWebsiteAnalyticsWebsiteWebsiteIdCountriesGet(
        websiteId: string,
        startDate?: (string | null),
        endDate?: (string | null),
    ): CancelablePromise<CountriesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/published-website-analytics/website/{website_id}/countries',
            path: {
                'website_id': websiteId,
            },
            query: {
                'start_date': startDate,
                'end_date': endDate,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Devices
     * Get device type breakdown.
     *
     * Returns:
     * - List of device types with pageview counts
     * - Sorted by pageviews (descending)
     *
     * **Device Types:**
     * - `mobile`: Mobile phones
     * - `desktop`: Desktop computers
     * - `tablet`: Tablets
     *
     * **Detection Method:**
     * - Parsed from User-Agent header
     *
     * **Authorization:** Requires user to own the website
     * @param websiteId
     * @param startDate Start date for analytics (YYYY-MM-DD). Default: 30 days ago
     * @param endDate End date for analytics (YYYY-MM-DD). Default: today
     * @returns DevicesResponse Successful Response
     * @throws ApiError
     */
    public static getDevicesApiPublishedWebsiteAnalyticsWebsiteWebsiteIdDevicesGet(
        websiteId: string,
        startDate?: (string | null),
        endDate?: (string | null),
    ): CancelablePromise<DevicesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/published-website-analytics/website/{website_id}/devices',
            path: {
                'website_id': websiteId,
            },
            query: {
                'start_date': startDate,
                'end_date': endDate,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Analytics Health Check
     * Health check for analytics service
     * @returns any Successful Response
     * @throws ApiError
     */
    public static analyticsHealthCheckApiPublishedWebsiteAnalyticsHealthGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/published-website-analytics/health',
        });
    }
}
