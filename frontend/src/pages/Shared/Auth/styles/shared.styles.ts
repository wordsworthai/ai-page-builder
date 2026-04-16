import { Box, Stack, IconButton, styled } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

/**
 * Outer container for all auth pages
 * Responsive padding with maxWidth constraint
 */
export const StyledAuthPageContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  maxWidth: "500px",
  padding: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1),
  },
}));

/**
 * Stack container for auth form content
 * Flex column layout with center alignment
 */
export const StyledAuthStack = styled(Stack)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
});

/**
 * Header and form section container
 * Full width flex column with gap
 */
export const StyledHeaderSection = styled(Box)({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "24px",
});

/**
 * Form container
 * Flex column layout with gap
 * Renders as a native form element
 */
export const StyledForm = styled("form")({
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  width: "100%",
});

/**
 * Button container with configurable justification
 */
interface StyledButtonContainerProps {
  justifyContent?: "center" | "flex-end";
}

export const StyledButtonContainer = styled(Box)<StyledButtonContainerProps>(
  ({ justifyContent = "flex-end" }) => ({
    display: "flex",
    justifyContent,
  })
);

/**
 * Container for social login buttons
 * Flex column with gap
 */
export const StyledSocialButtonsContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  width: "100%",
});

/**
 * Container for action buttons (e.g., in CheckEmail page)
 * Flex column with larger gap
 */
export const StyledActionButtonsContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  width: "100%",
});

/**
 * Icon button for password visibility toggle
 * Consistent sizing and hover behavior
 */
export const StyledIconButton = styled(IconButton)({
  padding: 0,
  minWidth: "24px",
  width: "24px",
  height: "24px",
  color: "#afafaf",
  "&:hover": {
    backgroundColor: "transparent",
  },
});

/**
 * Visibility icon wrapper
 * Consistent icon sizing
 */
export const StyledVisibilityIcon = styled(Visibility)({
  fontSize: "24px",
  width: "24px",
  height: "24px",
});

export const StyledVisibilityOffIcon = styled(VisibilityOff)({
  fontSize: "24px",
  width: "24px",
  height: "24px",
});
