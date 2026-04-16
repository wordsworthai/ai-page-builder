/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request for AI image generation and ingestion (legacy blocking mode)
 */
export type GenerateAndIngestRequest = {
    /**
     * List of prompts for image generation
     */
    prompts: Array<string>;
    /**
     * Trade type (e.g., 'plumbing', 'hvac')
     */
    trade_type: string;
    /**
     * Organization ID for S3 path
     */
    org_id: string;
    /**
     * Optional category for the images
     */
    category?: (string | null);
    /**
     * Style modifier prepended to each prompt
     */
    style_modifier?: string;
    /**
     * Image aspect ratio. Options: 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 4:5, 5:4, 21:9
     */
    aspect_ratio?: string;
    /**
     * Output resolution. Options: 1K, 2K, 4K
     */
    image_size?: string;
    /**
     * Gemini model. Options: gemini-2.5-flash-image, gemini-3-pro-image-preview
     */
    model?: string;
    /**
     * If True, uses Real-time API (immediate, but 2x cost). If False (default), uses Batch API (50% cheaper, same quality). Both support aspect_ratio and image_size with gemini-3-pro-image-preview.
     */
    use_realtime?: boolean;
};

