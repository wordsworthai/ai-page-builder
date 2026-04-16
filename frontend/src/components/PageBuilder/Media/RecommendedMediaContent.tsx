import React, { useState } from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Image, Videocam } from '@mui/icons-material';
import NoMediaYet from './NoMediaYet';
import { MediaItem } from '@/hooks/api/PageBuilder/Media/useMedia';
import MediaItemsGrid from './MediaItemsGrid';

export interface RecommendedMediaContentProps {
  media: MediaItem[];
  selectedIndex: number | null;
  onSelectMedia: (index: number) => void;
  mediaType?: 'image' | 'video';
  emptyMessage?: string;
  showSize?: boolean;
  embedded?: boolean;
}

const RecommendedMediaContent: React.FC<RecommendedMediaContentProps> = ({
  media,
  selectedIndex,
  onSelectMedia,
  mediaType,
  emptyMessage = 'AI-generated media for your business will appear here.',
  showSize = true,
  embedded = false,
}) => {
  // For dashboard mode (not embedded), allow toggling between images and videos
  const [dashboardMediaType, setDashboardMediaType] = useState<'image' | 'video' | 'all'>('all');
  
  // Determine effective media type filter
  const effectiveMediaType = embedded ? mediaType : (dashboardMediaType === 'all' ? undefined : dashboardMediaType);
  
  // Filter by effective media type, but NOT by source (since these are 'generated')
  const filteredMedia = media.filter((item) => !effectiveMediaType || item.media_type === effectiveMediaType);
  const hasMedia = filteredMedia.length > 0;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '73vh',
        gap: 2,
      }}
    >
      {/* Toggle for dashboard mode (not embedded) */}
      {!embedded && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Filter by type:
          </Typography>
          <ToggleButtonGroup
            value={dashboardMediaType}
            exclusive
            onChange={(_, newValue) => {
              if (newValue !== null) {
                setDashboardMediaType(newValue);
              }
            }}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                px: 2,
                py: 0.5,
                fontSize: '0.75rem',
              },
            }}
          >
            <ToggleButton value="all">
              All
            </ToggleButton>
            <ToggleButton value="image">
              <Image sx={{ fontSize: '1rem', mr: 0.5 }} />
              Images
            </ToggleButton>
            <ToggleButton value="video">
              <Videocam sx={{ fontSize: '1rem', mr: 0.5 }} />
              Videos
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}
      <Box
        sx={{
          flex: 1,
          height: embedded ? '65vh' : '60vh',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {hasMedia ? (
          <MediaItemsGrid
            items={filteredMedia}
            isSelected={(_item, index) => selectedIndex === index}
            onSelect={(_item, index) => onSelectMedia(index)}
            objectFit="cover"
            showSize={showSize}
            useThumbnail={!embedded}
          />
        ) : (
          <NoMediaYet
            title="No Recommendations Yet"
            message={emptyMessage}
            containerSx={{
              minHeight: embedded ? '65vh' : '60vh',
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default RecommendedMediaContent;