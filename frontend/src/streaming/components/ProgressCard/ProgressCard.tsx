/**
 * Generic progress card component for displaying streaming status in dashboard.
 * 
 * This component can be used with any streaming status type.
 */
import React, { useEffect, useState } from 'react';
import { Box, Typography, styled, keyframes } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import type { StreamingStatus } from '../../types';
import { formatElapsedTime } from '../../utils/timeUtils';
import type { CompilationStatus } from '../../types/generation';
import { getDisplayErrorMessage } from '@/utils/generationErrorDisplay';

// ============================================================================
// ANIMATIONS
// ============================================================================

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.15);
  }
`;

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const CardContainer = styled(Box)({
  width: '100%',
  height: '100%',
  minHeight: '280px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '28px 32px',
  border: '1px solid #e5e7eb',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
});

const Header = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
});

const TitleRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

const IconBox = styled(Box)({
  fontSize: '28px',
  lineHeight: 1,
});

const Title = styled(Typography)({
  fontSize: '1.375rem',
  fontWeight: 700,
  color: '#111827',
});

const ElapsedTime = styled(Typography)({
  fontSize: '1.125rem',
  fontWeight: 600,
  color: '#6b7280',
  fontVariantNumeric: 'tabular-nums',
});

const ProgressBarContainer = styled(Box)({
  height: '8px',
  backgroundColor: '#e5e7eb',
  borderRadius: '4px',
  overflow: 'hidden',
  marginBottom: '28px',
});

const ProgressBarShimmer = styled(Box)({
  height: '100%',
  width: '100%',
  background: 'linear-gradient(90deg, #8067E6 0%, #a78bfa 50%, #8067E6 100%)',
  backgroundSize: '200% 100%',
  animation: `${shimmer} 1.5s linear infinite`,
  borderRadius: '4px',
});

const ProgressBarComplete = styled(Box)({
  height: '100%',
  width: '100%',
  backgroundColor: '#22c55e',
  borderRadius: '4px',
});

const ProgressBarError = styled(Box)({
  height: '100%',
  width: '100%',
  backgroundColor: '#ef4444',
  borderRadius: '4px',
});

const CurrentStepContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '16px',
});

const PulsingDot = styled(Box)({
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  backgroundColor: '#8067E6',
  animation: `${pulse} 1.5s ease-in-out infinite`,
  flexShrink: 0,
});

const CurrentStepText = styled(Typography)({
  fontSize: '1.0625rem',
  color: '#374151',
  fontWeight: 600,
});

const StepsCompleted = styled(Typography)({
  fontSize: '0.9375rem',
  color: '#9ca3af',
  fontWeight: 500,
});

const CompletedRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

const ErrorRow = styled(Box)({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
});

const ErrorText = styled(Typography)({
  fontSize: '1rem',
  color: '#ef4444',
  lineHeight: 1.5,
});

// ============================================================================
// COMPONENT
// ============================================================================

export interface ProgressCardProps {
  /** Streaming status or compilation status */
  status: StreamingStatus | CompilationStatus;
  /** Optional click handler */
  onClick?: () => void;
}

/**
 * ProgressCard: Generic component for displaying streaming progress in dashboard
 */
export const ProgressCard: React.FC<ProgressCardProps> = ({ 
  status,
  onClick 
}) => {
  const isCompilationMode = typeof status === 'string';
  const [localElapsed, setLocalElapsed] = useState(0);
  
  // Sync elapsed time from server (for generation mode)
  useEffect(() => {
    if (!isCompilationMode) {
      const streamStatus = status as StreamingStatus;
      if (streamStatus.elapsed_seconds) {
        setLocalElapsed(streamStatus.elapsed_seconds);
      }
    }
  }, [isCompilationMode, status]);
  
  // Local timer increment
  useEffect(() => {
    if (isCompilationMode) return;
    
    const streamStatus = status as StreamingStatus;
    if (streamStatus.status === 'completed' || streamStatus.status === 'failed') {
      return;
    }
    
    const interval = setInterval(() => {
      setLocalElapsed(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isCompilationMode, status]);
  
  // Compilation mode (simple)
  if (isCompilationMode) {
    return (
      <CardContainer onClick={onClick} sx={{ cursor: onClick ? 'pointer' : 'default' }}>
        <Header>
          <TitleRow>
            <IconBox>🏗️</IconBox>
            <Title>Preparing Preview</Title>
          </TitleRow>
        </Header>
        <ProgressBarContainer>
          <ProgressBarShimmer />
        </ProgressBarContainer>
        <CurrentStepContainer>
          <PulsingDot />
          <CurrentStepText>Building your preview...</CurrentStepText>
        </CurrentStepContainer>
      </CardContainer>
    );
  }
  
  // Generation mode
  const streamStatus = status as StreamingStatus;
  const executionLog = streamStatus.execution_log || [];
  const currentNodeDisplay = streamStatus.current_node_display || streamStatus.current_node;
  const nodesCompleted = streamStatus.nodes_completed || executionLog.length;
  const isComplete = streamStatus.status === 'completed';
  const isFailed = streamStatus.status === 'failed';
  
  // Completed state
  if (isComplete) {
    return (
      <CardContainer onClick={onClick} sx={{ cursor: onClick ? 'pointer' : 'default' }}>
        <Header>
          <TitleRow>
            <IconBox>✨</IconBox>
            <Title>Website Ready!</Title>
          </TitleRow>
          <ElapsedTime>{formatElapsedTime(localElapsed)}</ElapsedTime>
        </Header>
        <ProgressBarContainer>
          <ProgressBarComplete />
        </ProgressBarContainer>
        <CompletedRow>
          <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 24 }} />
          <Typography sx={{ fontSize: '1.0625rem', color: '#22c55e', fontWeight: 600 }}>
            Generation complete • {nodesCompleted} steps
          </Typography>
        </CompletedRow>
      </CardContainer>
    );
  }
  
  // Error state
  if (isFailed) {
    return (
      <CardContainer onClick={onClick} sx={{ cursor: onClick ? 'pointer' : 'default' }}>
        <Header>
          <TitleRow>
            <IconBox>⚠️</IconBox>
            <Title>Generation Failed</Title>
          </TitleRow>
          <ElapsedTime>{formatElapsedTime(localElapsed)}</ElapsedTime>
        </Header>
        <ProgressBarContainer>
          <ProgressBarError />
        </ProgressBarContainer>
        <ErrorRow>
          <ErrorOutlineIcon sx={{ color: '#ef4444', fontSize: 24, flexShrink: 0, mt: '2px' }} />
          <ErrorText>
            {getDisplayErrorMessage(streamStatus.error_message)}
          </ErrorText>
        </ErrorRow>
      </CardContainer>
    );
  }
  
  // In progress state
  return (
    <CardContainer onClick={onClick} sx={{ cursor: onClick ? 'pointer' : 'default' }}>
      <Header>
        <TitleRow>
          <IconBox>🏗️</IconBox>
          <Title>Building Your Website</Title>
        </TitleRow>
        <ElapsedTime>{formatElapsedTime(localElapsed)}</ElapsedTime>
      </Header>
      
      <ProgressBarContainer>
        <ProgressBarShimmer />
      </ProgressBarContainer>
      
      {currentNodeDisplay && (
        <CurrentStepContainer>
          <PulsingDot />
          <CurrentStepText>{currentNodeDisplay}</CurrentStepText>
        </CurrentStepContainer>
      )}
      
      <StepsCompleted>
        {nodesCompleted} {nodesCompleted === 1 ? 'step' : 'steps'} completed
      </StepsCompleted>
    </CardContainer>
  );
};
