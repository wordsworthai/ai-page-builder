import type { FieldRenderProps } from "../types";
import { normalizeVideoPickerValue } from "../utils/normalizeVideoPickerValue";
import type { MediaItem } from "@/hooks/api/PageBuilder/Media/useMedia";
import { useIngestStockVideo } from "@/hooks/api/PageBuilder/Media/useMedia";
import { MediaPickerFieldBase } from "./MediaPickerFieldBase";
import { parseFieldName } from "../utils/fieldNameParser";
import { Box, Typography } from "@mui/material";
import { Videocam as VideocamIcon } from "@mui/icons-material";

type VideoPickerValue = {
  resolved_url: string;
  media: Record<string, unknown> & {
    alt: string;
    sources?: Array<{ url: string; mime_type?: string; format?: string; width?: number; height?: number }>;
    aspect_ratio?: number;
    id?: string;
    preview_image?: {
      url: string;
      width?: number;
      height?: number;
      alt?: string;
    };
  };
};

function buildVideoPickerValueFromMediaItem(mediaItem: MediaItem): VideoPickerValue | null {
  const video = mediaItem.video as (MediaItem["video"] & { id?: string; aspect_ratio?: number }) | undefined;
  if (!video?.sources || !Array.isArray(video.sources) || video.sources.length === 0) return null;

  const firstSource = video.sources[0];
  if (!firstSource?.url) return null;

  const aspectRatio =
    typeof video.aspect_ratio === "number"
      ? video.aspect_ratio
      : firstSource.width && firstSource.height
        ? firstSource.width / firstSource.height
        : undefined;

  return {
    resolved_url: video.preview_image?.url || firstSource.url,
    media: {
      ...video,
      alt: typeof video.alt === "string" ? video.alt : "",
      aspect_ratio: aspectRatio,
      id: typeof video.id === "string" ? video.id : undefined,
      sources: video.sources,
      preview_image: video.preview_image,
    },
  };
}

/**
 * Liquid video_picker:
 * Value may be an object, a legacy JSON string, or null.
 * We render it read-only in the RHS (Source + Alt text).
 * Clicking on the field highlights the corresponding element in the preview iframe.
 */
export function VideoPickerField({ field, name, value, onChange }: FieldRenderProps) {
  const labelText = field?.label || name;
  const label = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <VideocamIcon sx={{ fontSize: 18, color: "text.secondary" }} />
      <Typography component="span" variant="subtitle2">
        {labelText}
      </Typography>
    </Box>
  );
  const elementId = field?.elementId;
  const sectionId = field?.sectionId;
  // Parse field name to extract block information
  const parsed = parseFieldName(name);
  const blockType = field?.blockType || parsed.blockType || 'wwai_base_settings';
  const blockIndex = parsed.blockIndex;
  const { sourceUrl, altText } = normalizeVideoPickerValue(value);
  const { mutate: ingestStockVideo, isPending: isIngestingStockVideo } = useIngestStockVideo();

  // Extract width/height from current value for slot recommendations
  const currentVideo = value && typeof value === 'object' && 'media' in value 
    ? (value as any).media 
    : null;
  const firstSource = currentVideo?.sources && Array.isArray(currentVideo.sources) && currentVideo.sources.length > 0
    ? currentVideo.sources[0]
    : null;
  const width = firstSource?.width || 1920; // Default video dimensions
  const height = firstSource?.height || 1080;

  const handleIngestStockVideo = (params: {
    id: string;
    businessId: string;
    searchQuery: string;
    onSuccess: (data: any) => void;
  }) => {
    ingestStockVideo(
      {
        videoId: params.id,
        businessId: params.businessId,
        searchQuery: params.searchQuery,
      },
      {
        onSuccess: params.onSuccess,
      }
    );
  };

  // Build slot info if we have element identifiers
  const slotInfo = elementId ? {
    elementId,
    sectionId,
    blockType,
    blockIndex,
    width,
    height,
  } : undefined;

  return (
    <MediaPickerFieldBase
      label={label}
      sourceUrl={sourceUrl}
      altText={altText}
      onChange={onChange}
      mediaType="video"
      changeButtonLabel="Change video"
      buildValueFromMediaItem={buildVideoPickerValueFromMediaItem}
      ingestStockMedia={handleIngestStockVideo}
      isIngestingStockMedia={isIngestingStockVideo}
      stockIngestError="Search query is required to ingest this stock video"
      elementId={elementId}
      sectionId={sectionId}
      blockType={blockType}
      blockIndex={blockIndex}
      slotInfo={slotInfo}
    />
  );
}

