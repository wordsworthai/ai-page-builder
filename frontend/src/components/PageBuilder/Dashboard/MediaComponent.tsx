import React from 'react';
import { Box, Button, styled, CircularProgress, Typography } from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import { ComponentContainer, ComponentTitle, ComponentContent } from './ComponentContainer';
import { ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/api/Shared/Auth/useCurrentUser';
import { useMediaOverview, useRecommendedMedia } from '@/hooks/api/PageBuilder/Media/useMedia';
import { getMediaThumbnailUrl, getAltText } from '@/utils/mediaUtil';
import NoMediaYet from '@/components/PageBuilder/Media/NoMediaYet';

const ManageMediaButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  gap: theme.spacing(1),
}));

const ImageGridItem = styled(Box)(() => ({
  aspectRatio: '1',
  borderRadius: '8px',
  overflow: 'hidden',
}));

const PlaceholderImage = styled(Box)(() => ({
  height: '100%',
  backgroundColor: '#e0e0e0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const MediaThumbnail = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});


const MAX_GRID_ITEMS = 6;

const MediaComponent: React.FC = () => {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const { data: mediaData, isLoading } = useMediaOverview(currentUser?.business_id);

  const mediaItems = mediaData?.media || [];
  const hasMedia = mediaItems.length > 0;

  // Always fetch recommended media to fill remaining slots
  const { data: recommendedData, isLoading: isLoadingRecommended } = useRecommendedMedia(
    !isLoading ? currentUser?.business_id : null,
    'image' // Show images only in dashboard
  );

  // Merge: user content first, then fill remaining with recommended (up to 6 total)
  const recommendedItems = recommendedData?.media || [];
  const remainingSlots = Math.max(0, MAX_GRID_ITEMS - mediaItems.length);
  const fillerItems = recommendedItems.slice(0, remainingSlots);
  const gridItems = [...mediaItems, ...fillerItems];
  const placeholderCount = Math.max(0, MAX_GRID_ITEMS - gridItems.length);
  const isLoadingAny = isLoading || isLoadingRecommended;

  return (
    <ComponentContainer>
      <ComponentTitle>Media & Content</ComponentTitle>
      <ComponentContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'end',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {isLoadingAny ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
              }}
            >
              <CircularProgress size={32} />
            </Box>
          ) : gridItems.length > 0 ? (
            <Box>
              {!hasMedia && fillerItems.length > 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 1.5, display: 'block' }}
                >
                  Recommended for you
                </Typography>
              )}
              <Grid2 container spacing={2}>
                {gridItems.map((item) => {
                  const thumbnailUrl = getMediaThumbnailUrl(item);
                  return (
                    <Grid2 key={item._id} size={{ xs: 4 }}>
                      <ImageGridItem>
                        {thumbnailUrl ? (
                          <MediaThumbnail src={thumbnailUrl} alt={getAltText(item)} />
                        ) : (
                          <PlaceholderImage>
                            {item.media_type === 'video' ? 'Video' : 'Image'}
                          </PlaceholderImage>
                        )}
                      </ImageGridItem>
                    </Grid2>
                  );
                })}
                {/* Fill remaining slots with placeholders */}
                {Array.from({ length: placeholderCount }).map((_, index) => (
                  <Grid2 key={`placeholder-${index}`} size={{ xs: 4 }}>
                    <ImageGridItem>
                      <PlaceholderImage />
                    </ImageGridItem>
                  </Grid2>
                ))}
              </Grid2>
            </Box>
          ) : (
            <NoMediaYet
              title="No Media Yet"
              message="Upload images and videos to enhance your website. Click 'Manage Media' to get started."
            />
          )}
        </Box>
        <ManageMediaButton
          variant="contained"
          color="secondary"
          onClick={() => navigate('/dashboard/media')}
        >
          Manage Media
          <ArrowForward fontSize="small" />
        </ManageMediaButton>
      </ComponentContent>
    </ComponentContainer>
  );
};

export default MediaComponent;
