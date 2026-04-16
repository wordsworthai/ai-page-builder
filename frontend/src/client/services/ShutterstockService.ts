/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ShutterstockService {
    /**
     * Search Images
     * Search for images on Shutterstock.
     * Requires authentication. Proxies request to Shutterstock API with comprehensive filter support.
     * @param query Search keywords
     * @param page Page number
     * @param perPage Results per page
     * @param addedDate Show images added on date (YYYY-MM-DD)
     * @param addedDateEnd Show images added before date (YYYY-MM-DD)
     * @param addedDateStart Show images added on/after date (YYYY-MM-DD)
     * @param aspectRatio Show images with aspect ratio
     * @param aspectRatioMax Show images with aspect ratio or lower
     * @param aspectRatioMin Show images with aspect ratio or higher
     * @param category Shutterstock category name or ID
     * @param color Hex color (4F21EA) or 'grayscale'
     * @param contributor Contributor names or IDs
     * @param contributorCountry Country codes (ISO 3166 Alpha-2)
     * @param fields Fields to display in response
     * @param heightFrom Minimum height in pixels
     * @param heightTo Maximum height in pixels
     * @param imageType Image types: photo, illustration, vector
     * @param keywordSafeSearch Hide unsafe keywords
     * @param language Query and result language
     * @param library Libraries: shutterstock, offset
     * @param license License types: commercial, editorial, enhanced
     * @param model Model IDs
     * @param orientation Orientation: horizontal, vertical
     * @param peopleAge Age: infants, children, teenagers, 20s, 30s, 40s, 50s, 60s, older
     * @param peopleEthnicity Ethnicities or NOT filters
     * @param peopleGender Gender: male, female, both
     * @param peopleModelReleased Signed model release
     * @param peopleNumber Number of people (max: 4)
     * @param region Country code or IP for relevance
     * @param safe Enable safe search
     * @param sort Sort: newest, popular, relevance, random, oldest
     * @param spellcheckQuery Spellcheck and suggest spellings
     * @param view Detail level: minimal, full
     * @param widthFrom Minimum width in pixels
     * @param widthTo Maximum width in pixels
     * @returns any Successful Response
     * @throws ApiError
     */
    public static searchImagesApiShutterstockImagesSearchGet(
        query: string,
        page: number = 1,
        perPage: number = 20,
        addedDate?: (string | null),
        addedDateEnd?: (string | null),
        addedDateStart?: (string | null),
        aspectRatio?: (number | null),
        aspectRatioMax?: (number | null),
        aspectRatioMin?: (number | null),
        category?: (string | null),
        color?: (string | null),
        contributor?: (Array<string> | null),
        contributorCountry?: (Array<string> | null),
        fields?: (string | null),
        heightFrom?: (number | null),
        heightTo?: (number | null),
        imageType?: (Array<string> | null),
        keywordSafeSearch: boolean = true,
        language?: (string | null),
        library?: (Array<string> | null),
        license?: (Array<string> | null),
        model?: (Array<string> | null),
        orientation?: (string | null),
        peopleAge?: (string | null),
        peopleEthnicity?: (Array<string> | null),
        peopleGender?: (string | null),
        peopleModelReleased?: (boolean | null),
        peopleNumber?: (number | null),
        region?: (string | null),
        safe: boolean = true,
        sort: string = 'popular',
        spellcheckQuery: boolean = true,
        view: string = 'minimal',
        widthFrom?: (number | null),
        widthTo?: (number | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/shutterstock/images/search',
            query: {
                'query': query,
                'page': page,
                'per_page': perPage,
                'added_date': addedDate,
                'added_date_end': addedDateEnd,
                'added_date_start': addedDateStart,
                'aspect_ratio': aspectRatio,
                'aspect_ratio_max': aspectRatioMax,
                'aspect_ratio_min': aspectRatioMin,
                'category': category,
                'color': color,
                'contributor': contributor,
                'contributor_country': contributorCountry,
                'fields': fields,
                'height_from': heightFrom,
                'height_to': heightTo,
                'image_type': imageType,
                'keyword_safe_search': keywordSafeSearch,
                'language': language,
                'library': library,
                'license': license,
                'model': model,
                'orientation': orientation,
                'people_age': peopleAge,
                'people_ethnicity': peopleEthnicity,
                'people_gender': peopleGender,
                'people_model_released': peopleModelReleased,
                'people_number': peopleNumber,
                'region': region,
                'safe': safe,
                'sort': sort,
                'spellcheck_query': spellcheckQuery,
                'view': view,
                'width_from': widthFrom,
                'width_to': widthTo,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Image Details
     * Get detailed information about a specific image.
     * Requires authentication. Returns full image details including preview URLs and metadata.
     * @param imageId
     * @param language Language for keywords and categories
     * @param view Detail level: minimal, full
     * @param searchId Related search ID
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getImageDetailsApiShutterstockImagesImageIdGet(
        imageId: string,
        language?: (string | null),
        view: string = 'full',
        searchId?: (string | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/shutterstock/images/{image_id}',
            path: {
                'image_id': imageId,
            },
            query: {
                'language': language,
                'view': view,
                'search_id': searchId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Search Videos
     * Search for videos on Shutterstock.
     * @param query Search keywords
     * @param page Page number
     * @param perPage Results per page
     * @param durationFrom Minimum duration (seconds)
     * @param durationTo Maximum duration (seconds)
     * @param fps Frames per second
     * @param resolution Resolution: SD, HD, 4K
     * @param codec Codec: h264, prores
     * @param aspectRatio Aspect ratio: 16:9, 9:16
     * @param safe Enable safe search
     * @param sort Sort: newest, popular, relevance, random
     * @param view Detail level: minimal, full
     * @returns any Successful Response
     * @throws ApiError
     */
    public static searchVideosApiShutterstockVideosSearchGet(
        query: string,
        page: number = 1,
        perPage: number = 20,
        durationFrom?: (number | null),
        durationTo?: (number | null),
        fps?: (number | null),
        resolution?: (string | null),
        codec?: (string | null),
        aspectRatio?: (string | null),
        safe: boolean = true,
        sort: string = 'popular',
        view: string = 'minimal',
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/shutterstock/videos/search',
            query: {
                'query': query,
                'page': page,
                'per_page': perPage,
                'duration_from': durationFrom,
                'duration_to': durationTo,
                'fps': fps,
                'resolution': resolution,
                'codec': codec,
                'aspect_ratio': aspectRatio,
                'safe': safe,
                'sort': sort,
                'view': view,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Video Details
     * Get detailed information about a specific video.
     * @param videoId
     * @param view Detail level: minimal, full
     * @param searchId Related search ID
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getVideoDetailsApiShutterstockVideosVideoIdGet(
        videoId: string,
        view: string = 'full',
        searchId?: (string | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/shutterstock/videos/{video_id}',
            path: {
                'video_id': videoId,
            },
            query: {
                'view': view,
                'search_id': searchId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
