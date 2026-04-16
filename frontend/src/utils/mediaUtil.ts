import { MediaItem } from '@/hooks/api/PageBuilder/Media/useMedia';
import { ShutterstockItem } from '@/types/media';

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getMediaUrl = (item: MediaItem, useThumbnail: boolean = false): string => {
  if (item.media_type === 'video') {
    return item.video?.sources?.[0]?.url || '';
  }
  
  // For images, use 0th variation (thumbnail) if requested and asset_path is available
  if (useThumbnail && item.image?.asset_path) {
    const assetPath = item.image.asset_path;
    // Construct 0th variation path: "org_id/images/uuid.png" -> "org_id/images/uuid_0.jpg"
    const lastDotIndex = assetPath.lastIndexOf('.');
    const pathWithoutExt = lastDotIndex !== -1 ? assetPath.substring(0, lastDotIndex) : assetPath;
    const variationPath = `${pathWithoutExt}_0.jpg`;
    
    // If src is an S3 URL, replace the asset_path part with variation path
    if (item.image.src) {
      const srcUrl = item.image.src;
      // Try to replace the asset_path in the URL with the variation path
      const assetPathIndex = srcUrl.indexOf(assetPath);
      if (assetPathIndex !== -1) {
        return srcUrl.substring(0, assetPathIndex) + variationPath;
      }
      // If asset_path not found in URL, construct from base URL
      // Extract base URL (everything before the filename)
      const lastSlashIndex = srcUrl.lastIndexOf('/');
      if (lastSlashIndex !== -1) {
        const baseUrl = srcUrl.substring(0, lastSlashIndex + 1);
        return baseUrl + variationPath;
      }
    }
  }
  
  return item.image?.src || '';
};

export const getFilename = (item: MediaItem): string => {
  if (item.media_type === 'video') {
    return item.video?.filename || 'video';
  }
  return item.image?.filename || 'image';
};

export const getAltText = (item: MediaItem): string => {
  if (item.media_type === 'video') {
    return item.video?.alt || item.video?.filename || 'video';
  }
  return item.image?.alt || item.image?.filename || 'image';
};

export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return parts[parts.length - 1].toUpperCase();
  }
  return 'Unknown';
};

export const formatMediaDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getMediaThumbnailUrl = (item: MediaItem): string => {
  if (item.media_type === 'image' && item.image?.src) {
    return item.image.src;
  }
  if (item.media_type === 'video' && item.video?.preview_image?.url) {
    return item.video.preview_image.url;
  }
  return '';
};

export const getShutterstockImageUrl = (item?: ShutterstockItem | null): string => {
  if (!item) return '';
  const assets = item.assets;
  return (
    assets?.preview_jpg?.url ||
    assets?.thumb_jpg?.url ||
    assets?.preview_600?.url ||
    assets?.preview?.url ||
    assets?.large_thumb?.url ||
    assets?.small_thumb?.url ||
    assets?.mosaic?.url ||
    ''
  );
};

export const getShutterstockVideoPreviewUrl = (item?: ShutterstockItem | null): string => {
  if (!item) return '';
  const assets = item.assets;
  return (
    assets?.preview_mp4?.url ||
    assets?.preview_webm?.url ||
    assets?.thumb_mp4?.url ||
    assets?.thumb_webm?.url ||
    ''
  );
};
