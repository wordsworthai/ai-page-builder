/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to trigger page generation
 */
export type GeneratePageRequest = {
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
     * Color palette ID (e.g., 'palette_blue_modern')
     */
    color_palette_id?: (string | null);
    /**
     * Google Places API data
     */
    google_places_data?: (Record<string, any> | null);
    /**
     * Yelp business URL
     */
    yelp_url?: (string | null);
    /**
     * Additional context
     */
    query?: (string | null);
    /**
     * Color palette
     */
    palette?: (Record<string, any> | null);
    /**
     * Font family
     */
    font_family?: (string | null);
};

