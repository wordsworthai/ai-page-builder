import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Tabs, Tab, CircularProgress } from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import DashboardV2Layout from '@/components/PageBuilder/Layouts/DashboardV2Layout';
import YourMediaContent from '@/components/PageBuilder/Media/YourMediaContent';
import RecommendedMediaContent from '@/components/PageBuilder/Media/RecommendedMediaContent';
import StockProvider from '@/components/PageBuilder/Media/StockProvider';
import PreviewMedia from '@/components/PageBuilder/Media/PreviewMedia';
import BusinessImagesContent from '@/components/PageBuilder/Media/BusinessImagesContent';
import { useCurrentUser } from '@/hooks/api/Shared/Auth/useCurrentUser';
import { 
  useMediaDetails, 
  useDeleteMedia, 
  MediaItem, 
  useIngestStockImage, 
  useIngestStockVideo,
  useRecommendedMedia,
  useSlotRecommendedMedia,
  useBusinessImages,
  SlotRecommendationParams
} from '@/hooks/api/PageBuilder/Media/useMedia';
import { ShutterstockItem } from '@/types/media';
import { getShutterstockImageUrl, getShutterstockVideoPreviewUrl } from '@/utils/mediaUtil';
import { useSnackBarContext } from '@/context/SnackBarContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`media-tabpanel-${index}`}
      aria-labelledby={`media-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export interface SlotInfo {
  elementId?: string;
  blockType?: string;
  blockIndex?: number;
  sectionId?: string;
  width: number;
  height: number;
}

export interface MediaManagementProps {
  embedded?: boolean;
  onSelectedMediaChange?: (media: MediaItem | null) => void;
  onSelectedStockSearchChange?: (item: ShutterstockItem | null, searchQuery: string) => void;
  mediaType?: 'image' | 'video';
  slotInfo?: SlotInfo;
}

// Tab indices
const TAB_RECOMMENDED = 0;
const TAB_BUSINESS_IMAGES = 1;
const TAB_YOUR_CONTENT = 2;
const TAB_STOCK = 3; // Hidden but kept for future use

const MediaManagement: React.FC<MediaManagementProps> = ({ embedded = false, onSelectedMediaChange, onSelectedStockSearchChange, mediaType, slotInfo }) => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedYourMediaIndex, setSelectedYourMediaIndex] = useState<number | null>(null);
  const [selectedStockItem, setSelectedStockItem] = useState<ShutterstockItem | MediaItem | null>(null);
  const [selectedRecommendedIndex, setSelectedRecommendedIndex] = useState<number | null>(null);
  const [selectedLogoIndex, setSelectedLogoIndex] = useState<number | null>(null);
  const [selectedReviewIndex, setSelectedReviewIndex] = useState<number | null>(null);
  const [selectedGooglePhotoIndex, setSelectedGooglePhotoIndex] = useState<number | null>(null);
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [shouldResetStockSearch, setShouldResetStockSearch] = useState(false);

  const { data: currentUser } = useCurrentUser();
  const businessId = currentUser?.business_id || '';
  const { data: mediaData, isLoading } = useMediaDetails(businessId);
  
  // Conditionally use slot-specific or general recommendations
  const slotParams: SlotRecommendationParams | null = slotInfo ? {
    elementId: slotInfo.elementId,
    blockType: slotInfo.blockType,
    blockIndex: slotInfo.blockIndex,
    sectionId: slotInfo.sectionId,
    width: slotInfo.width,
    height: slotInfo.height,
  } : null;
  
  const { data: slotRecommendedData, isLoading: isLoadingSlotRecommended } = useSlotRecommendedMedia(
    businessId,
    slotParams,
    mediaType
  );
  
  const { data: generalRecommendedData, isLoading: isLoadingGeneralRecommended } = useRecommendedMedia(
    businessId,
    mediaType
  );
  
  // Use slot-specific if slotInfo provided, otherwise use general
  const recommendedData = slotInfo ? slotRecommendedData : generalRecommendedData;
  const isLoadingRecommended = slotInfo ? isLoadingSlotRecommended : isLoadingGeneralRecommended;
  
  const { data: businessImagesData, isLoading: isLoadingBusinessImages } = useBusinessImages(businessId);
  
  const { mutate: deleteMedia, isPending: isDeleting } = useDeleteMedia();
  const { mutate: ingestStockImage, isPending: isIngestingStockImage } = useIngestStockImage();
  const { mutate: ingestStockVideo, isPending: isIngestingStockVideo } = useIngestStockVideo();
  const { createSnackBar } = useSnackBarContext();

  const media: MediaItem[] = mediaData?.media || [];
  const recommendedMedia: MediaItem[] = recommendedData?.media || [];
  const yourMedia = media.filter((item) => item.source === 'upload' && (!mediaType || item.media_type === mediaType));
  const stockMedia = media.filter((item) => item.source === 'stock');

  useEffect(() => {
    if (yourMedia.length === 0) {
      setSelectedYourMediaIndex(null);
      return;
    }

    if (selectedYourMediaIndex === null || selectedYourMediaIndex >= yourMedia.length) {
      setSelectedYourMediaIndex(0);
    }
  }, [yourMedia.length, selectedYourMediaIndex]);

  useEffect(() => {
    if (recommendedMedia.length === 0) {
      setSelectedRecommendedIndex(null);
      return;
    }

    if (selectedRecommendedIndex === null || selectedRecommendedIndex >= recommendedMedia.length) {
      setSelectedRecommendedIndex(0);
    }
  }, [recommendedMedia.length, selectedRecommendedIndex]);

  useEffect(() => {
    if (tabValue !== TAB_STOCK) return;

    if (!selectedStockItem || !('_id' in selectedStockItem)) return;

    const selectedStockId = (selectedStockItem as MediaItem)._id;
    const existsInLibrary = stockMedia.some((item) => item._id === selectedStockId);

    if (!existsInLibrary) {
      const fallback = stockMedia[0] ?? null;
      setSelectedStockItem(fallback);
    }
  }, [selectedStockItem, stockMedia, tabValue]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue === TAB_YOUR_CONTENT) {
      setSelectedStockItem(null);
    }
  };

  const handleSelectYourMedia = (index: number) => {
    setSelectedYourMediaIndex(index);
  };

  const handleSelectStockMedia = (item: ShutterstockItem | MediaItem | null) => {
    setSelectedStockItem(item);
  };

  const handleSelectRecommendedMedia = (index: number) => {
    setSelectedRecommendedIndex(index);
  };

  const handleSelectLogo = (index: number) => {
    setSelectedLogoIndex(index);
  };

  const handleSelectReview = (index: number) => {
    setSelectedReviewIndex(index);
  };

  const handleSelectGooglePhoto = (index: number) => {
    setSelectedGooglePhotoIndex(index);
  };

  const handleUseStockMedia = () => {
    if (!selectedStockItem || '_id' in selectedStockItem) return;
    const trimmedQuery = activeSearchQuery.trim();
    if (!trimmedQuery) {
      createSnackBar({
        content: 'Search query is required to ingest this stock media',
        severity: 'error',
        autoHide: true,
      });
      return;
    }
    const isVideo = (selectedStockItem as ShutterstockItem).media_type === 'video';
    const baseOptions = {
      onSuccess: (data: any) => {
        const media = data?.media;
        if (media) {
          setSelectedStockItem(media as MediaItem);
          setTabValue(TAB_STOCK);
          setShouldResetStockSearch(true);
        }
      },
    };
    if (isVideo) {
      ingestStockVideo(
        {
          videoId: (selectedStockItem as ShutterstockItem).id,
          businessId,
          searchQuery: trimmedQuery,
        },
        baseOptions
      );
    } else {
      ingestStockImage(
        {
          imageId: (selectedStockItem as ShutterstockItem).id,
          businessId,
          searchQuery: trimmedQuery,
        },
        baseOptions
      );
    }
  };

  const handleDeleteMedia = () => {
    const isYourMediaTab = tabValue === TAB_YOUR_CONTENT && selectedYourMediaIndex !== null;
    const isRecommendedTab = tabValue === TAB_RECOMMENDED && selectedRecommendedIndex !== null;
    const isStockTabWithLibraryItem = tabValue === TAB_STOCK && selectedStockItem && '_id' in selectedStockItem;
    // Business images are read-only (from external sources), so don't allow deletion
    const isBusinessImagesTab = tabValue === TAB_BUSINESS_IMAGES;
    
    if (!previewMedia || (!isYourMediaTab && !isRecommendedTab && !isStockTabWithLibraryItem) || isBusinessImagesTab) {
      return;
    }
    deleteMedia(
      { mediaId: previewMedia._id, businessId },
      {
        onSuccess: () => {
          if (isYourMediaTab && selectedYourMediaIndex !== null) {
            const remainingCount = yourMedia.length - 1;
            if (remainingCount <= 0) {
              setSelectedYourMediaIndex(null);
            } else if (selectedYourMediaIndex >= remainingCount) {
              setSelectedYourMediaIndex(Math.max(0, remainingCount - 1));
            }
          }
          if (isRecommendedTab && selectedRecommendedIndex !== null) {
            const remainingCount = recommendedMedia.length - 1;
            if (remainingCount <= 0) {
              setSelectedRecommendedIndex(null);
            } else if (selectedRecommendedIndex >= remainingCount) {
              setSelectedRecommendedIndex(Math.max(0, remainingCount - 1));
            }
          }
          if (isStockTabWithLibraryItem) {
            const remainingStock = stockMedia.filter((item) => item._id !== previewMedia._id);
            const deletedIndex = stockMedia.findIndex((item) => item._id === previewMedia._id);
            const nextStock =
              remainingStock.length > 0
                ? remainingStock[Math.min(Math.max(deletedIndex, 0), remainingStock.length - 1)]
                : null;
            setSelectedStockItem(nextStock ?? null);
          }
        },
      }
    );
  };

  const getPreviewMedia = (): MediaItem | undefined => {
    if (tabValue === TAB_YOUR_CONTENT) {
      if (selectedYourMediaIndex !== null && yourMedia[selectedYourMediaIndex]) {
        return yourMedia[selectedYourMediaIndex];
      }
      return yourMedia[0];
    }
    
    if (tabValue === TAB_RECOMMENDED) {
      if (selectedRecommendedIndex !== null && recommendedMedia[selectedRecommendedIndex]) {
        return recommendedMedia[selectedRecommendedIndex];
      }
      return recommendedMedia[0];
    }

    if (tabValue === TAB_BUSINESS_IMAGES) {
      const logoItems = businessImagesData?.logo || [];
      const reviewItems = businessImagesData?.reviews || [];
      const googlePhotoItems = businessImagesData?.google_photos || [];
      
      // Check logo selection
      if (selectedLogoIndex !== null && logoItems[selectedLogoIndex]) {
        return logoItems[selectedLogoIndex];
      }
      // Check review selection
      if (selectedReviewIndex !== null && reviewItems[selectedReviewIndex]) {
        return reviewItems[selectedReviewIndex];
      }
      // Check Google photo selection
      if (selectedGooglePhotoIndex !== null && googlePhotoItems[selectedGooglePhotoIndex]) {
        return googlePhotoItems[selectedGooglePhotoIndex];
      }
      // Default to first available item
      if (logoItems.length > 0) return logoItems[0];
      if (reviewItems.length > 0) return reviewItems[0];
      if (googlePhotoItems.length > 0) return googlePhotoItems[0];
    }

    return undefined;
  };

  const previewMedia =
    tabValue === TAB_YOUR_CONTENT || tabValue === TAB_RECOMMENDED || tabValue === TAB_BUSINESS_IMAGES
      ? getPreviewMedia()
      : tabValue === TAB_STOCK && selectedStockItem && '_id' in selectedStockItem
        ? (selectedStockItem as MediaItem)
        : undefined;

  const selectedMediaForUse = previewMedia ?? null;

  useEffect(() => {
    onSelectedMediaChange?.(selectedMediaForUse);
  }, [onSelectedMediaChange, selectedMediaForUse]);

  useEffect(() => {
    if (embedded && onSelectedStockSearchChange) {
      const isStockSearchSelection =
        tabValue === TAB_STOCK && selectedStockItem && !('_id' in selectedStockItem);
      if (isStockSearchSelection) {
        onSelectedStockSearchChange(selectedStockItem as ShutterstockItem, activeSearchQuery);
      } else {
        onSelectedStockSearchChange(null, '');
      }
    }
  }, [embedded, onSelectedStockSearchChange, tabValue, selectedStockItem, activeSearchQuery]);

  const isStockSearchSelection =
    tabValue === TAB_STOCK && selectedStockItem && !('_id' in selectedStockItem);
  const canUseStockSearchItem = isStockSearchSelection;

  const stockPreview =
    tabValue === TAB_STOCK &&
    selectedStockItem &&
    !('_id' in selectedStockItem)
      ? {
          url: getShutterstockImageUrl(selectedStockItem as ShutterstockItem),
          description: (selectedStockItem as ShutterstockItem).description,
          id: (selectedStockItem as ShutterstockItem).id,
          duration: (selectedStockItem as ShutterstockItem).duration,
          mediaType: (selectedStockItem as ShutterstockItem).media_type,
          previewVideoUrl: getShutterstockVideoPreviewUrl(selectedStockItem as ShutterstockItem),
        }
      : undefined;

  const selectedStockId =
    selectedStockItem && '_id' in selectedStockItem
      ? selectedStockItem._id
      : selectedStockItem
        ? (selectedStockItem as ShutterstockItem).id
        : null;

  const mainContent = (
    <Box
      sx={embedded ? { width: '100%' } : { maxWidth: 'xl', mx: 'auto', width: '100%', padding: '30px', marginTop: '3vh' }}
    >
      {!embedded && (
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Manage Media
          </Typography>
        </Box>
      )}

      <Grid2 container spacing={3} sx={{ marginTop: embedded ? 0 : 2 }}>
        <Grid2 size={embedded ? { xs: 12, md: 12 } : { xs: 12, md: 8 }}>
          <Box>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="media tabs"
              sx={{
                '& .MuiTabs-indicator': { display: 'none' },
                '& .MuiTab-root': {
                  minWidth: 150,
                  padding: '8px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px 4px 0 0',
                  '&.Mui-selected': {
                    backgroundColor: 'white',
                    border: 'none',
                    '&:focus': {
                      outline: 'none',
                    },
                  },
                  '&:focus': {
                    outline: 'none',
                  },
                  '&:focus-visible': {
                    outline: 'none',
                  },
                },
              }}
            >
              <Tab label="Recommended" sx={{ marginBottom: '0px' }} />
              <Tab label="Business Images" sx={{ marginBottom: '0px' }} />
              <Tab label="Your Content" sx={{ marginBottom: '0px' }} />
              {/* <Tab label="Stock" sx={{ marginBottom: '0px' }} /> */}
            </Tabs>
          </Box>
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 2,
              borderTopLeftRadius: 0,
              padding: 2.5,
              height: embedded ? '70vh' : '77.1vh',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
              borderTop: '0px',
              borderLeft: '0px',
            }}
          >
            <Box sx={{ flex: 1, mt: 0 }}>
              <TabPanel value={tabValue} index={TAB_RECOMMENDED}>
                {isLoadingRecommended ? (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: embedded ? '55vh' : '65vh',
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : (
                  <RecommendedMediaContent
                    media={recommendedMedia}
                    selectedIndex={selectedRecommendedIndex}
                    onSelectMedia={handleSelectRecommendedMedia}
                    mediaType={mediaType}
                    showSize={!embedded}
                    embedded={embedded}
                    emptyMessage={
                      slotInfo 
                        ? 'No slot-specific recommendations found. Try general recommendations or upload your own.'
                        : recommendedData?.message || 'AI-generated media for your business will appear here.'
                    }
                  />
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={TAB_BUSINESS_IMAGES}>
                {isLoadingBusinessImages ? (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: embedded ? '55vh' : '65vh',
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : (
                  <BusinessImagesContent
                    logo={businessImagesData?.logo || []}
                    reviews={businessImagesData?.reviews || []}
                    googlePhotos={businessImagesData?.google_photos || []}
                    selectedLogoIndex={selectedLogoIndex}
                    selectedReviewIndex={selectedReviewIndex}
                    selectedGooglePhotoIndex={selectedGooglePhotoIndex}
                    onSelectLogo={handleSelectLogo}
                    onSelectReview={handleSelectReview}
                    onSelectGooglePhoto={handleSelectGooglePhoto}
                  />
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={TAB_YOUR_CONTENT}>
                {isLoading ? (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: embedded ? '55vh' : '65vh',
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : (
                  <YourMediaContent
                    media={yourMedia}
                    businessId={businessId}
                    selectedIndex={selectedYourMediaIndex}
                    onSelectMedia={handleSelectYourMedia}
                    mediaType={mediaType}
                    showSize={!embedded}
                    embedded={embedded}
                  />
                )}
              </TabPanel>

              {/* Stock tab - hidden but kept for future use */}
              {/* <TabPanel value={tabValue} index={TAB_STOCK}>
                <StockProvider
                  stockMedia={stockMedia}
                  selectedStockId={selectedStockId}
                  onSelectStockChange={handleSelectStockMedia}
                  onSearchQueryChange={setActiveSearchQuery}
                  shouldResetSearch={shouldResetStockSearch}
                  onResetSearchComplete={() => setShouldResetStockSearch(false)}
                  mediaType={mediaType}
                />
              </TabPanel> */}
            </Box>
          </Paper>
        </Grid2>

        {!embedded && (
          <Grid2 size={{ xs: 12, md: 4 }}>
            <PreviewMedia
              media={previewMedia}
              stockPreview={stockPreview}
              onDelete={handleDeleteMedia}
              isDeleting={isDeleting}
              onUseStock={tabValue === TAB_STOCK && canUseStockSearchItem ? handleUseStockMedia : undefined}
              isUsingStock={
                tabValue === TAB_STOCK && canUseStockSearchItem
                  ? (selectedStockItem as ShutterstockItem)?.media_type === 'video'
                    ? isIngestingStockVideo
                    : isIngestingStockImage
                  : false
              }
            />
          </Grid2>
        )}
      </Grid2>
    </Box>
  );

  if (embedded) {
    return mainContent;
  }

  return <DashboardV2Layout>{mainContent}</DashboardV2Layout>;
};

export default MediaManagement;