import { Box, styled } from "@mui/material";
import sectionBg from "@/assets/section-bg.jpg";

interface BackgroundImageProps {
  opacity?: number;
  zIndex?: number;
  greyTint?: boolean;
}

const BackgroundImageBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'greyTint' && prop !== 'opacity' && prop !== 'zIndex',
})<{ opacity: number; zIndex: number; greyTint: boolean }>(
  ({ opacity, zIndex, greyTint }) => ({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url(${sectionBg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    opacity: opacity,
    pointerEvents: "none",
    zIndex: zIndex,
    ...(greyTint && {
      "&::after": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(128, 128, 128, 0.2)",
        pointerEvents: "none",
      },
    }),
  })
);

/**
 * Reusable background image component
 * Used across multiple pages for consistent background styling
 */
export default function BackgroundImage({
  opacity = 0.15,
  zIndex = -1,
  greyTint = false,
}: BackgroundImageProps) {
  return <BackgroundImageBox opacity={opacity} zIndex={zIndex} greyTint={greyTint} />;
}


