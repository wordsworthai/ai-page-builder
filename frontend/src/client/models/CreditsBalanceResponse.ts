/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response for credit balance query.
 */
export type CreditsBalanceResponse = {
    /**
     * Current credit balance
     */
    balance: number;
    /**
     * Current plan type (FREE, BASIC, CUSTOM)
     */
    plan_type: string;
    /**
     * When subscription ends (for cancellation handling)
     */
    subscription_ends_at?: (string | null);
    /**
     * When credits were last added
     */
    last_credit_grant_at?: (string | null);
};

