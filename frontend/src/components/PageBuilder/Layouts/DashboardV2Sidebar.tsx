import React, { useState } from 'react';
import {
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Dashboard,
  Edit,
  BarChart,
  Description,
  Image as ImageIcon,
  ExitToApp,
  Person,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/api/Shared/Auth/useCurrentUser';
import { useWebsiteData } from '@/hooks/api/PageBuilder/Websites/useWebsiteData';
import { useSnackBarContext } from '@/context/SnackBarContext';
import { AuthService } from '@/client';
import brandBadgeImg from '@/assets/wwai_badge_no_bg.png';
import { 
  isPendingCreateSiteCreditsBlocked, 
  clearPendingCreateSiteState, 
  clearCreateSiteData 
} from '@/utils/createSiteStorage';
import AbandonCreateSiteDialog from '../Dialogs/AbandonCreateSiteDialog';
import {
  SidebarContainer,
  LogoSection,
  BrandBadge,
  CompanyName,
  NavItem,
  UserSection,
  UserIcon,
  UserIdentifier,
  UserMenuTrigger,
  NavigationList,
} from '@/components/Shared/Layouts/SidebarStyles';

interface DashboardV2SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

export default function DashboardV2Sidebar({ 
  mobileOpen = false, 
  onClose, 
  isMobile = false 
}: DashboardV2SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const { data: websiteData } = useWebsiteData();
  const { createSnackBar } = useSnackBarContext();
  const queryClient = useQueryClient();
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  
  const [abandonDialogOpen, setAbandonDialogOpen] = useState(false);
  const [pendingNavigationPath, setPendingNavigationPath] = useState<string | null>(null);

  const shouldShowAbandonWarning = () => {
    return location.pathname === '/dashboard/billing' && isPendingCreateSiteCreditsBlocked();
  };

  const handleConfirmAbandon = () => {
    clearCreateSiteData();
    clearPendingCreateSiteState();
    setAbandonDialogOpen(false);
    if (pendingNavigationPath) {
      navigate(pendingNavigationPath);
      setPendingNavigationPath(null);
    }
  };

  const handleCancelAbandon = () => {
    setAbandonDialogOpen(false);
    setPendingNavigationPath(null);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const logOut = useMutation({
    mutationFn: AuthService.logoutApiAuthLogoutGet,
    onSuccess: () => {
      localStorage.clear();
      sessionStorage.clear();
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      window.location.href = '/';
    },
  });

  const isActive = (path: string, label: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    if (label === 'Website editor') {
      return location.pathname === path || location.pathname.startsWith('/editor/') || (path === '/dashboard/websites' && location.pathname === path);
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const truncateEmail = (email: string, maxLength: number = 30) => {
    if (email.length <= maxLength) return email;
    return email.substring(0, maxLength) + '...';
  };

  const getBusinessName = () => {
    return currentUser.business_name ? currentUser.business_name : 'Your Business';
  };

  const currentGenerationId = websiteData?.homepage?.current_generation_id;
  const menuItems = [
    { 
      label: 'Dashboard', 
      icon: <Dashboard />, 
      path: '/dashboard',
    },
    { 
      label: 'Website editor', 
      icon: <Edit />, 
      path: currentGenerationId ? `/editor/${currentGenerationId}` : '/dashboard/websites',
    },
    { 
      label: 'Data analytics', 
      icon: <BarChart />, 
      path: '/dashboard/published-website-analytics',
    },
    { 
      label: 'Forms & enquiries', 
      icon: <Description />, 
      path: '/dashboard/forms',
    },
    {
      label: 'Media',
      icon: <ImageIcon />,
      path: '/dashboard/media',
    },
  ];

  const sidebarContent = (
    <>
      <LogoSection onClick={() => {
        if (shouldShowAbandonWarning()) {
          setPendingNavigationPath('/dashboard');
          setAbandonDialogOpen(true);
          return;
        }
        navigate('/dashboard');
      }}>
        <BrandBadge>
          <img src={brandBadgeImg} alt="Wordsworth AI" />
        </BrandBadge>
      </LogoSection>

      <Tooltip title={getBusinessName()} placement="bottom-start" arrow>
        <CompanyName>
          {getBusinessName()}
        </CompanyName>
      </Tooltip>

      <NavigationList>
        {menuItems.map((item) => {
          const handleNavigation = () => {
            if (item.path === '/dashboard/websites' && item.label === 'Website editor') {
              createSnackBar({
                content: 'Create a Site to begin Editing',
                severity: 'info',
                autoHide: true,
              });
              return;
            }
            
            if (shouldShowAbandonWarning()) {
              setPendingNavigationPath(item.path);
              setAbandonDialogOpen(true);
              return;
            }
            
            navigate(item.path);
            if (isMobile && onClose) {
              onClose();
            }
          };
          const isItemActive = isActive(item.path, item.label);
          return (
            <NavItem
              key={item.path}
              active={isItemActive}
              onClick={handleNavigation}
            >
            <ListItemIcon
              sx={{
                ...(isItemActive && {
                  color: '#FFFFFF !important'
                }),
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
            />
          </NavItem>
          );
        })}
      </NavigationList>

      {currentUser && (
        <UserSection>
          <UserIcon />
          <Tooltip title={currentUser.email} placement="top-start" arrow>
            <UserMenuTrigger onClick={handleOpenUserMenu} role="button" aria-label="Open user menu" tabIndex={0}>
              <UserIdentifier>
                {truncateEmail(currentUser.email)}
              </UserIdentifier>
            </UserMenuTrigger>
          </Tooltip>

          <Menu
            anchorEl={anchorElUser}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            keepMounted
            transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: 2,
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  minWidth: 180,
                  mt: -1.5,
                },
              },
            }}
          >
            <MenuItem
              onClick={() => {
                navigate('/dashboard/profile-management');
                handleCloseUserMenu();
                if (isMobile && onClose) onClose();
              }}
              sx={{
                gap: 1.5,
                mx: 1,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'rgba(151, 133, 233, 0.08)',
                },
              }}
            >
              <Person fontSize="small" sx={{ color: '#8067E6' }} />
              <Typography>Profile</Typography>
            </MenuItem>
            <MenuItem
              onClick={() => {
                logOut.mutate();
                handleCloseUserMenu();
                if (isMobile && onClose) onClose();
              }}
              sx={{
                gap: 1.5,
                color: 'error.main',
                mx: 1,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'rgba(211, 47, 47, 0.08)',
                },
              }}
            >
              <ExitToApp fontSize="small" />
              <Typography>Sign out</Typography>
            </MenuItem>
          </Menu>
        </UserSection>
      )}
      
      <AbandonCreateSiteDialog
        open={abandonDialogOpen}
        onClose={handleCancelAbandon}
        onConfirmAbandon={handleConfirmAbandon}
      />
    </>
  );

  return (
    <SidebarContainer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? mobileOpen : true}
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
      }}
      sx={{
        display: { xs: mobileOpen ? 'block' : 'none', md: 'block' },
      }}
    >
      {sidebarContent}
    </SidebarContainer>
  );
}
