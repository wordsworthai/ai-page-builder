/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to regenerate color theme using AutopopOnlyWorkflow
 */
export type RegenerateColorThemeRequest = {
    /**
     * Color palette ID
     */
    palette_id: string;
    /**
     * Full palette object with colors
     */
    palette: Record<string, any>;
    /**
     * Font family (optional)
     */
    font_family?: (string | null);
};

