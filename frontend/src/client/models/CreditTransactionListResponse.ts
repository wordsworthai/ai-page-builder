/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreditTransactionResponse } from './CreditTransactionResponse';
/**
 * Response for listing credit transactions.
 */
export type CreditTransactionListResponse = {
    /**
     * List of transactions
     */
    transactions?: Array<CreditTransactionResponse>;
    /**
     * Total number of transactions
     */
    total: number;
    /**
     * Page size
     */
    limit: number;
    /**
     * Current offset
     */
    offset: number;
};

