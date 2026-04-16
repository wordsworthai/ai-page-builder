import {
  Drawer,
  List,
  ListItemButton,
  Typography,
  Box,
  styled,
} from '@mui/material';
import { AccountCircle } from '@mui/icons-material';

export const DRAWER_WIDTH = 240;

export const SidebarContainer = styled(Drawer)(({ theme }) => ({
  width: DRAWER_WIDTH,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: DRAWER_WIDTH,
    boxSizing: 'border-box',
    background: '#FFFFFF',
    borderRadius: '12px',
    border: 'none',
    margin: theme.spacing(2),
    height: 'calc(100vh - 32px)',
    overflowX: 'hidden',
    zIndex: theme.zIndex.drawer,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',

    [theme.breakpoints.down('md')]: {
      margin: 0,
      borderRadius: 0,
      height: '100vh',
    },
  },
}));

export const LogoSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2, 2.5),
  cursor: 'pointer',
}));

export const BrandBadge = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& img': {
    display: 'block',
    width: '170px',
    height: '40px',
    objectFit: 'contain',
  },
}));

export const CompanyName = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1.25rem',
  color: '#333333',
  lineHeight: "1.2",
  padding: theme.spacing(1, 2.5),
  marginLeft: theme.spacing(0.7),
  overflowWrap: 'break-word',
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}));

export const NavItem = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active?: boolean }>(({ theme, active }) => ({
  borderRadius: '12px',
  margin: theme.spacing(0.5, 1.5),
  padding: theme.spacing(1.25, 2),
  minHeight: 48,
  transition: 'all 0.2s ease',

  ...(active ? {
    background: '#B8A9F5',
    color: '#FFFFFF !important',
    '&:hover': {
      background: '#B8A9F5 !important',
      color: '#FFFFFF !important',
    },
  } : {
    color: '#333333',
    '& .MuiListItemIcon-root': {
      color: '#333333',
    },
    '&:hover': {
      background: 'rgba(151, 133, 233, 0.08)',
    },
  }),

  '& .MuiListItemIcon-root': {
    minWidth: 30,
    '& .MuiSvgIcon-root': {
      fontSize: '1.25rem',
    },
  },

  '& .MuiListItemText-root': {
    margin: 0,
    '& .MuiTypography-root': {
      fontSize: '0.95rem',
      fontWeight: active ? 600 : 400,
    },
  },
}));

export const UserSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2, 2.5),
  marginTop: 'auto'
}));

export const UserIcon = styled(AccountCircle)(() => ({
  color: '#8067E6',
  fontSize: '1.5rem',
  marginRight: 12,
}));

export const UserIdentifier = styled(Typography)(() => ({
  fontSize: '0.875rem',
  color: '#8067E6',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
  fontWeight: 600,
}));

export const UserMenuTrigger = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  minWidth: 0,
  flex: 1,
  cursor: 'pointer',
}));

export const NavigationList = styled(List)(() => ({
  overflowY: 'auto',
}));
