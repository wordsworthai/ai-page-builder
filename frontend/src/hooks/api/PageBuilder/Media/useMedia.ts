import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MediaService } from '@/client';
import { useSnackBarContext } from '@/context/SnackBarContext';

// Types based on backend response
export interface MediaItem {
  _id: string;
  business_id: string;
  source?: 'upload' | 'stock';
  media_type: 'image' | 'video';
  size: number;
  image?: {
    src: string;
    asset_path: string;
    filename: string;
    id?: string;
    width: number;
    height: number;
    aspect_ratio?: number;
    alt?: string;
  };
  video?: {
    asset_path: string;
    filename: string;
    preview_image: { 
      url: string; 
      width: number; 
      height: number 
    };
    sources: Array<{
      width: any;
      height: any; 
      url: string; 
      mime_type: string 
    }>;
    alt?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface MediaResponse {
  success: boolean;
  media: MediaItem[];
  total_count: number;
}

export const useMediaOverview = (businessId: string | null | undefined) => {
  return useQuery<MediaResponse>({
    queryKey: ['media-overview', businessId],
    queryFn: async () => {
      const response = await MediaService.getMediaOverviewApiMediaOverviewGet(businessId!);
      return response as MediaResponse;
    },
    enabled: !!businessId,
  });
};

export const useMediaDetails = (businessId: string | null | undefined) => {
  return useQuery<MediaResponse>({
    queryKey: ['media-details', businessId],
    queryFn: async () => {
      const response = await MediaService.getMediaDetailsApiMediaDetailsGet(businessId!);
      return response as MediaResponse;
    },
    enabled: !!businessId,
  });
};

export const useDeleteMedia = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: ({ mediaId, businessId }: { mediaId: string; businessId: string }) =>
      MediaService.deleteMediaApiMediaMediaIdDelete(mediaId, businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-details'] });
      queryClient.invalidateQueries({ queryKey: ['media-overview'] });
      createSnackBar({
        content: 'Media deleted successfully',
        severity: 'success',
        autoHide: true,
      });
    },
    onError: (error: Error) => {
      createSnackBar({
        content: error.message || 'Failed to delete media',
        severity: 'error',
        autoHide: true,
      });
    },
  });
};

export const useIngestStockImage = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: ({
      imageId,
      searchQuery,
      businessId,
    }: {
      imageId: string;
      searchQuery: string;
      businessId?: string | null;
    }) =>
      MediaService.ingestStockImageApiMediaIngestStockImageIdPost(imageId, {
        search_query: searchQuery,
        business_id: businessId ?? undefined,
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['media-details'] });
      queryClient.invalidateQueries({ queryKey: ['media-overview'] });
      createSnackBar({
        content: data?.message || 'Stock image ingested successfully',
        severity: 'success',
        autoHide: true,
      });
    },
    onError: (error: Error) => {
      createSnackBar({
        content: error.message || 'Failed to ingest stock image',
        severity: 'error',
        autoHide: true,
      });
    },
  });
};

export const useIngestStockVideo = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: ({
      videoId,
      searchQuery,
      businessId,
    }: {
      videoId: string;
      searchQuery: string;
      businessId?: string | null;
    }) =>
      MediaService.ingestStockVideoApiMediaIngestStockVideoVideoIdPost(videoId, {
        search_query: searchQuery,
        business_id: businessId ?? undefined,
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['media-details'] });
      queryClient.invalidateQueries({ queryKey: ['media-overview'] });
      createSnackBar({
        content: data?.message || 'Stock video ingested successfully',
        severity: 'success',
        autoHide: true,
      });
    },
    onError: (error: Error) => {
      createSnackBar({
        content: error.message || 'Failed to ingest stock video',
        severity: 'error',
        autoHide: true,
      });
    },
  });
};


export interface RecommendedMediaResponse extends MediaResponse {
  trades?: string[];
  message?: string;
}

export const useRecommendedMedia = (
  businessId: string | null | undefined,
  mediaType?: 'image' | 'video'
) => {
  return useQuery<RecommendedMediaResponse>({
    queryKey: ['media-recommended', businessId, mediaType],
    queryFn: async () => {
      const response = await MediaService.getRecommendedMediaApiMediaRecommendedGet(
        businessId!,
        mediaType,
      );
      return response as RecommendedMediaResponse;
    },
    enabled: !!businessId,
  });
};

export interface SlotRecommendationParams {
  elementId?: string;
  blockType?: string;
  blockIndex?: number;
  sectionId?: string;
  width: number;
  height: number;
  retrievalSources?: string[];
}

export const useSlotRecommendedMedia = (
  businessId: string | null | undefined,
  params: SlotRecommendationParams | null,
  mediaType?: 'image' | 'video'
) => {
  return useQuery<RecommendedMediaResponse>({
    queryKey: ['media-slot-recommended', businessId, params, mediaType],
    queryFn: async () => {
      if (!params) {
        throw new Error('Slot parameters required');
      }

      const response = await MediaService.getSlotRecommendedMediaApiMediaRecommendedSlotPost({
        element_id: params.elementId,
        block_type: params.blockType,
        block_index: params.blockIndex,
        section_id: params.sectionId,
        width: params.width,
        height: params.height,
        retrieval_sources: params.retrievalSources || (mediaType === 'video' ? ['stock', 'generated'] : ['generated', 'google_maps']),
        media_type: mediaType || 'image',
      });
      return response as RecommendedMediaResponse;
    },
    enabled: !!businessId && !!params,
  });
};

export interface BusinessImagesResponse {
  success: boolean;
  logo: MediaItem[];
  reviews: MediaItem[];
  google_photos: MediaItem[];
}

export const useBusinessImages = (businessId: string | null | undefined) => {
  return useQuery<BusinessImagesResponse>({
    queryKey: ['media-business-images', businessId],
    queryFn: async () => {
      const response = await MediaService.getBusinessImagesApiMediaBusinessImagesGet(businessId!);
      return response as BusinessImagesResponse;
    },
    enabled: !!businessId,
  });
};
