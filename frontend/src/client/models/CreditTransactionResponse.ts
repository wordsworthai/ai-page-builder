/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response for a single credit transaction.
 */
export type CreditTransactionResponse = {
    /**
     * Unique transaction ID
     */
    transaction_id: string;
    /**
     * Type of transaction
     */
    transaction_type: string;
    /**
     * Credits added (positive) or deducted (negative)
     */
    credits_change: number;
    /**
     * Balance after this transaction
     */
    credits_balance_after: number;
    /**
     * Reference ID (e.g., generation_version_id, stripe_session_id)
     */
    reference_id?: (string | null);
    /**
     * Transaction description
     */
    description?: (string | null);
    /**
     * When transaction occurred
     */
    created_at: string;
};

