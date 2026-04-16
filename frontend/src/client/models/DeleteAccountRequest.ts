/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request schema for deleting user account (soft delete)
 */
export type DeleteAccountRequest = {
    password?: (string | null);
    confirmation: string;
    reason?: (string | null);
};

