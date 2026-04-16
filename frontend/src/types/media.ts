import { SxProps, Theme } from '@mui/material';

export interface NoMediaYetProps {
  containerSx?: SxProps<Theme>;
  title?: string;
  message?: string;
}

type ShutterstockAsset = {
  url?: string;
};

type ShutterstockVideoAsset = {
  url?: string;
};

type ShutterstockAssets = {
  // Image assets
  preview?: ShutterstockAsset;
  preview_600?: ShutterstockAsset;
  large_thumb?: ShutterstockAsset;
  small_thumb?: ShutterstockAsset;
  mosaic?: ShutterstockAsset;
  // Video assets (poster frames and previews)
  thumb_webm?: ShutterstockVideoAsset;
  thumb_mp4?: ShutterstockVideoAsset;
  preview_webm?: ShutterstockVideoAsset;
  preview_mp4?: ShutterstockVideoAsset;
  thumb_jpg?: ShutterstockAsset;
  preview_jpg?: ShutterstockAsset;
};

export type ShutterstockItem = {
  id: string;
  description?: string;
  media_type?: 'image' | 'video';
  duration?: number;
  assets?: ShutterstockAssets;
};

export interface StockPreviewMedia {
  url: string;
  description?: string;
  id?: string;
  duration?: number;
  mediaType?: 'image' | 'video';
  previewVideoUrl?: string;
}