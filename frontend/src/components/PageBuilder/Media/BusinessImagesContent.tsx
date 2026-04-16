import React from 'react';
import { Box, Typography } from '@mui/material';
import { MediaItem } from '@/hooks/api/PageBuilder/Media/useMedia';
import { getMediaUrl, getAltText } from '@/utils/mediaUtil';
import NoMediaYet from '@/components/PageBuilder/Media/NoMediaYet';

export interface BusinessImagesContentProps {
  logo: MediaItem[];
  reviews: MediaItem[];
  googlePhotos: MediaItem[];
  selectedLogoIndex: number | null;
  selectedReviewIndex: number | null;
  selectedGooglePhotoIndex: number | null;
  onSelectLogo: (index: number) => void;
  onSelectReview: (index: number) => void;
  onSelectGooglePhoto: (index: number) => void;
}

interface HorizontalImageGridProps {
  items: MediaItem[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  emptyMessage: string;
}

const HorizontalImageGrid: React.FC<HorizontalImageGridProps> = ({
  items,
  selectedIndex,
  onSelect,
  emptyMessage,
}) => {
  if (items.length === 0) {
    return (
      <Box
        sx={{
          padding: 3,
          textAlign: 'center',
          color: 'text.secondary',
        }}
      >
        <Typography variant="body2">{emptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        overflowX: 'auto',
        overflowY: 'hidden',
        padding: 2,
        scrollbarWidth: 'thin',
        '&::-webkit-scrollbar': {
          height: 8,
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#f5f5f5',
          borderRadius: 4,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#ccc',
          borderRadius: 4,
          '&:hover': {
            backgroundColor: '#999',
          },
        },
      }}
    >
      {items.map((item, index) => {
        const selected = selectedIndex === index;
        return (
          <Box
            key={item._id || index}
            onClick={() => onSelect(index)}
            sx={{
              flexShrink: 0,
              width: 150,
              cursor: 'pointer',
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
                  boxShadow: 2,
                  borderColor: selected ? 'primary.main' : 'primary.light',
                },
                backgroundColor: '#f5f5f5',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              <img
                src={getMediaUrl(item)}
                alt={getAltText(item)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

const BusinessImagesContent: React.FC<BusinessImagesContentProps> = ({
  logo,
  reviews,
  googlePhotos,
  selectedLogoIndex,
  selectedReviewIndex,
  selectedGooglePhotoIndex,
  onSelectLogo,
  onSelectReview,
  onSelectGooglePhoto,
}) => {
  const hasNoImages = logo.length === 0 && reviews.length === 0 && googlePhotos.length === 0;

  if (hasNoImages) {
    return (
      <Box
        sx={{
          display: 'flex',
          height: '73vh',
          padding: 2,
        }}
      >
        <NoMediaYet
          title="No Business Images"
          message="Business images from your logo, reviews, and Google Photos will appear here once available."
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '73vh',
        gap: 3,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: 2,
      }}
    >
      {/* Header / Logo Section */}
      <Box>
        <Typography
          variant="h6"
          sx={{
            marginBottom: 1.5,
            fontWeight: 600,
            color: 'text.primary',
          }}
        >
          Header / logo
        </Typography>
        <HorizontalImageGrid
          items={logo}
          selectedIndex={selectedLogoIndex}
          onSelect={onSelectLogo}
          emptyMessage="No logo images available"
        />
      </Box>

      {/* Reviews Section */}
      <Box>
        <Typography
          variant="h6"
          sx={{
            marginBottom: 1.5,
            fontWeight: 600,
            color: 'text.primary',
          }}
        >
          Reviews
        </Typography>
        <HorizontalImageGrid
          items={reviews}
          selectedIndex={selectedReviewIndex}
          onSelect={onSelectReview}
          emptyMessage="No review photos available"
        />
      </Box>

      {/* Google Photos Section */}
      <Box>
        <Typography
          variant="h6"
          sx={{
            marginBottom: 1.5,
            fontWeight: 600,
            color: 'text.primary',
          }}
        >
          Google Photos
        </Typography>
        <HorizontalImageGrid
          items={googlePhotos}
          selectedIndex={selectedGooglePhotoIndex}
          onSelect={onSelectGooglePhoto}
          emptyMessage="No Google Photos available"
        />
      </Box>
    </Box>
  );
};

export default BusinessImagesContent;
