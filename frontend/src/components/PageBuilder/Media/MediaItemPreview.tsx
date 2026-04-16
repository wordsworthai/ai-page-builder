import React, { useState, useEffect } from 'react';
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { MediaItem } from '@/hooks/api/PageBuilder/Media/useMedia';
import {
  formatFileSize,
  formatMediaDate,
  getAltText,
  getFileExtension,
  getFilename,
  getMediaUrl,
} from '@/utils/mediaUtil';

export interface MediaItemPreviewProps {
  media: MediaItem;
  onDelete?: () => void;
  isDeleting?: boolean;
}

const MediaItemPreview: React.FC<MediaItemPreviewProps> = ({ media, onDelete, isDeleting }) => {
  const filename = getFilename(media);
  const mediaUrl = getMediaUrl(media);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);

  useEffect(() => {
    setIsPreviewLoading(true);
  }, [media._id, mediaUrl]);

  const handlePreviewLoad = () => {
    setIsPreviewLoading(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        flex: 1,
        overflow: 'hidden',
      }}
    >
      <Typography
        variant="body1"
        fontWeight={600}
        sx={{
          overflow: 'auto',
          textOverflow: 'ellipsis',
          whiteSpace: 'break-spaces',
        }}
        title={filename}
      >
        {filename}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flex: 0.5,
          backgroundColor: '#f5f5f5',
          borderRadius: 1,
          overflow: 'hidden',
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isPreviewLoading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
              zIndex: 1,
            }}
          >
            <CircularProgress size={40} />
          </Box>
        )}
        {media.media_type === 'video' ? (
          <video
            src={mediaUrl}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              opacity: isPreviewLoading ? 0 : 1,
              transition: 'opacity 0.2s ease-in-out',
            }}
            controls
            onLoadedData={handlePreviewLoad}
          />
        ) : (
          <img
            src={mediaUrl}
            alt={getAltText(media)}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              opacity: isPreviewLoading ? 0 : 1,
              transition: 'opacity 0.2s ease-in-out',
            }}
            onLoad={handlePreviewLoad}
          />
        )}
      </Box>

      <Box>
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Type
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {getFileExtension(filename)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Size
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {formatFileSize(media.size)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Uploaded at
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {formatMediaDate(media.created_at)}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto' }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={isDeleting ? <CircularProgress size={18} color="error" /> : <Delete />}
          onClick={() => onDelete?.()}
          disabled={isDeleting}
          sx={{
            '&:focus': {
              outline: 'none',
            },
            '&:focus-visible': {
              outline: 'none',
            },
          }}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </Box>
    </Box>
  );
};

export default MediaItemPreview;
