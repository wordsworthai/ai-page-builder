import { Box, Stack, styled } from "@mui/material";
import { Outlet } from "react-router-dom";

import { SnackBarProvider } from "@/context/SnackBarContext";
import NotificationBar from "@/components/Shared/Common/NotificationBar";
import Header from "@/components/Shared/Navigation/Header";
import SignUpDialog from "@/components/Shared/SignUp/SignUpDialog";
import BackgroundImage from "@/components/Shared/Common/BackgroundImage";

const GradientContainer = styled(Stack)(({ theme }) => ({
  height: "calc((1 - var(--template-frame-height, 0)) * 100dvh)",
  minHeight: "100%",
  padding: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(4),
  },
  position: "relative",
}));

export default function AuthLayout() {
  return (
    <SnackBarProvider>
      <NotificationBar />
      <SignUpDialog />
      <Header />
      <Box 
        component="main" 
        sx={{ 
          position: "relative",
          minHeight: "100vh",
          overflow: "hidden",
        }}
      >
        <BackgroundImage opacity={0.15} zIndex={0} />
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GradientContainer
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <Outlet />
          </GradientContainer>
        </Box>
      </Box>
    </SnackBarProvider>
  );
}
