/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Unified citation schema supporting both document and web sources.
 */
export type CitationItemSchema = {
    id: number;
    content: string;
    source_type?: ('document' | 'web' | null);
    doc_id?: (string | null);
    filename?: (string | null);
    page_numbers?: (Array<number> | null);
    positions?: (Array<Array<number>> | null);
    url?: (string | null);
    title?: (string | null);
};

