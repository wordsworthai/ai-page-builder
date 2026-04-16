/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConversationSummary } from './ConversationSummary';
import type { DocumentTabSchema } from './DocumentTabSchema';
export type SessionResponse = {
    id: string;
    name: string;
    status: string;
    document_tabs: Array<DocumentTabSchema>;
    active_document_tab_index: number;
    active_chat_tab_index: number;
    conversations: Array<ConversationSummary>;
    access_level: string;
    created_at: string;
    updated_at: string;
};

