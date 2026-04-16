/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Complete credits information response.
 */
export type CreditsInfoResponse = {
    /**
     * Current credit balance
     */
    balance: number;
    /**
     * Current plan type
     */
    plan_type: string;
    /**
     * Credit cost per operation (key = workflow trigger type value, e.g. create-site)
     */
    costs: Record<string, number>;
    /**
     * Whether user has enough credits for a generation
     */
    can_generate: boolean;
    /**
     * Number of full page generations available with current balance
     */
    generations_available: number;
};

