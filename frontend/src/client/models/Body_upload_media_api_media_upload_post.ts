/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Body_upload_media_api_media_upload_post = {
    /**
     * The media file to upload
     */
    file: Blob;
    /**
     * Business ID (required)
     */
    business_id: string;
    /**
     * Alt text for accessibility
     */
    alt?: (string | null);
};

