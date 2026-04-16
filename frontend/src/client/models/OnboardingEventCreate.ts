/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for onboarding event creation
 */
export type OnboardingEventCreate = {
    /**
     * Frontend-generated session ID from localStorage
     */
    session_id: string;
    /**
     * Business name entered by user
     */
    business_name?: (string | null);
    /**
     * Google Maps URL entered by user
     */
    google_maps_url?: (string | null);
    /**
     * Yelp URL entered by user
     */
    yelp_url?: (string | null);
    /**
     * Full Google Places API response
     */
    google_places_data?: (Record<string, any> | null);
};

