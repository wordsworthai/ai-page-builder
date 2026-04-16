import { Box } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";

import { SnackBarProvider } from "@/context/SnackBarContext";
import NotificationBar from "@/components/Shared/Common/NotificationBar";
import Header from "@/components/Shared/Navigation/Header";
import SignUpDialog from "@/components/Shared/SignUp/SignUpDialog";
import Footer from "@/components/Shared/Navigation/Footer";
import BackgroundImage from "@/components/Shared/Common/BackgroundImage";
import { useCurrentUser } from "@/hooks/api/Shared/Auth/useCurrentUser";

export default function MainLayout() {
  const location = useLocation();
  const { data: currentUser } = useCurrentUser();
  
  // Dashboard routes that shouldn't show the main header and footer
  const isDashboardRoute = () => {
    const hiddenPrefixes = ['/dashboard', '/puck', '/editor'];
    return hiddenPrefixes.some((prefix) => location.pathname.startsWith(prefix));
  };

  // Footer should only show on the landing page (/) when user is logged out
  const shouldShowFooter = location.pathname === '/' && !currentUser?.email;

  return (
    <SnackBarProvider>
      <NotificationBar />
      <SignUpDialog />
      {!isDashboardRoute()  && <Header />}
      <Box 
        component="main"
        sx={{
          position: "relative",
          minHeight: "100vh",
          overflow: "hidden",
        }}
      >
        {!isDashboardRoute()  && <BackgroundImage opacity={0.15} zIndex={0} />}
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Outlet />
        </Box>
      </Box>
      {shouldShowFooter && <Footer />}
    </SnackBarProvider>
  );
}
