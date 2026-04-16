import React, { useState } from "react";
import { Box, styled, useTheme } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { designTokens } from "@/theme/customizations";
import { CurrentUserResponse } from "@/client";
import ContactDialog from "../Dialogs/ContactDialog";

interface HelpIconProps {
  /**
   * Size of the icon in pixels
   * @default 48
   */
  size?: number;
  /**
   * Additional CSS properties
   */
  sx?: any;
  /**
   * Click handler for the icon
   */
  onClick?: () => void;
  /**
   * Whether the icon is clickable
   * @default false
   */
  clickable?: boolean;
  /**
   * Current user (if logged in)
   */
  currentUser?: CurrentUserResponse;
}

const StyledIconContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "size" && prop !== "clickable",
})<{ size: number; clickable: boolean }>(
  ({ theme, size, clickable }) => ({
    width: size,
    height: size,
    borderRadius: "50%",
    backgroundColor: theme.palette.common.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: designTokens.shadows.md,
    position: "relative",
    transition: `all ${designTokens.animation.normal} ${designTokens.easing.standard}`,
    cursor: clickable ? "pointer" : "default",

    "& .MuiSvgIcon-root": {
      fontSize: `${size * 0.5}px`,
      color: theme.palette.primary.main,
      zIndex: 1,
    },

    ...(clickable && {
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: designTokens.shadows.lg,
        "& .MuiSvgIcon-root": {
          color: theme.palette.primary.dark,
        },
      },
      "&:active": {
        transform: "translateY(0px)",
        boxShadow: designTokens.shadows.sm,
      },
    }),
  })
);

/**
 * HelpIcon Component
 * 
 * A circular help icon with a white background, shadow, and dark blue question mark.
 * Based on the Figma design specification.
 * 
 * @example
 * ```tsx
 * <HelpIcon size={48} />
 * <HelpIcon size={32} clickable onClick={() => console.log('Help clicked')} />
 * ```
 */
export const HelpIcon: React.FC<HelpIconProps> = ({
  size = 48,
  sx,
  onClick,
  clickable = false,
  currentUser,
}) => {
  const theme = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <StyledIconContainer
        size={size}
        clickable={clickable || !!onClick || true}
        onClick={handleClick}
        sx={sx}
        data-node-id="3524:736"
      >
        <HelpOutlineIcon />
      </StyledIconContainer>
      <ContactDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        currentUser={currentUser}
      />
    </>
  );
};

export default HelpIcon;


