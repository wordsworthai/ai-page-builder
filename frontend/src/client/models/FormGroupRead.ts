/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FormSubmissionRead } from './FormSubmissionRead';
/**
 * Represents a group of submissions for a single form type.
 * Used for tab display in dashboard.
 */
export type FormGroupRead = {
    form_id: string;
    form_type?: (string | null);
    form_label: string;
    field_names: Array<string>;
    submission_count: number;
    submissions: Array<FormSubmissionRead>;
};

