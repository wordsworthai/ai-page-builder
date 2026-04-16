/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SupportTicket } from './SupportTicket';
/**
 * Response containing list of support tickets
 */
export type SupportTicketsListResponse = {
    /**
     * List of support tickets
     */
    tickets: Array<SupportTicket>;
    /**
     * Total number of tickets
     */
    total_count: number;
    /**
     * Average response time
     */
    average_response_time: string;
};

