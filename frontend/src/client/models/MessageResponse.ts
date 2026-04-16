/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CitationItemSchema } from './CitationItemSchema';
export type MessageResponse = {
    id: string;
    role: string;
    content: string;
    citations?: (Array<CitationItemSchema> | null);
    created_at: string;
};

