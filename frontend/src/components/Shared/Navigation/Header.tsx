import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import {
  List,
  SwipeableDrawer,
  alpha,
  styled,
  useTheme,
  Button
} from "@mui/material";
import {
  Close,
} from "@mui/icons-material";
import { useCurrentUser } from "@/hooks/api/Shared/Auth/useCurrentUser";
import wwai_logo_white_bg from "@/assets/wwai_logo_white_bg.png";

const ModernAppBar = styled(AppBar)(({ theme }) => ({
  position: "fixed",
  background: "transparent",
  boxShadow: "none",
  zIndex: theme.zIndex.appBar,
}));

const StyledContainer = styled(Container)(({ theme }) => ({
  "&.MuiContainer-root": {
    [theme.breakpoints.up("lg")]: {
      maxWidth: "unset !important",
    },
  },
}));

const SignUpButton = styled(Button)({
  backgroundColor: "#FFFFFF",
  color: "#757bc8",
  fontWeight: 600,
  fontSize: "14px",
  letterSpacing: "-0.28px",
  textTransform: "none",
  borderRadius: "4px",
  padding: "14px 16px",
  boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.08), 0px 1px 2px rgba(0, 0, 0, 0.05)",
  border: "none",
  transition: "all 0.2s ease-out",
  "&:hover": {
    backgroundColor: "#FFFFFF",
    opacity: 0.9,
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.12), 0px 1px 3px rgba(0, 0, 0, 0.08)",
  },
});

export default function NavBar() {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const location = useLocation();

  const { data: currentUser } = useCurrentUser();

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const iOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Show navbar when user is logged out, hide when logged in
  const shouldShowNavbar = !currentUser?.email;

  // Check if we're on auth layout routes (login or signup)
  const isAuthRoute = location.pathname === "/login" || location.pathname === "/signup";

  // Don't render at all if user is logged in
  if (!shouldShowNavbar) {
    return null;
  }

  return (
    <ModernAppBar 
      elevation={0}
    >
      <StyledContainer maxWidth="lg" sx={{ pl: 0, pr: { xs: 2, md: 3 } }}>
        <Toolbar 
          disableGutters 
          sx={{ 
            minHeight: { xs: 70, md: 80 },
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            pl: 0,
          }}
        >
          {/* Logo - All screens - Extreme left */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              transition: "transform 0.2s ease-out",
              "&:hover": {
                transform: "scale(1.05)",
              },
              mt: 4,
              ml: 2,
            }}
          >
            <a
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <img 
                src={wwai_logo_white_bg} 
                alt="WWAI" 
                style={{
                  height: "40px",
                  width: "auto",
                  maxWidth: "200px",
                  objectFit: "contain",
                }}
              />
            </a>
          </Box>

          {/* Desktop: Sign up for free Button */}
          {!isAuthRoute && (
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                mt: 3, 
                mr: 1
              }}
            >
              <Link to="/signup" style={{ textDecoration: "none" }}>
                <SignUpButton>
                  Sign up for free
                </SignUpButton>
              </Link>
            </Box>
          )}

          {/* Mobile: Menu Button */}
          {!isAuthRoute && (
            <Box
              sx={{
                display: { xs: "flex", md: "none" },
              }}
            >
            <IconButton
              size="large"
              onClick={toggleDrawer(true)}
              sx={{
                color: "text.primary",
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <MenuIcon />
            </IconButton>

            {/* Mobile Drawer */}
            <SwipeableDrawer
              anchor="top"
              open={open}
              onClose={toggleDrawer(false)}
              onOpen={toggleDrawer(true)}
              disableSwipeToOpen={false}
              disableBackdropTransition={!iOS}
              disableDiscovery={iOS}
              PaperProps={{
                sx: {
                  background: `linear-gradient(135deg, 
                    ${alpha(theme.palette.background.paper, 0.95)} 0%, 
                    ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                  backdropFilter: "blur(20px)",
                  borderRadius: `0 0 ${theme.shape.borderRadius * 1.5}px ${
                    theme.shape.borderRadius * 1.5
                  }px`,
                  ...theme.applyStyles("dark", {
                    background: `linear-gradient(135deg, 
                      ${alpha(theme.palette.primary.main, 0.2)} 0%, 
                      ${alpha(theme.palette.primary.dark, 0.15)} 50%,
                      ${alpha(theme.palette.background.paper, 0.1)} 100%)`,
                    borderBottom: `1px solid ${alpha(
                      theme.palette.primary.main,
                      0.3
                    )}`,
                  }),
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 2,
                  borderBottom: `1px solid ${alpha(
                    theme.palette.divider,
                    0.1
                  )}`,
                  ...theme.applyStyles("dark", {
                    borderBottom: `1px solid ${alpha(
                      theme.palette.primary.main,
                      0.3
                    )}`,
                  }),
                }}
              >
                <a
                  href="/"
                  onClick={toggleDrawer(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <img 
                    src={wwai_logo_white_bg} 
                    alt="WWAI" 
                    style={{
                      height: "40px",
                      width: "auto",
                      maxWidth: "200px",
                      objectFit: "contain",
                    }}
                  />
                </a>
                <IconButton onClick={toggleDrawer(false)}>
                  <Close />
                </IconButton>
              </Box>

              <List sx={{ py: 2 }}>
                {!isAuthRoute && (
                  <Box sx={{ px: 3, py: 2 }}>
                    <Link to="/signup" style={{ textDecoration: "none" }}>
                      <SignUpButton
                        fullWidth
                        onClick={toggleDrawer(false)}
                      >
                        Sign up for free
                      </SignUpButton>
                    </Link>
                  </Box>
                )}
              </List>
            </SwipeableDrawer>
          </Box>
          )}
        </Toolbar>
      </StyledContainer>
    </ModernAppBar>
  );
}
