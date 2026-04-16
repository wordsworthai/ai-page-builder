import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { MediaItem } from '@/hooks/api/PageBuilder/Media/useMedia';
import { formatFileSize, getAltText, getFilename, getMediaUrl } from '@/utils/mediaUtil';

type ObjectFit = 'cover' | 'contain';

export interface MediaItemsGridProps {
  items: MediaItem[];
  isSelected?: (item: MediaItem, index: number) => boolean;
  onSelect?: (item: MediaItem, index: number) => void;
  showName?: boolean;
  showSize?: boolean;
  objectFit?: ObjectFit;
  useThumbnail?: boolean;
  fallbackToOriginalOnThumbnailError?: boolean;
}

interface VideoThumbnailProps {
  item: MediaItem;
  isActive: boolean;
  objectFit: ObjectFit;
}

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ item, isActive, objectFit }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = item.video?.sources?.[0]?.url || '';

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked by browser
      });
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive]);

  return (
    <video
      ref={videoRef}
      src={videoUrl}
      style={{
        width: '100%',
        height: '100%',
        objectFit,
      }}
      controls
      playsInline
      muted={!isActive}
    />
  );
};

const MediaItemsGrid: React.FC<MediaItemsGridProps> = ({
  items,
  isSelected,
  onSelect,
  showName = true,
  showSize = true,
  objectFit = 'contain',
  useThumbnail = false,
  fallbackToOriginalOnThumbnailError = false,
}) => {
  const [failedThumbnailIds, setFailedThumbnailIds] = useState<Set<string>>(new Set());

  const handleThumbnailError = useCallback((itemId: string) => {
    setFailedThumbnailIds((prev) => {
      if (prev.has(itemId)) return prev;
      return new Set(prev).add(itemId);
    });
  }, []);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 2,
        padding: 2,
      }}
    >
      {items.map((item, index) => {
        const selected = isSelected?.(item, index) ?? false;
        const key = item._id || index;
        const filename = getFilename(item);
        const sizeLabel = formatFileSize(item.size);
        const thumbnailFailed =
          fallbackToOriginalOnThumbnailError && useThumbnail && failedThumbnailIds.has(item._id);
        const imageUrl =
          useThumbnail && !thumbnailFailed
            ? getMediaUrl(item, true)
            : getMediaUrl(item, false);

        return (
          <Box
            key={key}
            onClick={() => onSelect?.(item, index)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              cursor: onSelect ? 'pointer' : 'default',
            }}
          >
            <Box
              sx={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: 2,
                overflow: 'hidden',
                border: selected ? '2px solid' : '1px solid',
                borderColor: selected ? 'primary.main' : 'divider',
                '&:hover': {
                  boxShadow: onSelect ? 2 : undefined,
                  borderColor: selected ? 'primary.main' : 'primary.light',
                },
                backgroundColor: '#f5f5f5',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              {item.media_type === 'video' ? (
                <VideoThumbnail item={item} isActive={selected} objectFit={objectFit} />
              ) : (
                <img
                  src={imageUrl}
                  alt={getAltText(item)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit,
                  }}
                  onError={() => {
                    if (fallbackToOriginalOnThumbnailError && useThumbnail) {
                      handleThumbnailError(item._id);
                    }
                  }}
                />
              )}
            </Box>
            {(showName || showSize) && (
              <Box sx={{ mt: 1, px: 0.5 }}>
                {showName && (
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={filename}
                  >
                    {filename}
                  </Typography>
                )}
                {showSize && (
                  <Typography variant="caption" color="text.secondary">
                    {sizeLabel}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default MediaItemsGrid;
