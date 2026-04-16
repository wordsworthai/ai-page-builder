import React from 'react';
import { Box, Typography, styled, keyframes } from '@mui/material';

// ============================================================================
// ANIMATIONS
// ============================================================================

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const fadeOutFast = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const fadeOutText = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const OverlayContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isFadingOut',
})<{ isFadingOut: boolean }>(({ isFadingOut }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999, // Very high z-index to be on top of everything
  animation: isFadingOut ? `${fadeOut} 1.5s ease-in-out forwards` : `${fadeIn} 0.3s ease-out`,
  pointerEvents: isFadingOut ? 'none' : 'auto',
}));

const CenteredContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isFadingOut',
})<{ isFadingOut: boolean }>(({ isFadingOut }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '24px',
  // Spinner fades out faster (0.6s) than background (1.5s)
  animation: isFadingOut ? `${fadeOutFast} 0.6s ease-in-out forwards` : 'none',
}));

const Spinner = styled(Box)({
  width: '48px',
  height: '48px',
  border: '4px solid rgba(167, 139, 250, 0.2)',
  borderTopColor: '#a78bfa',
  borderRadius: '50%',
  animation: `${spin} 0.8s linear infinite`,
});

const Title = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isFadingOut',
})<{ isFadingOut: boolean }>(({ isFadingOut }) => ({
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#6b7280', // Lighter gray instead of black for less evident fade
  textAlign: 'center',
  // Text fades out very fast (0.3s) - disappears before spinner
  animation: isFadingOut ? `${fadeOutText} 0.3s ease-in-out forwards` : 'none',
}));

const Subtitle = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isFadingOut',
})<{ isFadingOut: boolean }>(({ isFadingOut }) => ({
  fontSize: '0.9375rem',
  color: '#9ca3af', // Lighter gray for less evident fade
  textAlign: 'center',
  // Text fades out very fast (0.3s) - disappears before spinner
  animation: isFadingOut ? `${fadeOutText} 0.3s ease-in-out forwards` : 'none',
}));

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface CheckingStatusOverlayProps {
  /**
   * Whether the overlay is currently fading out
   */
  isFadingOut?: boolean;
}

/**
 * CheckingStatusOverlay: Full-screen white overlay with loader
 * 
 * Used at the Editor component level to show checking status.
 * Displays while checking generation status, then fades out after
 * a delay to reveal Puck loading in the background.
 */
export const CheckingStatusOverlay: React.FC<CheckingStatusOverlayProps> = ({
  isFadingOut = false,
}) => {
  return (
    <OverlayContainer isFadingOut={isFadingOut}>
      <CenteredContainer isFadingOut={isFadingOut}>
        <Spinner />
        <Box>
          <Title isFadingOut={isFadingOut}>Checking generation status...</Title>
          <Subtitle isFadingOut={isFadingOut} sx={{ marginTop: '8px' }}>
            Please wait
          </Subtitle>
        </Box>
      </CenteredContainer>
    </OverlayContainer>
  );
};

export default CheckingStatusOverlay;
