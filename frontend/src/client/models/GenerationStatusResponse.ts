/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NodeExecutionEntry } from './NodeExecutionEntry';
/**
 * Response from status polling endpoint.
 *
 * SIMPLIFIED: execution_log entries no longer have phase/parallel fields.
 */
export type GenerationStatusResponse = {
    generation_version_id: string;
    /**
     * pending, processing, completed, failed
     */
    status: string;
    /**
     * When generation started
     */
    started_at?: (string | null);
    /**
     * Seconds elapsed since start
     */
    elapsed_seconds?: number;
    /**
     * Current node name (internal)
     */
    current_node?: (string | null);
    /**
     * Current node display name
     */
    current_node_display?: (string | null);
    /**
     * Number of nodes completed
     */
    nodes_completed?: number;
    /**
     * Ordered list of completed node executions
     */
    execution_log?: Array<NodeExecutionEntry>;
    /**
     * S3 preview URL
     */
    preview_link?: (string | null);
    /**
     * Error details (if failed)
     */
    error_message?: (string | null);
    /**
     * DEPRECATED: Progress percentage
     */
    progress?: number;
    /**
     * DEPRECATED
     */
    dev_task_id?: (string | null);
    /**
     * Query hash from workflow
     */
    query_hash?: (string | null);
    created_at?: (string | null);
    completed_at?: (string | null);
};

