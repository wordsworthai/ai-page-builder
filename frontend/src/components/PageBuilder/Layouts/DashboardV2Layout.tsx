import React from 'react';
import {
  Box,
  IconButton,
  styled,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
} from '@mui/icons-material';
import BackgroundImage from '@/components/Shared/Common/BackgroundImage';
import DashboardV2Sidebar from './DashboardV2Sidebar';

export interface SidebarRenderProps {
  mobileOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const defaultRenderSidebar = (props: SidebarRenderProps) => (
  <DashboardV2Sidebar
    mobileOpen={props.mobileOpen}
    onClose={props.onClose}
    isMobile={props.isMobile}
  />
);

interface DashboardV2LayoutProps {
  children: React.ReactNode;
  renderSidebar?: (props: SidebarRenderProps) => React.ReactNode;
}

const MainContainer = styled(Box)(() => ({
  display: 'flex',
  width: '100%',
  height: '100vh',
  position: 'relative',
  overflow: 'auto',
}));

const ContentArea = styled(Box)(({ theme }) => ({
  width: '100%',
  flexGrow: 1,
  minWidth: 0,
  padding: theme.spacing(3),
  position: 'relative',
  zIndex: 1,
}));

const MobileMenuButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  top: theme.spacing(1.5),
  left: theme.spacing(2),
  zIndex: theme.zIndex.drawer + 1,
  background: '#FFFFFF',
  border: '1px solid rgba(0, 0, 0, 0.1)',
  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
  
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
  
  '&:hover': {
    background: 'rgba(151, 133, 233, 0.1)',
  },
}));

export default function DashboardV2Layout({ children, renderSidebar = defaultRenderSidebar }: DashboardV2LayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <MainContainer>
      <BackgroundImage opacity={0.15} zIndex={0} greyTint={true} />

      {!mobileOpen && (
        <MobileMenuButton onClick={handleDrawerToggle}>
          <MenuIcon />
        </MobileMenuButton>
      )}

      {renderSidebar({
        mobileOpen,
        onClose: handleDrawerToggle,
        isMobile,
      })}

      <ContentArea>
        {children}
      </ContentArea>
    </MainContainer>
  );
}
