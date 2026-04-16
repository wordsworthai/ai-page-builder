/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for reading form submissions from database.
 * Used in dashboard display.
 */
export type FormSubmissionRead = {
    submission_id: string;
    form_id: string;
    business_id: string;
    domain: string;
    page_path: string;
    form_type?: (string | null);
    submitted_at: string;
    data: Record<string, any>;
};

