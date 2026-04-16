/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Internal callback from landing page workflow. Accepts request_id (orchestration) or generation_version_id (legacy).
 */
export type GenerationCallbackRequest = {
    generation_version_id?: (string | null);
    /**
     * Orchestration sends this; mapped to generation_version_id
     */
    request_id?: (string | null);
    /**
     * completed or failed
     */
    status: string;
    tokens_used?: (number | null);
    estimated_cost_usd?: (number | null);
    error_message?: (string | null);
    /**
     * Orchestration sends result; alias for landing_page_output
     */
    result?: (Record<string, any> | null);
    node_updates_attempted?: (number | null);
    node_updates_failed?: (number | null);
    /**
     * Error type name -> count
     */
    node_updates_failed_reasons?: (Record<string, any> | null);
    /**
     * Per-node attempt: node_name, status, duration_ms, error_type
     */
    node_delivery_attempts?: null;
};

