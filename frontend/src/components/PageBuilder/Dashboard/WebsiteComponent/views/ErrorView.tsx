import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import { ComponentContainer, ComponentContent } from '../../ComponentContainer';
import { ErrorContainer, ErrorIconContainer } from '../Layout';
import { getDisplayErrorMessage, isTechnicalErrorMessage } from '@/utils/generationErrorDisplay';

interface ErrorViewProps {
  errorMessage: string | null;
  lastSuccessfulGenerationId: string | null;
  isRetrying: boolean;
  isCompilationError?: boolean;
  onRetry: () => void;
  onGoToLastVersion: () => void;
  onGoToEditor?: () => void;
  onStartOver: () => void;
}

const ErrorView: React.FC<ErrorViewProps> = ({
  errorMessage,
  lastSuccessfulGenerationId,
  isRetrying,
  isCompilationError = false,
  onRetry,
  onGoToLastVersion,
  onGoToEditor,
  onStartOver,
}) => {
  const title = isCompilationError ? 'Preview Failed' : 'Something Went Wrong';
  const message = isCompilationError
    ? 'Your website was generated successfully, but we couldn\'t prepare the preview. You can retry the preview or open the editor directly.'
    : getDisplayErrorMessage(errorMessage);

  return (
    <ComponentContainer>
      <ComponentContent>
        <ErrorContainer>
          <ErrorIconContainer>
            <ErrorOutlineIcon sx={{ fontSize: 40, color: isCompilationError ? 'warning.main' : 'error.main' }} />
          </ErrorIconContainer>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400 }}>
            {message}
          </Typography>
          {!isCompilationError && isTechnicalErrorMessage(errorMessage) && errorMessage && (
            <Typography
              variant="caption"
              color="text.secondary"
              component="pre"
              sx={{ mb: 2, maxWidth: 400, overflow: 'auto', textAlign: 'left' }}
            >
              Details: {errorMessage}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
              disabled={isRetrying}
            >
              {isRetrying ? 'Retrying...' : isCompilationError ? 'Retry Preview' : 'Retry'}
            </Button>
            {isCompilationError && onGoToEditor && (
              <Button variant="contained" startIcon={<EditIcon />} onClick={onGoToEditor}>
                Open Editor
              </Button>
            )}
            {!isCompilationError && lastSuccessfulGenerationId && (
              <Button variant="outlined" onClick={onGoToLastVersion}>
                Last Version
              </Button>
            )}
            <Button variant={isCompilationError ? 'outlined' : 'contained'} onClick={onStartOver}>
              Start Over
            </Button>
          </Box>
        </ErrorContainer>
      </ComponentContent>
    </ComponentContainer>
  );
};

export default ErrorView;
