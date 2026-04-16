import React from 'react';
import { Box, Stack } from '@mui/material';
import NoMediaYet from './NoMediaYet';
import UploadMedia from './UploadMedia';
import { MediaItem } from '@/hooks/api/PageBuilder/Media/useMedia';
import MediaItemsGrid from './MediaItemsGrid';

export interface YourMediaContentProps {
  media: MediaItem[];
  businessId: string;
  selectedIndex: number | null;
  onSelectMedia: (index: number) => void;
  mediaType?: 'image' | 'video';
  showSize?: boolean;
  embedded?: boolean;
}

const YourMediaContent: React.FC<YourMediaContentProps> = ({
  media,
  businessId,
  selectedIndex,
  onSelectMedia,
  mediaType,
  showSize = true,
  embedded = false,
}) => {
  const uploadedMedia = media.filter((item) => item.source === 'upload' && (!mediaType || item.media_type === mediaType));
  const hasMedia = uploadedMedia.length > 0;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '73vh',
        gap: 2,
      }}
    >
      <Box
        sx={{
          flex: 1,
          height: '65vh',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {hasMedia ? (
          <MediaItemsGrid
            items={uploadedMedia}
            isSelected={(_item, index) => selectedIndex === index}
            onSelect={(_item, index) => onSelectMedia(index)}
            objectFit="contain"
            showSize={showSize}
            useThumbnail={!embedded}
            fallbackToOriginalOnThumbnailError
          />
        ) : (
          <NoMediaYet
            containerSx={{
              minHeight: '65vh',
            }}
          />
        )}
      </Box>
      <Stack direction="row" justifyContent="flex-end" sx={{ paddingTop: 1 }}>
        <UploadMedia businessId={businessId} maxFiles={1} />
      </Stack>
    </Box>
  );
};

export default YourMediaContent;
