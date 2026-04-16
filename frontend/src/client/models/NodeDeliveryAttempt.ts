/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Per-node delivery attempt from orchestration (success or failed) with timing.
 */
export type NodeDeliveryAttempt = {
    /**
     * Internal node identifier
     */
    node_name: string;
    /**
     * success or failed
     */
    status: string;
    /**
     * ISO datetime when attempt started (for time-series)
     */
    attempted_at?: (string | null);
    duration_ms?: (number | null);
    error_type?: (string | null);
};

