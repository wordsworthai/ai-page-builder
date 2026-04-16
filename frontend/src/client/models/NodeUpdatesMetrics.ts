/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DurationStats } from './DurationStats';
import type { MinMaxSumCount } from './MinMaxSumCount';
import type { NodeDeliveryAttempt } from './NodeDeliveryAttempt';
import type { NodeReceivedEntry } from './NodeReceivedEntry';
/**
 * Node-update metrics (orchestration attempted/failed + main app received).
 */
export type NodeUpdatesMetrics = {
    attempted?: (number | null);
    failed?: (number | null);
    /**
     * Error type name -> count
     */
    failed_reasons?: (Record<string, any> | null);
    received?: number;
    payload_bytes?: (MinMaxSumCount | null);
    redis_write_duration_ms?: (DurationStats | null);
    /**
     * Per-node attempts from orchestration (success/failed + duration_ms)
     */
    node_delivery_attempts?: (Array<NodeDeliveryAttempt> | null);
    /**
     * Per-node received on main app (payload_bytes, redis_write_ms)
     */
    nodes_received?: (Array<NodeReceivedEntry> | null);
};

