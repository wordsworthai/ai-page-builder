import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Stack, TextField, Typography, CircularProgress } from "@mui/material";
import { Close, Edit } from "@mui/icons-material";
import React, { useState } from "react";
import MediaManagement from "@/pages/PageBuilder/Media/MediaManagement";
import type { MediaItem } from "@/hooks/api/PageBuilder/Media/useMedia";
import { ShutterstockItem } from "@/types/media";
import { useCurrentUser } from "@/hooks/api/Shared/Auth/useCurrentUser";
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useHighlightSafe } from "../../contexts";

export interface SlotInfo {
  elementId?: string;
  blockType?: string;
  blockIndex?: number;
  sectionId?: string;
  width: number;
  height: number;
}

export interface MediaPickerFieldBaseProps {
  label: React.ReactNode;
  sourceUrl: string;
  altText: string;
  onChange: (value: unknown) => void;
  mediaType: "image" | "video";
  changeButtonLabel: string;
  buildValueFromMediaItem: (mediaItem: MediaItem) => unknown | null;
  ingestStockMedia: (params: {
    id: string;
    businessId: string;
    searchQuery: string;
    onSuccess: (data: any) => void;
  }) => void;
  isIngestingStockMedia: boolean;
  stockIngestError: string;
  elementId?: string;
  sectionId?: string;
  blockType?: string;
  blockIndex?: number;
  slotInfo?: SlotInfo;
}

export function MediaPickerFieldBase({
  label,
  sourceUrl,
  altText,
  onChange,
  mediaType,
  changeButtonLabel,
  buildValueFromMediaItem,
  ingestStockMedia,
  isIngestingStockMedia,
  stockIngestError,
  elementId,
  sectionId,
  blockType,
  blockIndex,
  slotInfo,
}: MediaPickerFieldBaseProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedMedia, setSelectedMedia] = React.useState<MediaItem | null>(null);
  const [selectedStockItem, setSelectedStockItem] = React.useState<ShutterstockItem | null>(null);
  const [activeSearchQuery, setActiveSearchQuery] = React.useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  const { data: currentUser } = useCurrentUser();
  const businessId = currentUser?.business_id || '';
  const { createSnackBar } = useSnackBarContext();
  const { highlightElement, clearHighlights } = useHighlightSafe();

  const handleStockSearchChange = (item: ShutterstockItem | null, searchQuery: string) => {
    setSelectedStockItem(item);
    setActiveSearchQuery(searchQuery);
    if (item) {
      setSelectedMedia(null);
    }
  };

  const handleUseMedia = () => {
    if (selectedStockItem) {
      const trimmedQuery = activeSearchQuery.trim();
      if (!trimmedQuery) {
        createSnackBar({
          content: stockIngestError,
          severity: 'error',
          autoHide: true,
        });
        return;
      }
      ingestStockMedia({
        id: selectedStockItem.id,
        businessId,
        searchQuery: trimmedQuery,
        onSuccess: (data: any) => {
          const media = data?.media;
          if (media) {
            const nextValue = buildValueFromMediaItem(media as MediaItem);
            if (!nextValue) return;
            onChange(nextValue);
            setSelectedMedia(null);
            setSelectedStockItem(null);
            setActiveSearchQuery('');
            setOpen(false);
          }
        },
      });
    } else if (selectedMedia) {
      const nextValue = buildValueFromMediaItem(selectedMedia);
      if (!nextValue) return;
      onChange(nextValue);
      setSelectedMedia(null);
      setSelectedStockItem(null);
      setActiveSearchQuery('');
      setOpen(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedMedia(null);
    setSelectedStockItem(null);
    setActiveSearchQuery('');
  };

  const canUseMedia = selectedMedia !== null || selectedStockItem !== null;

  const handleFocus = () => {
    setIsFocused(true);
    if (elementId) {
      highlightElement(elementId, sectionId, blockType, blockIndex);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    clearHighlights();
  };

  const handleMouseLeave = () => {
    // Only clear if not focused (not actively editing)
    if (!isFocused) {
      clearHighlights();
    }
  };

  return (
    <Box 
      sx={{ width: "100%" }}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseLeave={handleMouseLeave}
    >
      {typeof label === "string" ? (
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {label}
        </Typography>
      ) : (
        <Box sx={{ mb: 1 }}>
          {label}
        </Box>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
            Source
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              fullWidth
              value={sourceUrl}
              placeholder=""
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
            />
            <IconButton
              aria-label={changeButtonLabel}
              title={changeButtonLabel}
              onClick={() => {
                setOpen(true);
              }}
              sx={{
                color: "white",
                backgroundColor: "#434775",
                "&:hover": {
                  backgroundColor: "white",
                  color: "#434775",
                },
                "&:focus": {
                  outline: "none",
                  boxShadow: "none",
                },
                "&:focus-visible": {
                  outline: "none",
                  boxShadow: "none",
                },
                "&.Mui-focusVisible": {
                  outline: "none",
                  boxShadow: "none",
                },
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
            Alt text
          </Typography>
          <TextField fullWidth value={altText} 
            slotProps={{ 
              input: {
                readOnly: true 
              }
            }} 
          />
        </Box>
      </Box>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ pr: 2 }} >
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
            <Typography variant="h6" fontWeight={700}>
              {mediaType === "video" ? "Videos" : mediaType === "image" ? "Images" : "Media Grid"}
            </Typography>
            <Stack direction="row" alignItems="center" gap={1}>
              <Button
                variant="contained"
                color="primary"
                disabled={!canUseMedia || isIngestingStockMedia}
                onClick={handleUseMedia}
                startIcon={isIngestingStockMedia ? <CircularProgress size={18} color="inherit" /> : undefined}
              >
                {isIngestingStockMedia ? 'Adding...' : 'Use Media'}
              </Button>
              <IconButton aria-label="Close" title="Close" onClick={handleClose}>
                <Close />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 1, height: "82vh", backgroundColor: '#faf9ff' }}>
          <MediaManagement 
            embedded 
            mediaType={mediaType} 
            onSelectedMediaChange={setSelectedMedia}
            onSelectedStockSearchChange={handleStockSearchChange}
            slotInfo={slotInfo}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
