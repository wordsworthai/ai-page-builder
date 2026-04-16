/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response from AI image generation (legacy)
 */
export type GenerateAndIngestResponse = {
    success: boolean;
    batch_job_name?: (string | null);
    total_prompts: number;
    message: string;
    /**
     * API mode used: 'batch' or 'realtime'
     */
    api_mode?: string;
    job_state?: (string | null);
    uploaded_count?: (number | null);
    inserted_count?: (number | null);
    failed_count?: (number | null);
    errors?: null;
};

