/**
 * Preview iframe component - simplified version without header/edit button.
 * 
 * Displays the generated website preview in an iframe.
 * Edit and Publish actions handled by EditorPreviewContainer and PublishSiteContainer.
 */
import React from 'react';
import { Box, Typography, styled } from '@mui/material';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const IframeContainer = styled(Box)({
  width: '100%',
  height: '100%',
  border: '1px solid rgba(0, 0, 0, 0.1)',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: '#f5f5f5',
  position: 'relative'
});

const StyledIframe = styled('iframe')({
  width: '100%',
  height: '100%',
  border: 'none',
  display: 'block',
  overflow: 'hidden'
});

const LoadingOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.mode === 'dark'
    ? 'rgba(0, 0, 0, 0.7)'
    : 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(4px)',
  zIndex: 1
}));

const ErrorBox = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: '32px',
  textAlign: 'center'
});

// ============================================================================
// TYPES
// ============================================================================

interface PreviewIframeProps {
  previewLink: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const PreviewIframe: React.FC<PreviewIframeProps> = ({
  previewLink
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <IframeContainer>
      {isLoading && (
        <LoadingOverlay>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading preview...
            </Typography>
          </Box>
        </LoadingOverlay>
      )}

      {hasError ? (
        <ErrorBox>
          <Box>
            <Typography variant="h6" gutterBottom>
              ⚠️ Preview Unavailable
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Unable to load preview.
            </Typography>
          </Box>
        </ErrorBox>
      ) : (
        <StyledIframe
          src={previewLink}
          title="Website Preview"
          sandbox="allow-same-origin allow-scripts allow-forms"
          scrolling="no"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      )}
    </IframeContainer>
  );
};

export default PreviewIframe;