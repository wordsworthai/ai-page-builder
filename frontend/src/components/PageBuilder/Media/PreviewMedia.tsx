import React from 'react';
import { Paper, Stack, Typography } from '@mui/material';
import { MediaItem } from '@/hooks/api/PageBuilder/Media/useMedia';
import NoMediaYet from './NoMediaYet';
import { StockPreviewMedia } from '@/types/media';
import MediaItemPreview from './MediaItemPreview';
import MediaSearchItemPreview from './MediaSearchItemPreview';

export interface PreviewMediaProps {
  media?: MediaItem;
  stockPreview?: StockPreviewMedia;
  onDelete?: () => void;
  isDeleting?: boolean;
  onUseStock?: () => void;
  isUsingStock?: boolean;
}

const PreviewMedia: React.FC<PreviewMediaProps> = ({
  media,
  stockPreview,
  onDelete,
  isDeleting,
  onUseStock,
  isUsingStock,
}) => {
  const hasStockPreview = Boolean(stockPreview?.url);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        padding: 2.5,
        height: '81vh',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
        border: '1px solid rgba(0, 0, 0, 0.05)',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle1" fontWeight={700}>
          Preview
        </Typography>
      </Stack>

      {media ? (
        <MediaItemPreview media={media} onDelete={onDelete} isDeleting={isDeleting} />
      ) : hasStockPreview ? (
        <MediaSearchItemPreview
          stockPreview={stockPreview as StockPreviewMedia}
          onUseStock={onUseStock}
          isUsingStock={isUsingStock}
        />
      ) : (
        <NoMediaYet
          title="No media selected"
          message="Upload or select media to preview"
          containerSx={{
            flex: 1,
          }}
        />
      )}
    </Paper>
  );
};

export default PreviewMedia;
