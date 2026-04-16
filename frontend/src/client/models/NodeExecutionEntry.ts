/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Single node execution entry for streaming progress UI.
 *
 * SIMPLIFIED: Removed phase, parallel_group, parallel_key.
 * UPDATED: Added output_type for HTML rendering support.
 */
export type NodeExecutionEntry = {
    /**
     * Internal node identifier
     */
    node_name: string;
    /**
     * Human-readable name
     */
    display_name: string;
    /**
     * Node status: completed, failed
     */
    status?: string;
    /**
     * Formatted output for UI (if show_output=True)
     */
    output_summary?: (string | null);
    /**
     * Output format: 'text' or 'html'
     */
    output_type?: (string | null);
    /**
     * ISO timestamp when node started
     */
    started_at?: (string | null);
    /**
     * ISO timestamp when node completed
     */
    completed_at?: (string | null);
    /**
     * Node execution duration in milliseconds
     */
    duration_ms?: (number | null);
};

