/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BatchSectionTemplateRequest } from '../models/BatchSectionTemplateRequest';
import type { CategoryResponse } from '../models/CategoryResponse';
import type { CuratedPagesResponse } from '../models/CuratedPagesResponse';
import type { GenerationTemplatesResponse } from '../models/GenerationTemplatesResponse';
import type { SaveTemplateRequest } from '../models/SaveTemplateRequest';
import type { SectionMetadataResponse } from '../models/SectionMetadataResponse';
import type { TemplateBuildOutput } from '../models/TemplateBuildOutput';
import type { TemplateWithPageInfo } from '../models/TemplateWithPageInfo';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TemplatesService {
    /**
     * List Curated Pages
     * List all available curated pages from MongoDB curated_pages collection (via orchestration).
     * @returns CuratedPagesResponse Successful Response
     * @throws ApiError
     */
    public static listCuratedPagesApiTemplatesCuratedPagesGet(): CancelablePromise<CuratedPagesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/templates/curated-pages',
        });
    }
    /**
     * Get Generation Templates
     * List template options for the business based on trade classification (via orchestration).
     * Optional generation_version_id marks the current selection.
     * @param generationVersionId
     * @returns GenerationTemplatesResponse Successful Response
     * @throws ApiError
     */
    public static getGenerationTemplatesApiTemplatesBrowseGet(
        generationVersionId?: (string | null),
    ): CancelablePromise<GenerationTemplatesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/templates/browse',
            query: {
                'generation_version_id': generationVersionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Template Status
     * Check if template has been compiled (lightweight check).
     *
     * Returns:
     * {
         * "compiled": bool,
         * "generation_status": str,
         * "section_count": int
         * }
         * @param generationVersionId
         * @returns any Successful Response
         * @throws ApiError
         */
        public static getTemplateStatusApiTemplatesGenerationVersionIdStatusGet(
            generationVersionId: string,
        ): CancelablePromise<any> {
            return __request(OpenAPI, {
                method: 'GET',
                url: '/api/templates/{generation_version_id}/status',
                path: {
                    'generation_version_id': generationVersionId,
                },
                errors: {
                    422: `Validation Error`,
                },
            });
        }
        /**
         * Get Compiled Template
         * Get compiled template JSON for Puck editor.
         *
         * Args:
         * generation_version_id: UUID of the generation
         * template_json_type: Type of template JSON ("real_population" = from DB, "ipsum_lorem" = compile)
         *
         * Returns:
         * TemplateBuildOutput (model_dump) - template JSON for editor
         * @param generationVersionId
         * @param templateJsonType Type of template JSON to use (e.g., 'real_population' or 'ipsum_lorem')
         * @returns TemplateWithPageInfo Successful Response
         * @throws ApiError
         */
        public static getCompiledTemplateApiTemplatesGenerationVersionIdGet(
            generationVersionId: string,
            templateJsonType?: (string | null),
        ): CancelablePromise<TemplateWithPageInfo> {
            return __request(OpenAPI, {
                method: 'GET',
                url: '/api/templates/{generation_version_id}',
                path: {
                    'generation_version_id': generationVersionId,
                },
                query: {
                    'template_json_type': templateJsonType,
                },
                errors: {
                    422: `Validation Error`,
                },
            });
        }
        /**
         * Save Template
         * Save template JSON updates for sections.
         *
         * Args:
         * generation_version_id: UUID of the generation
         * request: Section updates with template_json_for_compiler for each section,
         * optional section_order, and optional deleted_sections
         *
         * Returns:
         * Success response with updated section IDs, order status, and deleted sections
         * @param generationVersionId
         * @param requestBody
         * @returns any Successful Response
         * @throws ApiError
         */
        public static saveTemplateApiTemplatesGenerationVersionIdPut(
            generationVersionId: string,
            requestBody: SaveTemplateRequest,
        ): CancelablePromise<any> {
            return __request(OpenAPI, {
                method: 'PUT',
                url: '/api/templates/{generation_version_id}',
                path: {
                    'generation_version_id': generationVersionId,
                },
                body: requestBody,
                mediaType: 'application/json',
                errors: {
                    422: `Validation Error`,
                },
            });
        }
        /**
         * Get Catalog Categories
         * Get body-only section categories for Add Section.
         *
         * Returns L0 categories that have body sections (excludes header/footer categories).
         * @returns CategoryResponse Successful Response
         * @throws ApiError
         */
        public static getCatalogCategoriesApiTemplatesSectionsCatalogCategoriesGet(): CancelablePromise<Array<CategoryResponse>> {
            return __request(OpenAPI, {
                method: 'GET',
                url: '/api/templates/sections/catalog/categories',
            });
        }
        /**
         * Get Catalog Sections
         * Get body sections for Add Section.
         *
         * Returns sections that can be inserted into the body zone.
         * Optionally filtered by category_key.
         * @param categoryKey Filter body sections by category key
         * @returns SectionMetadataResponse Successful Response
         * @throws ApiError
         */
        public static getCatalogSectionsApiTemplatesSectionsCatalogGet(
            categoryKey?: (string | null),
        ): CancelablePromise<Array<SectionMetadataResponse>> {
            return __request(OpenAPI, {
                method: 'GET',
                url: '/api/templates/sections/catalog',
                query: {
                    'category_key': categoryKey,
                },
                errors: {
                    422: `Validation Error`,
                },
            });
        }
        /**
         * Get Catalog Header Sections
         * Get header sections for Replace Header.
         *
         * Returns sections that can be used as the page header (e.g. Navigation Bar).
         * @param categoryKey Filter header sections by category key
         * @returns SectionMetadataResponse Successful Response
         * @throws ApiError
         */
        public static getCatalogHeaderSectionsApiTemplatesSectionsCatalogHeaderGet(
            categoryKey?: (string | null),
        ): CancelablePromise<Array<SectionMetadataResponse>> {
            return __request(OpenAPI, {
                method: 'GET',
                url: '/api/templates/sections/catalog/header',
                query: {
                    'category_key': categoryKey,
                },
                errors: {
                    422: `Validation Error`,
                },
            });
        }
        /**
         * Get Catalog Footer Sections
         * Get footer sections for Replace Footer.
         *
         * Returns sections that can be used as the page footer.
         * @param categoryKey Filter footer sections by category key
         * @returns SectionMetadataResponse Successful Response
         * @throws ApiError
         */
        public static getCatalogFooterSectionsApiTemplatesSectionsCatalogFooterGet(
            categoryKey?: (string | null),
        ): CancelablePromise<Array<SectionMetadataResponse>> {
            return __request(OpenAPI, {
                method: 'GET',
                url: '/api/templates/sections/catalog/footer',
                query: {
                    'category_key': categoryKey,
                },
                errors: {
                    422: `Validation Error`,
                },
            });
        }
        /**
         * Get Section Template
         * Get compiled template JSON for a single section.
         *
         * Compiles a single section using ipsum_lorem (no autopopulation).
         *
         * Args:
         * section_id: The section ID to compile
         * template_json_type: Ignored - section templates use ipsum_lorem only
         *
         * Returns:
         * TemplateBuildOutput (model_dump) - template JSON for editor
         * @param sectionId
         * @param templateJsonType Type of template JSON (section templates support ipsum_lorem only)
         * @returns TemplateBuildOutput Successful Response
         * @throws ApiError
         */
        public static getSectionTemplateApiTemplatesSectionsSectionIdTemplateGet(
            sectionId: string,
            templateJsonType?: (string | null),
        ): CancelablePromise<TemplateBuildOutput> {
            return __request(OpenAPI, {
                method: 'GET',
                url: '/api/templates/sections/{section_id}/template',
                path: {
                    'section_id': sectionId,
                },
                query: {
                    'template_json_type': templateJsonType,
                },
                errors: {
                    422: `Validation Error`,
                },
            });
        }
        /**
         * Get Batch Section Templates
         * Get compiled template JSON for multiple sections.
         *
         * Compiles multiple sections in one call using ipsum_lorem.
         *
         * Args:
         * request: BatchSectionTemplateRequest containing section_ids list
         *
         * Returns:
         * TemplateBuildOutput (model_dump) - template JSON for editor
         * @param requestBody
         * @returns TemplateBuildOutput Successful Response
         * @throws ApiError
         */
        public static getBatchSectionTemplatesApiTemplatesSectionsCompileBatchPost(
            requestBody: BatchSectionTemplateRequest,
        ): CancelablePromise<TemplateBuildOutput> {
            return __request(OpenAPI, {
                method: 'POST',
                url: '/api/templates/sections/compile-batch',
                body: requestBody,
                mediaType: 'application/json',
                errors: {
                    422: `Validation Error`,
                },
            });
        }
    }
