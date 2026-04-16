/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CategoryResponse } from '../models/CategoryResponse';
import type { SectionMetadataResponse } from '../models/SectionMetadataResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SectionCatalogService {
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
}
