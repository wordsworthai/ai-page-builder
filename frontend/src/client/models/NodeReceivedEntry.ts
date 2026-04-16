/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Per-node received entry on main app (payload size and Redis write timing).
 */
export type NodeReceivedEntry = {
    /**
     * Internal node identifier
     */
    node_name: string;
    payload_bytes?: number;
    redis_write_ms?: number;
    /**
     * ISO datetime when received
     */
    received_at?: (string | null);
};

