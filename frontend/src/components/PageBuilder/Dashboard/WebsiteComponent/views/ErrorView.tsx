import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ComponentContainer, ComponentContent } from '../../ComponentContainer';
import { ErrorContainer, ErrorIconContainer } from '../Layout';
import { getDisplayErrorMessage, isTechnicalErrorMessage } from '@/utils/generationErrorDisplay';

interface ErrorViewProps {
  errorMessage: string | null;
  lastSuccessfulGenerationId: string | null;
  isRetrying: boolean;
  onRetry: () => void;
  onGoToLastVersion: () => void;
  onStartOver: () => void;
}

const ErrorView: React.FC<ErrorViewProps> = ({
  errorMessage,
  lastSuccessfulGenerationId,
  isRetrying,
  onRetry,
  onGoToLastVersion,
  onStartOver,
}) => (
  <ComponentContainer>
    <ComponentContent>
      <ErrorContainer>
        <ErrorIconContainer>
          <ErrorOutlineIcon sx={{ fontSize: 40, color: 'error.main' }} />
        </ErrorIconContainer>
        <Typography variant="h5" gutterBottom fontWeight={600}>
          Something Went Wrong
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400 }}>
          {getDisplayErrorMessage(errorMessage)}
        </Typography>
        {isTechnicalErrorMessage(errorMessage) && errorMessage && (
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
            {isRetrying ? 'Retrying...' : 'Retry'}
          </Button>
          {lastSuccessfulGenerationId && (
            <Button variant="outlined" onClick={onGoToLastVersion}>
              Last Version
            </Button>
          )}
          <Button variant="contained" onClick={onStartOver}>
            Start Over
          </Button>
        </Box>
      </ErrorContainer>
    </ComponentContent>
  </ComponentContainer>
);

export default ErrorView;
