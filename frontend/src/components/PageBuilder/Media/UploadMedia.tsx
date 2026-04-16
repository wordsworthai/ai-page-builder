import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Upload, Close } from '@mui/icons-material';
import Uppy from '@uppy/core';
import Dashboard from '@uppy/react/dashboard';
import ThumbnailGenerator from '@uppy/thumbnail-generator';
import XHRUpload from '@uppy/xhr-upload';
import { useQueryClient } from '@tanstack/react-query';
import { OpenAPI } from '@/client';

// Size limits in bytes
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export type MediaType = 'image' | 'video';

export interface UploadedMediaResult {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  mediaType?: 'image' | 'video';
}

export interface UploadMediaProps {
  businessId: string;
  maxFiles?: number;
  onUploadComplete?: (uploadedMedia?: UploadedMediaResult[]) => void;
  /** When provided, the dialog is controlled externally (no trigger button rendered). */
  open?: boolean;
  /** Called when the dialog is closed (only used in controlled mode). */
  onClose?: () => void;
  /** Override the upload API endpoint (defaults to /api/media/upload). */
  uploadEndpoint?: string;
}

const UploadMedia: React.FC<UploadMediaProps> = ({
  businessId,
  maxFiles = 1,
  onUploadComplete,
  open,
  onClose,
  uploadEndpoint,
}) => {
  const isControlled = open !== undefined;
  const [showUploader, setShowUploader] = useState(false);
  const isDialogOpen = isControlled ? open : showUploader;
  const [hasSelectedFiles, setHasSelectedFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const uppy = useMemo(() => {
    const instance = new Uppy({
      restrictions: {
        maxNumberOfFiles: maxFiles,
        allowedFileTypes: ['image/*', 'video/*'],
        maxFileSize: MAX_VIDEO_SIZE,
      },
      autoProceed: false,
      onBeforeFileAdded: (currentFile) => {
        const fileType = currentFile.type || '';
        const fileSize = currentFile.size || 0;

        if (fileType.startsWith('image/')) {
          if (fileSize > MAX_IMAGE_SIZE) {
            instance.info(
              `Image "${currentFile.name}" exceeds the 20MB limit. Please choose a smaller file.`,
              'error',
              5000
            );
            return false;
          }
        } else if (fileType.startsWith('video/')) {
          if (fileSize > MAX_VIDEO_SIZE) {
            instance.info(
              `Video "${currentFile.name}" exceeds the 100MB limit. Please choose a smaller file.`,
              'error',
              5000
            );
            return false;
          }
        }
        return true;
      },
    });
    instance.use(ThumbnailGenerator, {
      thumbnailWidth: 600,
      thumbnailHeight: 600,
      thumbnailType: 'image/jpeg',
      waitForThumbnailsBeforeUpload: true,
    });
    instance.use(XHRUpload, {
      endpoint: uploadEndpoint || `${OpenAPI.BASE}/api/media/upload`,
      fieldName: 'file',
      formData: true,
      withCredentials: true,
      allowedMetaFields: ['business_id'],
    });

    return instance;
  }, [maxFiles, uploadEndpoint]);

  useEffect(() => {
    if (businessId) {
      uppy.setMeta({ business_id: businessId });
    }
  }, [uppy, businessId]);

  useEffect(() => {
    return () => {
      uppy.clear();
    };
  }, [uppy]);

  useEffect(() => {
    const updateHasFiles = () => {
      setHasSelectedFiles(uppy.getFiles().length > 0);
    };
    uppy.on('file-added', updateHasFiles);
    uppy.on('file-removed', updateHasFiles);
    return () => {
      uppy.off('file-added', updateHasFiles);
      uppy.off('file-removed', updateHasFiles);
    };
  }, [uppy]);

  useEffect(() => {
    const handleComplete = (result: { successful?: unknown[]; failed?: unknown[] }) => {
      setIsUploading(false);
      const failed = result.failed || [];
      const successful = result.successful || [];
      if (failed.length > 0) {
        console.error('Some uploads failed:', failed);
      }
      if (successful.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['media-details', businessId] });
        if (isControlled) {
          onClose?.();
        } else {
          setShowUploader(false);
        }
        // Extract uploaded media data from Uppy response
        const uploadedMedia: UploadedMediaResult[] = successful.map((file: any) => {
          const body = file.response?.body;
          const image = body?.media?.image;
          return {
            url: image?.src || '',
            width: image?.width,
            height: image?.height,
            alt: image?.alt || '',
            mediaType: body?.media?.media_type,
          };
        });
        uppy.cancelAll();
        uppy.resetProgress();
        setHasSelectedFiles(false);
        onUploadComplete?.(uploadedMedia);
      }
    };
    const handleError = (error: Error) => {
      setIsUploading(false);
      console.error('Upload error:', error);
    };
    uppy.on('complete', handleComplete);
    uppy.on('error', handleError);
    return () => {
      uppy.off('complete', handleComplete);
      uppy.off('error', handleError);
    };
  }, [uppy, queryClient, businessId, onUploadComplete, isControlled, onClose]);

  const handleOpenUploader = () => {
    setShowUploader(true);
  };

  const handleClose = () => {
    if (isUploading) return;
    if (isControlled) {
      onClose?.();
    } else {
      setShowUploader(false);
    }
    uppy.cancelAll();
    uppy.resetProgress();
    setHasSelectedFiles(false);
  };

  const handleUpload = async () => {
    if (!businessId) {
      console.error('Business ID is required for upload');
      return;
    }

    setIsUploading(true);
    try {
      await uppy.upload();
    } catch (error) {
      setIsUploading(false);
      console.error('Upload failed:', error);
    }
  };

  return (
    <>
      {!isControlled && (
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Upload />}
          onClick={handleOpenUploader}
          sx={{
            '&:focus': {
              outline: 'none',
            },
            '&:focus-visible': {
              outline: 'none',
            },
            '&:hover': {
              color: '#fff',
            },
          }}
        >
          Upload Files
        </Button>
      )}

      <Dialog open={isDialogOpen} onClose={handleClose}>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <Upload color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Upload Media
              </Typography>
            </Box>
            <IconButton onClick={handleClose} size="small" disabled={isUploading}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              '& .uppy-Dashboard-AddFiles-title': {
                marginTop: '35%',
              },
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Max file size: 20MB for images, 100MB for videos
            </Typography>
            <Dashboard
              uppy={uppy}
              proudlyDisplayPoweredByUppy={false}
              height={400}
              hideUploadButton
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
          <Button onClick={handleClose} color="inherit" disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            color="secondary"
            disabled={!hasSelectedFiles || isUploading}
            startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <Upload />}
            sx={{
              '&:focus': {
                outline: 'none',
              },
              '&:focus-visible': {
                outline: 'none',
              },
              '&:hover': {
                color: '#fff',
              },
            }}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UploadMedia;
