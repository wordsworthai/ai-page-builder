/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BatchPollResponse } from '../models/BatchPollResponse';
import type { BatchProcessResponse } from '../models/BatchProcessResponse';
import type { BatchStatusResponse } from '../models/BatchStatusResponse';
import type { BatchSubmitRequest } from '../models/BatchSubmitRequest';
import type { BatchSubmitResponse } from '../models/BatchSubmitResponse';
import type { Body_postprocess_variations_multiple_api_media_admin_postprocess_variations_multiple_post } from '../models/Body_postprocess_variations_multiple_api_media_admin_postprocess_variations_multiple_post';
import type { Body_process_batches_multiple_api_media_admin_batch_process_multiple_post } from '../models/Body_process_batches_multiple_api_media_admin_batch_process_multiple_post';
import type { Body_submit_batches_multiple_api_media_admin_batch_submit_multiple_post } from '../models/Body_submit_batches_multiple_api_media_admin_batch_submit_multiple_post';
import type { Body_upload_media_api_media_upload_post } from '../models/Body_upload_media_api_media_upload_post';
import type { BulkIngestStockRequest } from '../models/BulkIngestStockRequest';
import type { GenerateAndIngestRequest } from '../models/GenerateAndIngestRequest';
import type { GenerateAndIngestResponse } from '../models/GenerateAndIngestResponse';
import type { IngestStockRequest } from '../models/IngestStockRequest';
import type { PostprocessRequest } from '../models/PostprocessRequest';
import type { PostprocessResponse } from '../models/PostprocessResponse';
import type { PostprocessStatusResponse } from '../models/PostprocessStatusResponse';
import type { SlotMediaMatchRequest } from '../models/SlotMediaMatchRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MediaService {
    /**
     * Upload media file
     * Upload an image or video file to the media library.
     *
     * **Supported file types:**
     * - Images: JPEG, PNG, GIF, WebP, SVG, BMP, TIFF (max 20MB)
     * - Videos: MP4, WebM, MOV, AVI, MKV, MPEG, OGG (max 100MB)
     *
     * **Features:**
     * - Automatic MIME type detection using magic bytes
     * - Image dimension extraction
     * - Video metadata extraction (dimensions, duration)
     * - Automatic video thumbnail generation
     * - Files are stored in S3
     * @param formData
     * @returns any Successful Response
     * @throws ApiError
     */
    public static uploadMediaApiMediaUploadPost(
        formData: Body_upload_media_api_media_upload_post,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/media/upload',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Validation error`,
                422: `Validation Error`,
                500: `Server error`,
            },
        });
    }
    /**
     * Get media overview
     * Returns recent 6 media thumbnails/references for a business.
     * @param businessId Business ID
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getMediaOverviewApiMediaOverviewGet(
        businessId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/media/overview',
            query: {
                'business_id': businessId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get media details
     * Returns all media assets with metadata for a business.
     * @param businessId Business ID
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getMediaDetailsApiMediaDetailsGet(
        businessId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/media/details',
            query: {
                'business_id': businessId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Ingest stock image from Shutterstock
     * Fetch Shutterstock image details, upload preview to S3, and store media document.
     * @param imageId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static ingestStockImageApiMediaIngestStockImageIdPost(
        imageId: string,
        requestBody: IngestStockRequest,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/media/ingest-stock/{image_id}',
            path: {
                'image_id': imageId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Ingest stock video from Shutterstock
     * Fetch Shutterstock video details, upload preview to S3, and store media document.
     * @param videoId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static ingestStockVideoApiMediaIngestStockVideoVideoIdPost(
        videoId: string,
        requestBody: IngestStockRequest,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/media/ingest-stock-video/{video_id}',
            path: {
                'video_id': videoId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete media
     * Permanently delete a media file (uploaded or stock) from S3 storage and MongoDB.
     * @param mediaId
     * @param businessId Business ID (for authorization)
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteMediaApiMediaMediaIdDelete(
        mediaId: string,
        businessId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/media/{media_id}',
            path: {
                'media_id': mediaId,
            },
            query: {
                'business_id': businessId,
            },
            errors: {
                400: `Invalid media ID format`,
                404: `Media not found`,
                422: `Validation Error`,
                500: `Server error`,
            },
        });
    }
    /**
     * Bulk ingest stock media by query
     * Admin endpoint for bulk ingesting stock media (images or videos).
     *
     * **Use case:** Populate stock media database for specific trades.
     *
     * **Process:**
     * 1. Searches Shutterstock with provided query
     * 2. Takes top N results (15 for images, 5 for videos recommended)
     * 3. Ingests each result with trade_type metadata
     * 4. Stores in media_management.media collection
     *
     * **Example:**
     * ```json
     * {
         * "query": "professional plumber fixing pipe",
         * "trade_type": "plumbing",
         * "media_type": "image",
         * "limit": 15
         * }
         * ```
         * @param requestBody
         * @returns any Successful Response
         * @throws ApiError
         */
        public static bulkIngestStockMediaApiMediaAdminBulkIngestStockPost(
            requestBody: BulkIngestStockRequest,
        ): CancelablePromise<Record<string, any>> {
            return __request(OpenAPI, {
                method: 'POST',
                url: '/api/media/admin/bulk-ingest-stock',
                body: requestBody,
                mediaType: 'application/json',
                errors: {
                    422: `Validation Error`,
                },
            });
        }
        /**
         * Generate AI images and ingest to S3/MongoDB
         * Generate images using Gemini API and automatically ingest them.
         *
         * **API Modes:**
         *
         * - **Batch API** (`use_realtime=false`, default): Higher rate limits, up to 24hr turnaround.
         * ⚠️ Does NOT support `aspect_ratio` or `image_size` - generates 1024x1024 images.
         * Best for: High-volume generation where dimensions don't matter.
         *
         * - **Real-time API** (`use_realtime=true`): Immediate generation with full control.
         * ✅ Supports `aspect_ratio` ("1:1", "16:9", "4:3", etc.) and `image_size` ("1K", "2K", "4K").
         * Best for: When specific image dimensions are required.
         *
         * **Process:**
         * 1. Submit prompts to Gemini (batch or real-time based on flag)
         * 2. For batch: Poll until generation complete (~10-30 min)
         * 3. Download/receive generated images
         * 4. Upload each to S3
         * 5. Insert documents to MongoDB
         *
         * **Example - Real-time API (with aspect ratio):**
         * ```json
         * {
             * "prompts": ["A plumber fixing a copper pipe", "HVAC technician installing AC unit"],
             * "trade_type": "plumbing",
             * "org_id": "0a640051-51f7-4684-a254-f73d4fb4da03",
             * "aspect_ratio": "16:9",
             * "image_size": "2K",
             * "use_realtime": true
             * }
             * ```
             *
             * **Example - Batch API (high volume):**
             * ```json
             * {
                 * "prompts": ["prompt1", "prompt2", "...50 more prompts..."],
                 * "trade_type": "hvac",
                 * "org_id": "0a640051-51f7-4684-a254-f73d4fb4da03",
                 * "use_realtime": false
                 * }
                 * ```
                 * @param requestBody
                 * @returns GenerateAndIngestResponse Successful Response
                 * @throws ApiError
                 */
                public static generateAndIngestImagesApiMediaAdminGenerateAndIngestPost(
                    requestBody: GenerateAndIngestRequest,
                ): CancelablePromise<GenerateAndIngestResponse> {
                    return __request(OpenAPI, {
                        method: 'POST',
                        url: '/api/media/admin/generate-and-ingest',
                        body: requestBody,
                        mediaType: 'application/json',
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
                /**
                 * Check Gemini batch job status
                 * Get the current status of a Gemini batch generation job
                 * @param batchName
                 * @returns BatchStatusResponse Successful Response
                 * @throws ApiError
                 */
                public static getBatchStatusApiMediaAdminBatchStatusBatchNameGet(
                    batchName: string,
                ): CancelablePromise<BatchStatusResponse> {
                    return __request(OpenAPI, {
                        method: 'GET',
                        url: '/api/media/admin/batch-status/{batch_name}',
                        path: {
                            'batch_name': batchName,
                        },
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
                /**
                 * Submit batches for a trade (Phase 1)
                 * Submit batch jobs for AI image generation. This is idempotent - if batches
                 * are already submitted, it returns the existing batch info without resubmitting.
                 *
                 * **Process:**
                 * 1. Checks trade status in MongoDB
                 * 2. If status='ready', distributes prompts by aspect ratio and submits batches
                 * 3. If status='batches_submitted', returns existing batch info (no resubmit)
                 * 4. Stores batch_job_names in MongoDB for tracking
                 *
                 * **Idempotent:** Safe to call multiple times. Won't charge twice.
                 * @param requestBody
                 * @returns BatchSubmitResponse Successful Response
                 * @throws ApiError
                 */
                public static submitBatchesApiMediaAdminBatchSubmitPost(
                    requestBody: BatchSubmitRequest,
                ): CancelablePromise<BatchSubmitResponse> {
                    return __request(OpenAPI, {
                        method: 'POST',
                        url: '/api/media/admin/batch-submit',
                        body: requestBody,
                        mediaType: 'application/json',
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
                /**
                 * Submit batches for multiple trades
                 * Submit batch jobs for multiple trades at once. Each trade is processed
                 * independently and idempotently.
                 * @param requestBody
                 * @returns BatchSubmitResponse Successful Response
                 * @throws ApiError
                 */
                public static submitBatchesMultipleApiMediaAdminBatchSubmitMultiplePost(
                    requestBody: Body_submit_batches_multiple_api_media_admin_batch_submit_multiple_post,
                ): CancelablePromise<Array<BatchSubmitResponse>> {
                    return __request(OpenAPI, {
                        method: 'POST',
                        url: '/api/media/admin/batch-submit-multiple',
                        body: requestBody,
                        mediaType: 'application/json',
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
                /**
                 * Poll batch status for a trade (Phase 2)
                 * Check the status of all batches for a trade. Updates MongoDB with current
                 * Gemini status.
                 *
                 * **Returns:**
                 * - Counts of pending, succeeded, failed, processed batches
                 * - Whether all batches are complete
                 * @param tradeType
                 * @returns BatchStatusResponse Successful Response
                 * @throws ApiError
                 */
                public static pollBatchStatusApiMediaAdminBatchPollTradeTypeGet(
                    tradeType: string,
                ): CancelablePromise<BatchStatusResponse> {
                    return __request(OpenAPI, {
                        method: 'GET',
                        url: '/api/media/admin/batch-poll/{trade_type}',
                        path: {
                            'trade_type': tradeType,
                        },
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
                /**
                 * Poll batch status for multiple trades
                 * Check the status of batches for multiple trades at once.
                 *
                 * **Returns:**
                 * - Overall summary (trades complete vs pending)
                 * - Details for each trade
                 * @param requestBody
                 * @returns BatchPollResponse Successful Response
                 * @throws ApiError
                 */
                public static pollBatchStatusMultipleApiMediaAdminBatchPollMultiplePost(
                    requestBody: Array<string>,
                ): CancelablePromise<BatchPollResponse> {
                    return __request(OpenAPI, {
                        method: 'POST',
                        url: '/api/media/admin/batch-poll-multiple',
                        body: requestBody,
                        mediaType: 'application/json',
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
                /**
                 * Process completed batches for a trade (Phase 3)
                 * Download completed batches from Gemini and ingest to S3/MongoDB.
                 *
                 * **Process:**
                 * 1. Downloads images from each succeeded batch
                 * 2. Uploads to S3
                 * 3. Creates documents in media_management.media collection
                 * 4. Updates trade status to 'generated' when all done
                 *
                 * **Idempotent:** Won't reprocess already processed batches.
                 * @param tradeType
                 * @param orgId Organization ID for S3 path
                 * @returns BatchProcessResponse Successful Response
                 * @throws ApiError
                 */
                public static processBatchesApiMediaAdminBatchProcessTradeTypePost(
                    tradeType: string,
                    orgId: string,
                ): CancelablePromise<BatchProcessResponse> {
                    return __request(OpenAPI, {
                        method: 'POST',
                        url: '/api/media/admin/batch-process/{trade_type}',
                        path: {
                            'trade_type': tradeType,
                        },
                        query: {
                            'org_id': orgId,
                        },
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
                /**
                 * Process completed batches for multiple trades
                 * Process completed batches for multiple trades at once.
                 * @param requestBody
                 * @returns BatchProcessResponse Successful Response
                 * @throws ApiError
                 */
                public static processBatchesMultipleApiMediaAdminBatchProcessMultiplePost(
                    requestBody: Body_process_batches_multiple_api_media_admin_batch_process_multiple_post,
                ): CancelablePromise<Array<BatchProcessResponse>> {
                    return __request(OpenAPI, {
                        method: 'POST',
                        url: '/api/media/admin/batch-process-multiple',
                        body: requestBody,
                        mediaType: 'application/json',
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
                /**
                 * Get overview of all trade batch statuses
                 * Returns a summary of batch status for all trades in the system.
                 * @returns any Successful Response
                 * @throws ApiError
                 */
                public static getBatchOverviewApiMediaAdminBatchOverviewGet(): CancelablePromise<any> {
                    return __request(OpenAPI, {
                        method: 'GET',
                        url: '/api/media/admin/batch-overview',
                    });
                }
                /**
                 * Reset a trade back to 'ready' status (USE WITH CAUTION)
                 * Reset a trade back to 'ready' status. This will NOT refund any Gemini charges.
                 * Use only if you need to resubmit batches for some reason.
                 *
                 * **WARNING:** This does not delete batch jobs from Gemini. You will be charged
                 * again if you resubmit.
                 * @param tradeType
                 * @param confirm Type 'RESET' to confirm
                 * @returns any Successful Response
                 * @throws ApiError
                 */
                public static resetTradeStatusApiMediaAdminBatchResetTradeTypePost(
                    tradeType: string,
                    confirm: string,
                ): CancelablePromise<any> {
                    return __request(OpenAPI, {
                        method: 'POST',
                        url: '/api/media/admin/batch-reset/{trade_type}',
                        path: {
                            'trade_type': tradeType,
                        },
                        query: {
                            'confirm': confirm,
                        },
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
                /**
                 * Get recommended media for business
                 * Returns AI-generated media recommended for the business based on their assigned trades.
                 *
                 * **Flow:**
                 * 1. Looks up business trades from business_type collection
                 * 2. Queries media with matching trade_type and source="generated"
                 * 3. Returns sorted by newest first
                 *
                 * **Use case:** Populate "Recommended" tab in media management UI.
                 * @param businessId Business ID
                 * @param mediaType Filter by media type: 'image', 'video', or None for all
                 * @param maxResults Maximum number of results
                 * @returns any Successful Response
                 * @throws ApiError
                 */
                public static getRecommendedMediaApiMediaRecommendedGet(
                    businessId: string,
                    mediaType?: (string | null),
                    maxResults: number = 50,
                ): CancelablePromise<Record<string, any>> {
                    return __request(OpenAPI, {
                        method: 'GET',
                        url: '/api/media/recommended',
                        query: {
                            'business_id': businessId,
                            'media_type': mediaType,
                            'max_results': maxResults,
                        },
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
                /**
                 * Get business images (logo, reviews, Google Photos)
                 * Returns business images from three sources:
                 * - Logo images (from LogoProvider)
                 * - Review photos (from ReviewPhotosProvider)
                 * - Google Photos (from BusinessPhotosProvider)
                 *
                 * **Flow:**
                 * 1. Fetches logo images based on business trades
                 * 2. Fetches review photos from Yelp data
                 * 3. Fetches Google Maps business photos
                 * 4. Returns all three categories in structured format
                 *
                 * **Use case:** Populate "Business Images" tab in media management UI.
                 * @param businessId Business ID
                 * @returns any Successful Response
                 * @throws ApiError
                 */
                public static getBusinessImagesApiMediaBusinessImagesGet(
                    businessId: string,
                ): CancelablePromise<Record<string, any>> {
                    return __request(OpenAPI, {
                        method: 'GET',
                        url: '/api/media/business-images',
                        query: {
                            'business_id': businessId,
                        },
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
                /**
                 * Get slot-specific recommended media
                 * Returns slot-specific media recommendations using element_id, block_type, block_index, and section_id.
                 *
                 * Uses the same media matching service as the autopopulation workflow to find images or videos
                 * that match the slot's dimensions and context.
                 *
                 * **Flow:**
                 * 1. Creates MediaSlot with slot identity (element_id, block_type, block_index, section_id)
                 * 2. Calls media_service.match_images() or media_service.match_videos() based on media_type
                 * 3. Returns matched media in MediaItem format
                 *
                 * **Use case:** Show slot-specific recommendations in the "Recommended" tab when
                 * opening media picker from a field in the editor.
                 *
                 * **Retrieval sources:**
                 * - For images: defaults to ["generated", "google_maps"]
                 * - For videos: defaults to ["stock", "generated"] (videos don't come from google_maps)
                 * @param requestBody
                 * @returns any Successful Response
                 * @throws ApiError
                 */
                public static getSlotRecommendedMediaApiMediaRecommendedSlotPost(
                    requestBody: SlotMediaMatchRequest,
                ): CancelablePromise<Record<string, any>> {
                    return __request(OpenAPI, {
                        method: 'POST',
                        url: '/api/media/recommended/slot',
                        body: requestBody,
                        mediaType: 'application/json',
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
                /**
                 * Create image variations for a trade (Phase 4)
                 * Post-process generated images to create downscaled JPEG variations.
                 *
                 * **Creates 4 variations per image (+ keeps original):**
                 * - `0`: 300px max dimension - tiny thumbnails, icons
                 * - `1`: 500px max dimension - small cards
                 * - `2`: 1000px max dimension - medium displays
                 * - `3`: 1500px max dimension - large displays, 1440px slots
                 *
                 * **Aspect ratio is preserved.** Max dimension = the larger side.
                 *
                 * **Idempotent:** Skips images that already have variations.
                 * Call repeatedly until `remaining=0`.
                 *
                 * **Example workflow:**
                 * ```python
                 * while True:
                 * result = post("/admin/postprocess-variations", {"trade_type": "plumbing", "batch_size": 50})
                 * print(f"Processed: {result['processed']}, Remaining: {result['remaining']}")
                 * if result['remaining'] == 0:
                 * break
                 * ```
                 * @param requestBody
                 * @returns PostprocessResponse Successful Response
                 * @throws ApiError
                 */
                public static postprocessVariationsApiMediaAdminPostprocessVariationsPost(
                    requestBody: PostprocessRequest,
                ): CancelablePromise<PostprocessResponse> {
                    return __request(OpenAPI, {
                        method: 'POST',
                        url: '/api/media/admin/postprocess-variations',
                        body: requestBody,
                        mediaType: 'application/json',
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
                /**
                 * Create image variations for multiple trades
                 * Post-process variations for multiple trades in one call.
                 *
                 * Each trade processes up to `batch_size` images.
                 * Run repeatedly until all trades have `remaining=0`.
                 * @param requestBody
                 * @returns PostprocessResponse Successful Response
                 * @throws ApiError
                 */
                public static postprocessVariationsMultipleApiMediaAdminPostprocessVariationsMultiplePost(
                    requestBody: Body_postprocess_variations_multiple_api_media_admin_postprocess_variations_multiple_post,
                ): CancelablePromise<Array<PostprocessResponse>> {
                    return __request(OpenAPI, {
                        method: 'POST',
                        url: '/api/media/admin/postprocess-variations-multiple',
                        body: requestBody,
                        mediaType: 'application/json',
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
                /**
                 * Check post-processing status
                 * Get status of variation post-processing.
                 *
                 * **Single trade:** Pass `trade_type` query param for detailed status.
                 *
                 * **All trades:** Omit `trade_type` to get overview of all generated trades.
                 *
                 * **Statuses:**
                 * - `pending`: Not started
                 * - `processing`: In progress
                 * - `complete`: All images have variations
                 * @param tradeType Specific trade to check (omit for all)
                 * @returns PostprocessStatusResponse Successful Response
                 * @throws ApiError
                 */
                public static getPostprocessStatusApiMediaAdminPostprocessStatusGet(
                    tradeType?: (string | null),
                ): CancelablePromise<PostprocessStatusResponse> {
                    return __request(OpenAPI, {
                        method: 'GET',
                        url: '/api/media/admin/postprocess-status',
                        query: {
                            'trade_type': tradeType,
                        },
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
            }
