/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DocumentTabSchema } from './DocumentTabSchema';
/**
 * Partial update — all fields optional.
 */
export type SessionUpdate = {
    name?: (string | null);
    document_tabs?: (Array<DocumentTabSchema> | null);
    active_document_tab_index?: (number | null);
    active_chat_tab_index?: (number | null);
};

