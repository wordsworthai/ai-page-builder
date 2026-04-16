import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import { Close, Public } from '@mui/icons-material';
import { format } from 'date-fns';
import {
  useGenerationConfigs,
  useSetActiveGeneration,
  useWebsitePages,
  type GenerationConfigItem,
} from '@/hooks/api';
import type { WebsitePageRead_Output } from '@/client/models/WebsitePageRead_Output';

interface ChangeActiveSiteModalProps {
  open: boolean;
  onClose: () => void;
  currentGenerationId: string | null | undefined;
}

const shortId = (id: string) => {
  if (!id) return '';
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
};

const getPageDisplayName = (page: WebsitePageRead_Output): string => {
  if (page.page_path === '/') return 'Home';
  return page.page_title || page.page_path;
};

const ChangeActiveSiteModal: React.FC<ChangeActiveSiteModalProps> = ({
  open,
  onClose,
  currentGenerationId,
}) => {
  const { data: allPages = [], isLoading: pagesLoading } = useWebsitePages();
  const [selectedPageId, setSelectedPageId] = useState<string | undefined>(undefined);

  // Sort pages: homepage first, then alphabetically by path
  const sortedPages = [...allPages].sort((a, b) => {
    if (a.page_path === '/') return -1;
    if (b.page_path === '/') return 1;
    return a.page_path.localeCompare(b.page_path);
  });

  const hasMultiplePages = sortedPages.length > 1;
  const selectedPage = sortedPages.find((p) => p.page_id === selectedPageId);
  const currentPageActiveId = selectedPage?.current_generation_id ?? null;

  const { data, isLoading: configsLoading, isError, error } = useGenerationConfigs(selectedPageId);
  const { mutateAsync: setActive, isPending: isSetting } = useSetActiveGeneration();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Initialize selected page when pages load
  useEffect(() => {
    if (sortedPages.length > 0 && !selectedPageId) {
      setSelectedPageId(sortedPages[0].page_id);
    }
  }, [sortedPages, selectedPageId]);

  // Reset selection when modal opens/closes or page changes
  useEffect(() => {
    if (open) {
      setSelectedId(currentPageActiveId);
    } else {
      setSelectedId(null);
      setSelectedPageId(undefined);
    }
  }, [open]);

  // When page tab changes, reset selected version to that page's current active
  useEffect(() => {
    setSelectedId(currentPageActiveId);
  }, [currentPageActiveId]);

  const configs = data?.configs ?? [];
  const isLoading = pagesLoading || configsLoading;
  const canConfirm =
    selectedId != null && selectedId !== currentPageActiveId && !isSetting;

  const handleConfirm = async () => {
    if (!canConfirm || !selectedId) return;
    try {
      await setActive({ generationVersionId: selectedId, pageId: selectedPageId });
      onClose();
    } catch {
      // Error snackbar handled by useSetActiveGeneration
    }
  };

  const handleClose = () => {
    if (!isSetting) onClose();
  };

  const handlePageTabChange = (_event: React.SyntheticEvent, newPageId: string) => {
    setSelectedPageId(newPageId);
  };

  const renderConfigCard = (item: GenerationConfigItem, index: number) => {
    const isCurrent = item.generation_version_id === currentPageActiveId;
    const isSelected = item.generation_version_id === selectedId;
    const versionNumber = configs.length - index; // v1 = oldest, vN = newest (configs are newest-first)
    const createdAt = item.created_at
      ? format(new Date(item.created_at), 'MMM dd, yyyy')
      : '—';

    const getBorder = () => {
      if (isSelected) return '2px solid #8067E6';
      if (isCurrent) return '2px dashed #B8B8B8';
      return '2px solid #E5E7EB';
    };

    return (
      <Card
        key={item.generation_version_id}
        onClick={() => setSelectedId(item.generation_version_id)}
        sx={{
          mb: 2,
          borderRadius: '12px',
          border: getBorder(),
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          backgroundColor: isSelected ? 'rgba(128, 103, 230, 0.06)' : undefined,
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-2px)',
          },
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <Public sx={{ fontSize: 18, color: '#8067E6' }} />
                <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                  v{versionNumber}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: '0.75rem', fontFamily: 'monospace' }}
                >
                  · {shortId(item.generation_version_id)}
                </Typography>
                {isCurrent && (
                  <Chip
                    label="Current"
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: '#E8E0FC',
                      color: '#8067E6',
                      border: '1px solid #8067E6',
                    }}
                  />
                )}
              </Box>
              {item.config?.intent && (
                <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                  Intent: {item.config.intent}
                </Typography>
              )}
              {item.config?.tone && (
                <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                  Tone: {item.config.tone}
                </Typography>
              )}
              {item.config?.color_palette_id && (
                <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                  Palette: {item.config.color_palette_id}
                </Typography>
              )}
              <Typography variant="caption" color="text.primary">
                Created {createdAt}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          maxHeight: '70vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <Typography variant="h4" fontWeight={600}>
          Change Active Site
        </Typography>
        <IconButton
          onClick={handleClose}
          disabled={isSetting}
          sx={{
            color: '#9E9E9E',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
            },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          padding: '24px',
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { background: '#F5F5F5' },
          '&::-webkit-scrollbar-thumb': { background: '#E0E0E0', borderRadius: '4px' },
        }}
      >
        {/* Page tabs - only shown when multiple pages exist */}
        {hasMultiplePages && selectedPageId && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs
              value={selectedPageId}
              onChange={handlePageTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  minHeight: 40,
                },
                '& .Mui-selected': {
                  color: '#8067E6 !important',
                  fontWeight: 600,
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#8067E6',
                },
              }}
            >
              {sortedPages.map((page) => (
                <Tab
                  key={page.page_id}
                  label={getPageDisplayName(page)}
                  value={page.page_id}
                />
              ))}
            </Tabs>
          </Box>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#8067E6' }} />
          </Box>
        ) : isError ? (
          <Alert severity="error">
            {error instanceof Error ? error.message : 'Failed to load generation configs.'}
          </Alert>
        ) : configs.length > 0 ? (
          <Box>
            <Typography variant="body2" color="text.primary" sx={{ mb: 2, mt: hasMultiplePages ? 0 : 2 }}>
              Select a version to set as the active site{hasMultiplePages && selectedPage ? ` for ${getPageDisplayName(selectedPage)}` : ''}.
            </Typography>
            {configs.map((item, index) => renderConfigCard(item, index))}
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
            }}
          >
            <Public sx={{ fontSize: 64, color: '#E0E0E0', mb: 2 }} />
            <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>
              No generations yet
            </Typography>
            <Typography variant="body2" color="text.primary" textAlign="center">
              Generate a site first; then you can switch the active site here.
            </Typography>
          </Box>
        )}
      </DialogContent>

      {configs.length > 0 && (
        <DialogActions
          sx={{
            padding: '16px 24px',
            borderTop: '1px solid #E5E7EB',
            gap: 1,
          }}
        >
          <Button
            onClick={handleClose}
            disabled={isSetting}
            sx={{ color: '#666' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={!canConfirm}
            sx={{
              backgroundColor: '#8067E6',
              '&:hover': { backgroundColor: '#6B5AC8' },
            }}
          >
            {isSetting ? (
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} sx={{ color: 'inherit' }} />
                Updating…
              </Box>
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ChangeActiveSiteModal;
