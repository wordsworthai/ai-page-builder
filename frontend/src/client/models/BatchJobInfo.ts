/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Info about a single batch job for one aspect ratio
 */
export type BatchJobInfo = {
    batch_job_name: string;
    prompts: Array<string>;
    prompt_count: number;
    status?: string;
    submitted_at?: (string | null);
    completed_at?: (string | null);
    processed_at?: (string | null);
    results?: (Record<string, any> | null);
};

