/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request schema for creating a business for authenticated user
 */
export type CreateBusinessRequest = {
    business_name?: (string | null);
    google_maps_url?: (string | null);
    google_maps_data?: (Record<string, any> | null);
    yelp_url?: (string | null);
    intent?: (string | null);
    tone?: (string | null);
    color_palette_id?: (string | null);
};

