/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NodeUpdatesMetrics } from './NodeUpdatesMetrics';
import type { StatusPollsMetrics } from './StatusPollsMetrics';
/**
 * Persisted per-generation performance metrics (GET /generations/{id}/metrics).
 */
export type GenerationPerformanceMetrics = {
    /**
     * Generation version UUID
     */
    generation_version_id: string;
    /**
     * completed or failed
     */
    status: string;
    /**
     * When document was written
     */
    recorded_at?: (string | null);
    /**
     * ISO datetime of first node-update or poll
     */
    started_at?: (string | null);
    /**
     * ISO datetime when callback was received
     */
    completed_at?: (string | null);
    duration_seconds?: (number | null);
    node_updates?: (NodeUpdatesMetrics | null);
    status_polls?: (StatusPollsMetrics | null);
    execution_log_length?: (number | null);
    /**
     * Business UUID for filtering
     */
    business_id?: (string | null);
};

