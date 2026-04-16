/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GenerationConfigItemConfig } from './GenerationConfigItemConfig';
/**
 * Single generation config from MongoDB workflow_input collection
 */
export type GenerationConfigItem = {
    /**
     * Generation version UUID
     */
    generation_version_id: string;
    /**
     * Intent, tone, color_palette_id
     */
    config?: GenerationConfigItemConfig;
    /**
     * When config was created
     */
    created_at?: (string | null);
    /**
     * Page ID this generation belongs to
     */
    page_id?: (string | null);
};

