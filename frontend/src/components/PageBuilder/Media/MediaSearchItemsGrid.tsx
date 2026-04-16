import React from 'react';
import { Box, Typography } from '@mui/material';
import { ShutterstockItem } from '@/types/media';
import { getShutterstockImageUrl } from '@/utils/mediaUtil';

export interface MediaSearchItemsGridProps {
  items: ShutterstockItem[];
  selectedId?: string | null;
  onSelect?: (item: ShutterstockItem) => void;
}

const MediaSearchItemsGrid: React.FC<MediaSearchItemsGridProps> = ({
  items,
  selectedId = null,
  onSelect,
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 2,
        padding: 2,
      }}
    >
      {items.map((item) => {
        const imageUrl = getShutterstockImageUrl(item);
        const description = item.description || 'Shutterstock image';
        const isSelected = selectedId === item.id;

        return (
          <Box
            key={item.id}
            onClick={() => onSelect?.(item)}
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
                border: isSelected ? '2px solid' : '1px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                boxShadow: isSelected ? 3 : undefined,
                transition: 'border-color 0.2s, box-shadow 0.2s',
                '&:hover': {
                  boxShadow: onSelect ? 2 : undefined,
                  borderColor: isSelected ? 'primary.main' : 'primary.light',
                },
                backgroundColor: '#f5f5f5',
              }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={description}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#e0e0e0',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    No preview
                  </Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ mt: 1, px: 0.5 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={description}
              >
                {description}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default MediaSearchItemsGrid;
