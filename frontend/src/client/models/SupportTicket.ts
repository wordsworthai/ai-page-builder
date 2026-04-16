/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for a single support ticket
 */
export type SupportTicket = {
    /**
     * Ticket ID
     */
    ticket_id: string;
    /**
     * Ticket subject
     */
    subject?: (string | null);
    /**
     * Ticket category
     */
    category?: (string | null);
    /**
     * Ticket message
     */
    message: string;
    /**
     * Ticket status
     */
    status: string;
    /**
     * Creation timestamp
     */
    created_at: string;
    /**
     * Screenshot URL if available
     */
    screenshot_url?: (string | null);
};

