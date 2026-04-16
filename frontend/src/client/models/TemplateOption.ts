/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Single template option for the editor (from smb_section_cache).
 */
export type TemplateOption = {
    /**
     * Template identifier
     */
    template_id: string;
    /**
     * Display name
     */
    template_name: string;
    /**
     * Number of sections
     */
    section_count: number;
    /**
     * Index in list (0, 1, 2)
     */
    index: number;
    /**
     * True if this template is used for the current generation
     */
    is_current?: boolean;
    /**
     * List of section IDs in a template
     */
    section_ids?: Array<string>;
    /**
     * URLs for section desktop previews
     */
    section_desktop_urls?: (Array<string> | null);
    /**
     * Website intention for this template
     */
    intent?: (string | null);
};

