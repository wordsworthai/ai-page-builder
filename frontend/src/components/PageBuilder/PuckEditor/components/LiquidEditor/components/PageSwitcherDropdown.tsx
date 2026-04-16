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
} from '@mui/material';
import { ChevronDown, Home } from 'lucide-react';
import type { WebsitePageRead_Output } from '@/client/models/WebsitePageRead_Output';

interface PageSwitcherDropdownProps {
  pages: WebsitePageRead_Output[];
  currentPageId?: string;
  disabled?: boolean;
}

const getPageDisplayName = (page: WebsitePageRead_Output): string => {
  if (page.page_path === '/') return 'Home';
  return page.page_title || page.page_path;
};

export const PageSwitcherDropdown: React.FC<PageSwitcherDropdownProps> = ({
  pages,
  currentPageId,
  disabled = false,
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const currentPage = pages.find((p) => p.page_id === currentPageId);
  const hasMultiplePages = pages.length > 1;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!disabled && hasMultiplePages) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectPage = (page: WebsitePageRead_Output) => {
    handleClose();
    if (page.page_id === currentPageId) return;
    if (!page.current_generation_id) return;
    navigate(`/editor/${page.current_generation_id}`);
  };

  // Sort pages: homepage first, then alphabetically by path
  const sortedPages = [...pages].sort((a, b) => {
    if (a.page_path === '/') return -1;
    if (b.page_path === '/') return 1;
    return a.page_path.localeCompare(b.page_path);
  });

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          fontSize: '0.8rem',
          color: '#555',
        }}
      >
        {currentPage ? getPageDisplayName(currentPage) : 'Page'}
      </Typography>

      {hasMultiplePages && (
        <>
          <Tooltip title="Switch Page" arrow>
            <span>
              <IconButton
                onClick={handleClick}
                disabled={disabled}
                size="small"
                sx={{
                  padding: '1px',
                  width: 18,
                  height: 18,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.06)',
                  },
                  '&:focus': { outline: 'none' },
                  '&.Mui-focusVisible': { outline: 'none', boxShadow: 'none' },
                }}
              >
                <ChevronDown size={12} className="text-gray-500" />
              </IconButton>
            </span>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            PaperProps={{
              sx: {
                mt: 1,
                maxHeight: 300,
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
                borderRadius: '8px',
              },
            }}
          >
            {sortedPages.map((page) => {
              const isCurrentPage = page.page_id === currentPageId;
              const isHomepage = page.page_path === '/';
              const hasGeneration = !!page.current_generation_id;

              return (
                <MenuItem
                  key={page.page_id}
                  onClick={() => handleSelectPage(page)}
                  selected={isCurrentPage}
                  disabled={!hasGeneration && !isCurrentPage}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 1.5,
                    px: 2,
                    minWidth: 200,
                    backgroundColor: isCurrentPage ? 'rgba(0, 0, 0, 0.06)' : undefined,
                    '&:hover': {
                      backgroundColor: isCurrentPage
                        ? 'rgba(0, 0, 0, 0.08)'
                        : 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  {isHomepage && <Home size={14} className="text-gray-500" />}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isCurrentPage ? 600 : 400,
                      fontSize: '0.8rem',
                      color: 'text.primary',
                    }}
                  >
                    {getPageDisplayName(page)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.7rem',
                      color: 'text.secondary',
                    }}
                  >
                    {page.page_path}
                  </Typography>
                  {isCurrentPage && (
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
                        ml: 'auto',
                      }}
                    />
                  )}
                </MenuItem>
              );
            })}
          </Menu>
        </>
      )}
    </Box>
  );
};

export default PageSwitcherDropdown;
