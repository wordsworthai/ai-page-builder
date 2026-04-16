import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Pagination,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { ShutterstockService } from '@/client';
import { MediaItem } from '@/hooks/api/PageBuilder/Media/useMedia';
import NoMediaYet from './NoMediaYet';
import { ShutterstockItem } from '@/types/media';
import MediaItemsGrid from './MediaItemsGrid';
import MediaSearchItemsGrid from './MediaSearchItemsGrid';

interface StockProviderProps {
  stockMedia?: MediaItem[];
  selectedStockId?: string | null;
  onSelectStockChange?: (item: ShutterstockItem | MediaItem | null) => void;
  onSearchQueryChange?: (searchQuery: string) => void;
  shouldResetSearch?: boolean;
  onResetSearchComplete?: () => void;
  mediaType?: 'image' | 'video';
}

const StockProvider: React.FC<StockProviderProps> = ({
  stockMedia = [],
  selectedStockId = null,
  onSelectStockChange,
  onSearchQueryChange,
  shouldResetSearch = false,
  onResetSearchComplete,
  mediaType,
}) => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ShutterstockItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchType, setSearchType] = useState<'image' | 'video'>(mediaType || 'image');

  const perPage = 20;
  const hasSearchQuery = Boolean(searchQuery.trim());
  const stockLibraryMedia = useMemo(
    () => (stockMedia || []).filter((item) => item.source === 'stock' && (!mediaType || item.media_type === mediaType)),
    [stockMedia, mediaType]
  );
  const hasStockLibrary = stockLibraryMedia.length > 0;

  const resetSearchState = useCallback(
    (options?: { clearSelection?: boolean }) => {
      setResults([]);
      setTotal(0);
      setPage(1);
      setError(null);
      setHasSearched(false);
      setSearchQuery('');
      if (options?.clearSelection) {
        onSelectStockChange?.(null);
      }
      onSearchQueryChange?.('');
    },
    [onSearchQueryChange, onSelectStockChange]
  );

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    if (!hasSearchQuery) return;
    runSearch(value, searchType);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);

    if (!value.trim()) {
      resetSearchState({ clearSelection: true });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectSearchItem = (item: ShutterstockItem) => {
    onSelectStockChange?.(item);
  };

  const handleSelectLibraryItem = (item: MediaItem) => {
    onSelectStockChange?.(item);
  };

  const handleSearchTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: 'image' | 'video' | null
  ) => {
    if (!value) return;
    setSearchType(value);
    if (hasSearchQuery) {
      runSearch(1, value);
    }
  };

  const handleSubmit = () => {
    runSearch(1, searchType);
  };

  const filteredResults = useMemo(() => {
    if (mediaType) {
      return results.filter((item) => item.media_type === mediaType);
    }
    return results;
  }, [results, mediaType]);
  
  const hasSearchResults = filteredResults.length > 0;
  const pageCount = hasSearchQuery ? Math.max(1, Math.ceil(total / perPage)) : 1;
  const showSearchResults = hasSearchQuery && hasSearched;

  useEffect(() => {
    if (hasSearchQuery || !hasStockLibrary) return;

    const selectedInLibrary = selectedStockId
      ? stockLibraryMedia.some((item) => item._id === selectedStockId)
      : false;

    if (!selectedInLibrary) {
      const first = stockLibraryMedia[0];
      onSelectStockChange?.(first);
    }
  }, [hasSearchQuery, hasStockLibrary, selectedStockId, stockLibraryMedia, onSelectStockChange]);

  useEffect(() => {
    if (!shouldResetSearch) return;
    resetSearchState({ clearSelection: true });
    onResetSearchComplete?.();
  }, [onResetSearchComplete, resetSearchState, shouldResetSearch]);

  const runSearch = async (pageToLoad: number, type: 'image' | 'video' = searchType) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setResults([]);
      setTotal(0);
      setPage(1);
      setError(null);
      onSelectStockChange?.(null);
      return;
    }
    setHasSearched(true);
    setLoading(true);
    setError(null);
    onSearchQueryChange?.(trimmedQuery);
    try {
      const response =
        type === 'video'
          ? await ShutterstockService.searchVideosApiShutterstockVideosSearchGet(
              trimmedQuery,
              pageToLoad,
              perPage
            )
          : await ShutterstockService.searchImagesApiShutterstockImagesSearchGet(
              trimmedQuery,
              pageToLoad,
              perPage
            );
      const data = response?.data ?? [];
      setResults(data);
      setTotal(response?.total_count ?? 0);
      setPage(pageToLoad);
      if (data.length > 0) {
        onSelectStockChange?.(data[0]);
      } else {
        onSelectStockChange?.(null);
      }
    } catch (err: any) {
      const entity = type === 'video' ? 'videos' : 'images';
      setError(err?.message || `Failed to fetch ${entity}`);
      setResults([]);
      setTotal(0);
      onSelectStockChange?.(null);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '74vh',
        gap: 2,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <TextField
          fullWidth
          placeholder="Search stock media"
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          variant="outlined"
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#EFEFEF',
              '& fieldset': {
                borderColor: 'transparent',
              },
              '&:hover fieldset': {
                borderColor: 'transparent',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'transparent',
              },
            },
          }}
        />
      <Box sx={{ px: 2, display: 'flex', justifyContent: 'center' }}>
        <ToggleButtonGroup
          value={searchType}
          exclusive
          onChange={handleSearchTypeChange}
          size="small"
          color="primary"
          sx={{
            height: '40px',
            '& .MuiToggleButton-root': {
              '&.Mui-selected': {
                backgroundColor: '#faf9ff',
                outline: 'none',
                border: '1px dashed #d6d1f5',
                color: "#7a6ee0",
                fontWeight: '600'
              },
              '&.Mui-selected:hover': {
                backgroundColor: '#faf9ff',
                outline: 'none',
              },
              '&:hover': {
                backgroundColor: '#f5f5f5',
                outline: 'none',
              },
            },
          }}
        >
          {(!mediaType || mediaType === 'image') && (
            <ToggleButton value="image" aria-label="image">
              Image
            </ToggleButton>
          )}
          {(!mediaType || mediaType === 'video') && (
            <ToggleButton value="video" aria-label="video">
              Video
            </ToggleButton>
          )}
        </ToggleButtonGroup>
        </Box>
      </Stack>
      <Box
        sx={{
          flex: 1,
          height: '65vh',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : showSearchResults ? (
          hasSearchResults ? (
            <MediaSearchItemsGrid
              items={filteredResults}
              selectedId={selectedStockId}
              onSelect={handleSelectSearchItem}
            />
          ) : (
            <NoMediaYet
              title="No results found"
              message="Try another search term."
              containerSx={{
                minHeight: '60vh',
              }}
            />
          )
        ) : hasStockLibrary ? (
          <MediaItemsGrid
            items={stockLibraryMedia}
            isSelected={(item) => selectedStockId === item._id}
            onSelect={handleSelectLibraryItem}
            objectFit="cover"
          />
        ) : (
          <NoMediaYet
            title="No Media Yet"
            message="Add stock media or start searching to get suggestions."
            containerSx={{
              minHeight: '60vh',
            }}
          />
        )}
      </Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ paddingTop: 1 }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2" color="text.secondary">
            Powered by
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight="bold">
            Shutterstock
          </Typography>
        </Box>
        <Pagination
          count={pageCount}
          page={page}
          onChange={handlePageChange}
          color="primary"
          size="small"
          disabled={!showSearchResults || !hasSearchResults}
        />
      </Stack>
    </Box>
  );
};

export default StockProvider;

