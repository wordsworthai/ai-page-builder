import React, { useState, useEffect } from 'react';
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { StockPreviewMedia } from '@/types/media';

export interface MediaSearchItemPreviewProps {
  stockPreview: StockPreviewMedia;
  onUseStock?: () => void;
  isUsingStock?: boolean;
}

const MediaSearchItemPreview: React.FC<MediaSearchItemPreviewProps> = ({
  stockPreview,
  onUseStock,
  isUsingStock,
}) => {
  const description = stockPreview?.description || 'Shutterstock image';
  const isVideo = stockPreview?.mediaType === 'video';
  const actionLabel = isVideo ? 'Use Video' : 'Use Image';
  const hasVideoPreview = Boolean(isVideo && stockPreview?.previewVideoUrl);
  const videoSourceUrl = hasVideoPreview ? stockPreview?.previewVideoUrl : '';
  const videoSourceType = videoSourceUrl?.endsWith('.webm') ? 'video/webm' : 'video/mp4';
  const videoKey = videoSourceUrl || stockPreview?.id || 'stock-video';
  const previewUrl = hasVideoPreview ? videoSourceUrl : stockPreview?.url;

  const [isPreviewLoading, setIsPreviewLoading] = useState(true);

  useEffect(() => {
    setIsPreviewLoading(true);
  }, [stockPreview?.id, previewUrl]);

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
        title={description}
      >
        {description}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flex: 0.5,
          backgroundColor: '#f5f5f5',
          borderRadius: 1,
          overflow: 'auto',
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
        {hasVideoPreview ? (
          <video
            key={videoKey}
            controls
            preload="metadata"
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: isPreviewLoading ? 0 : 1,
              transition: 'opacity 0.2s ease-in-out',
            }}
            poster={stockPreview?.url}
            onLoadedData={handlePreviewLoad}
          >
            <source src={videoSourceUrl} type={videoSourceType} />
          </video>
        ) : (
          <img
            src={stockPreview?.url}
            alt={description}
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
              Source
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              Shutterstock
            </Typography>
          </Box>
          {stockPreview?.duration ? (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Duration
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {Math.round(stockPreview.duration)}s
              </Typography>
            </Box>
          ) : null}
        </Stack>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={isUsingStock ? <CircularProgress size={18} color="inherit" /> : undefined}
          onClick={() => onUseStock?.()}
          disabled={isUsingStock}
          sx={{
            '&:focus': {
              outline: 'none',
            },
            '&:focus-visible': {
              outline: 'none',
            },
          }}
        >
          {isUsingStock ? 'Adding...' : actionLabel}
        </Button>
      </Box>
    </Box>
  );
};

export default MediaSearchItemPreview;
