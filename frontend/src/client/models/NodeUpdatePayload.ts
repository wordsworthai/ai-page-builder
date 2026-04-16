/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Payload sent to node_update_url webhook by orchestration service.
 */
export type NodeUpdatePayload = {
    request_id: string;
    node_name: string;
    display_name: string;
    status?: string;
    output_summary?: (string | null);
    output_type?: string;
    started_at?: (string | null);
    completed_at?: (string | null);
    duration_ms?: (number | null);
};

