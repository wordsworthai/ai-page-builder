import type { FieldRenderProps } from "../types";
import { normalizeImagePickerValue } from "../utils/normalizeImagePickerValue";
import type { MediaItem } from "@/hooks/api/PageBuilder/Media/useMedia";
import { useIngestStockImage } from "@/hooks/api/PageBuilder/Media/useMedia";
import { MediaPickerFieldBase } from "./MediaPickerFieldBase";
import { parseFieldName } from "../utils/fieldNameParser";
import { Box, Typography } from "@mui/material";
import { Image as ImageIcon } from "@mui/icons-material";

type ImagePickerValue = {
  resolved_url: string;
  media: Record<string, unknown> & {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    aspect_ratio?: number;
    id?: string;
  };
};

function buildImagePickerValueFromMediaItem(mediaItem: MediaItem): ImagePickerValue | null {
  const img = mediaItem.image as (MediaItem["image"] & { id?: string; aspect_ratio?: number }) | undefined;
  if (!img?.src) return null;

  const width = typeof img.width === "number" ? img.width : undefined;
  const height = typeof img.height === "number" ? img.height : undefined;
  const aspectRatio =
    typeof img.aspect_ratio === "number"
      ? img.aspect_ratio
      : width && height
        ? width / height
        : undefined;

  return {
    resolved_url: img.src,
    media: {
      ...img,
      alt: typeof img.alt === "string" ? img.alt : "",
      aspect_ratio: aspectRatio,
      id: typeof img.id === "string" ? img.id : undefined,
    },
  };
}

/**
 * Liquid image_picker:
 * Value may be an object, a legacy JSON string, or null.
 * We render it read-only in the RHS (Source + Alt text).
 * Clicking on the field highlights the corresponding element in the preview iframe.
 */
export function ImagePickerField({ field, name, value, onChange }: FieldRenderProps) {
  const labelText = field?.label || name;
  const label = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <ImageIcon sx={{ fontSize: 18, color: "text.secondary" }} />
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
  const { sourceUrl, altText } = normalizeImagePickerValue(value);
  const { mutate: ingestStockImage, isPending: isIngestingStockImage } = useIngestStockImage();
  
  // Extract width/height from current value for slot recommendations
  const currentImage = value && typeof value === 'object' && 'media' in value 
    ? (value as any).media 
    : null;
  const width = currentImage?.width || 1300; // Default dimensions
  const height = currentImage?.height || 1002;

  const handleIngestStockImage = (params: {
    id: string;
    businessId: string;
    searchQuery: string;
    onSuccess: (data: any) => void;
  }) => {
    ingestStockImage(
      {
        imageId: params.id,
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
      mediaType="image"
      changeButtonLabel="Change image"
      buildValueFromMediaItem={buildImagePickerValueFromMediaItem}
      ingestStockMedia={handleIngestStockImage}
      isIngestingStockMedia={isIngestingStockImage}
      stockIngestError="Search query is required to ingest this stock image"
      elementId={elementId}
      sectionId={sectionId}
      blockType={blockType}
      blockIndex={blockIndex}
      slotInfo={slotInfo}
    />
  );
}

