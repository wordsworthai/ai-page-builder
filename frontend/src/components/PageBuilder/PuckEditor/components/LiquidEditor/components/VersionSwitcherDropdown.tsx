import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Menu,
  MenuItem,
  Tooltip,
  IconButton,
  Typography,
  Chip,
  CircularProgress,
  Button,
} from '@mui/material';
import { ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import {
  useGenerationConfigs,
  useWebsiteData,
  useWebsitePages,
  useSetActiveGeneration,
  type GenerationConfigItem,
} from '@/hooks/api';
import { usePreviewCompilation } from '@/hooks/api/PageBuilder/Editor/usePreviewCompilation';
import { useSnackBarContext } from '@/context/SnackBarContext';

interface VersionSwitcherDropdownProps {
  generationVersionId: string; // Currently viewing version (from route)
  disabled?: boolean;
  pageId?: string; // Filter versions to this page only
}

const shortId = (id: string) => {
  if (!id) return '';
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
};

/** Configs from API are newest-first. v1 = oldest, vN = newest. */
const getVersionNumber = (
  configs: GenerationConfigItem[],
  generationVersionId: string
): number | null => {
  const index = configs.findIndex((c) => c.generation_version_id === generationVersionId);
  if (index === -1) return null;
  return configs.length - index;
};

export const VersionSwitcherDropdown: React.FC<VersionSwitcherDropdownProps> = ({
  generationVersionId,
  disabled = false,
  pageId,
}) => {
  const navigate = useNavigate();
  const { createSnackBar } = useSnackBarContext();
  const { data: configsData, isLoading } = useGenerationConfigs(pageId);
  const { data: websiteData } = useWebsiteData();
  const { data: allPages = [] } = useWebsitePages();
  const { compilePreview, isCompiling } = usePreviewCompilation();

  // Suppress default snackbar - we'll show our own based on compilation status
  const { mutateAsync: setActive, isPending: isSettingActive } = useSetActiveGeneration({
    suppressSuccessSnackbar: true,
  });

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const configs = configsData?.configs ?? [];

  // Resolve the active generation ID for the current page (not always homepage)
  const currentActiveId = React.useMemo(() => {
    if (pageId && allPages.length > 0) {
      const page = allPages.find((p) => p.page_id === pageId);
      if (page) return page.current_generation_id ?? undefined;
    }
    // Fallback to homepage
    return websiteData?.homepage?.current_generation_id ?? undefined;
  }, [pageId, allPages, websiteData]);

  const isViewingNonActive = generationVersionId !== currentActiveId;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectVersion = (versionId: string) => {
    handleClose();
    if (versionId !== generationVersionId) {
      navigate(`/editor/${versionId}`);
    }
  };

  const handleMarkAsActive = async () => {
    if (!generationVersionId || !isViewingNonActive) return;

    try {
      const result = await setActive({ generationVersionId, pageId });
      
      if (result.needs_compilation) {
        // Version has no cached preview - compile it now since we're in the editor
        createSnackBar({
          content: 'Active site updated. Compiling preview...',
          severity: 'info',
          autoHide: true,
        });
        
        try {
          await compilePreview(generationVersionId);
          createSnackBar({
            content: 'Preview compiled successfully',
            severity: 'success',
            autoHide: true,
          });
        } catch (err) {
          // compilePreview already shows its own error snackbar
          console.error('Preview compilation failed:', err);
        }
      } else {
        createSnackBar({
          content: 'Active site updated successfully',
          severity: 'success',
          autoHide: true,
        });
      }
    } catch (err) {
      // setActive already shows its own error snackbar
      console.error('Failed to set active generation:', err);
    }
  };

  const currentVersionNumber = getVersionNumber(configs, generationVersionId);

  const renderMenuItem = (item: GenerationConfigItem, index: number) => {
    const isCurrentActive = item.generation_version_id === currentActiveId;
    const isCurrentlyViewing = item.generation_version_id === generationVersionId;
    const versionNumber = configs.length - index; // v1 = oldest, vN = newest
    const createdAt = item.created_at
      ? format(new Date(item.created_at), 'MMM dd, yyyy')
      : '—';

    return (
      <MenuItem
        key={item.generation_version_id}
        onClick={() => handleSelectVersion(item.generation_version_id)}
        selected={isCurrentlyViewing}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          py: 1.5,
          px: 2,
          minWidth: 220,
          backgroundColor: isCurrentlyViewing ? 'rgba(128, 103, 230, 0.08)' : undefined,
          '&:hover': {
            backgroundColor: isCurrentlyViewing
              ? 'rgba(128, 103, 230, 0.12)'
              : 'rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: isCurrentlyViewing ? 600 : 500,
              fontSize: '0.8rem',
              color: 'text.primary',
            }}
          >
            v{versionNumber}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              fontWeight: isCurrentlyViewing ? 600 : 400,
              color: 'text.secondary',
            }}
          >
            · {shortId(item.generation_version_id)}
          </Typography>
          {isCurrentActive && (
            <Chip
              label="Active"
              size="small"
              sx={{
                height: 18,
                fontSize: '0.65rem',
                fontWeight: 600,
                backgroundColor: '#E8E0FC',
                color: '#8067E6',
                border: '1px solid #8067E6',
              }}
            />
          )}
          {isCurrentlyViewing && !isCurrentActive && (
            <Chip
              label="Viewing"
              size="small"
              sx={{
                height: 18,
                fontSize: '0.65rem',
                fontWeight: 500,
                backgroundColor: '#E3F2FD',
                color: '#1976D2',
                border: '1px solid #1976D2',
              }}
            />
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>
          {createdAt}
        </Typography>
      </MenuItem>
    );
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {currentVersionNumber != null && (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            fontSize: '0.8rem',
            color: '#8067E6',
          }}
        >
          v{currentVersionNumber}
        </Typography>
      )}
      <Tooltip title="Change Version" arrow>
        <span>
          <IconButton
            onClick={handleClick}
            disabled={disabled || isLoading}
            size="small"
            sx={{
              padding: '1px',
              width: 18,
              height: 18,
              '&:hover': {
                backgroundColor: 'rgba(128, 103, 230, 0.08)',
              },
              '&:focus': {
                outline: 'none',
              },
              '&.Mui-focusVisible': {
                outline: 'none',
                boxShadow: 'none',
              },
            }}
          >
            {isLoading ? (
              <CircularProgress size={12} sx={{ color: '#8067E6' }} />
            ) : (
              <ChevronDown size={12} className="text-gray-500" />
            )}
          </IconButton>
        </span>
      </Tooltip>

      {isViewingNonActive && currentActiveId && (
        <Tooltip title="Set this version as the active published site" arrow>
          <span>
            <Button
              onClick={handleMarkAsActive}
              disabled={disabled || isSettingActive || isCompiling}
              size="small"
              sx={{
                minWidth: 'auto',
                padding: '2px 8px',
                fontSize: '0.7rem',
                fontWeight: 500,
                color: '#8067E6',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: 'rgba(128, 103, 230, 0.08)',
                },
              }}
            >
              {isSettingActive ? 'Setting...' : isCompiling ? 'Compiling...' : 'Mark As Active'}
            </Button>
          </span>
        </Tooltip>
      )}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            maxHeight: 300,
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
            borderRadius: '8px',
          },
        }}
      >
        {configs.length > 0 ? (
          configs.map((item, index) => renderMenuItem(item, index))
        ) : (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No versions available
            </Typography>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default VersionSwitcherDropdown;
