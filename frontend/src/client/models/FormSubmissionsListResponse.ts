/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FormGroupRead } from './FormGroupRead';
/**
 * Response containing all form groups for a business.
 */
export type FormSubmissionsListResponse = {
    business_id: string;
    total_submissions: number;
    forms: Array<FormGroupRead>;
};

