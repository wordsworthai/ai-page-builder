/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to add or replace a section in-place (updates 3 DBs with lorem).
 */
export type AddSectionInPlaceRequest = {
    /**
     * ObjectId of the section to add/replace
     */
    section_id: string;
    /**
     * Position for insert mode (-1 = beginning)
     */
    insert_index?: number;
    /**
     * 'insert' or 'replace'
     */
    mode?: AddSectionInPlaceRequest.mode;
    /**
     * 0-based index for replace mode (required when mode='replace')
     */
    replace_index?: (number | null);
};
export namespace AddSectionInPlaceRequest {
    /**
     * 'insert' or 'replace'
     */
    export enum mode {
        INSERT = 'insert',
        REPLACE = 'replace',
    }
}

