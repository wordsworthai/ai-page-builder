/**
 * Styled components for StreamingPanel
 */
import { Box, Typography, styled, keyframes } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// ============================================================================
// COLORS
// ============================================================================

export const PURPLE_LIGHT = '#a78bfa';
export const PURPLE_MEDIUM = '#9f8cef';

// ============================================================================
// ANIMATIONS
// ============================================================================

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(167, 139, 250, 0.4);
  }
  50% {
    opacity: 0.8;
    box-shadow: 0 0 0 4px rgba(167, 139, 250, 0);
  }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

export const PanelContainer = styled(Box)({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#fafafa',
});

export const StatsHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 2.5),
  borderBottom: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
}));

export const StatsTitle = styled(Typography)({
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#111827',
  marginBottom: '2px',
});

export const StatsSubtitle = styled(Typography)({
  fontSize: '0.6875rem',
  color: '#9ca3af',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
});

export const StepperList = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  padding: '4px 0',
  '&::-webkit-scrollbar': {
    width: '4px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#d1d5db',
    borderRadius: '2px',
  },
});

export const StepperItem = styled(Box)<{ 
  status: 'complete' | 'current' | 'pending';
}>(({ status }) => ({
  padding: '10px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  transition: 'background-color 0.15s ease',
  borderLeft: '2px solid transparent',
  ...(status === 'current' && {
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    borderLeftColor: PURPLE_LIGHT,
  }),
  ...(status === 'pending' && {
    opacity: 0.5,
  }),
}));

export const StepHeader = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'clickable',
})<{ clickable: boolean }>(({ clickable }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  cursor: clickable ? 'pointer' : 'default',
  '&:hover': clickable ? {
    '& .expand-icon': {
      color: '#6b7280',
    },
  } : {},
}));

export const IconContainer = styled(Box)<{ status: 'complete' | 'current' | 'pending' }>(({ status }) => ({
  width: '18px',
  height: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  ...(status === 'current' && {
    animation: `${pulse} 2s ease-in-out infinite`,
    borderRadius: '50%',
  }),
}));

export const Spinner = styled(Box)({
  width: '14px',
  height: '14px',
  border: '2px solid #e5e7eb',
  borderTopColor: PURPLE_LIGHT,
  borderRadius: '50%',
  animation: `${spin} 0.8s linear infinite`,
});

export const StepContent = styled(Box)({
  flex: 1,
  minWidth: 0,
});

export const StepName = styled(Typography)<{ status: 'complete' | 'current' | 'pending' }>(({ status }) => ({
  fontSize: '0.75rem',
  fontWeight: status === 'current' ? 600 : 500,
  color: status === 'current' ? PURPLE_MEDIUM : status === 'complete' ? '#374151' : '#9ca3af',
  lineHeight: 1.3,
}));

export const StepPreview = styled(Typography)({
  fontSize: '0.6875rem',
  color: '#6b7280',
  lineHeight: 1.4,
  marginTop: '2px',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

export const ExpandIcon = styled(ExpandMoreIcon, {
  shouldForwardProp: (prop) => prop !== 'expanded',
})<{ expanded: boolean }>(({ expanded }) => ({
  fontSize: '16px',
  color: '#9ca3af',
  transition: 'transform 0.2s ease, color 0.15s ease',
  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
  flexShrink: 0,
}));

export const ExpandedContent = styled(Box)({
  marginLeft: '28px',
  marginTop: '8px',
  animation: `${fadeIn} 0.2s ease-out`,
});

export const OutputContainer = styled(Box)({
  maxHeight: '300px',
  overflowY: 'auto',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  padding: '12px 14px',
  '&::-webkit-scrollbar': {
    width: '4px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#f9fafb',
    borderRadius: '2px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#d1d5db',
    borderRadius: '2px',
    '&:hover': {
      background: '#9ca3af',
    },
  },
});

export const OutputHtml = styled(Box)({
  fontSize: '0.8125rem',
  lineHeight: 1.6,
  color: '#374151',
  '& p': {
    margin: '0 0 8px 0',
  },
  '& ul, & ol': {
    margin: '8px 0',
    paddingLeft: '20px',
  },
  '& li': {
    marginBottom: '4px',
  },
  '& div': {
    marginBottom: '6px',
  },
  '& span': {
    // Preserve inline styling from output
  },
});

export const FooterHint = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderTop: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
}));

export const HintText = styled(Typography)({
  fontSize: '0.625rem',
  color: '#9ca3af',
  textAlign: 'center',
});

export const ErrorBanner = styled(Box)(({ theme }) => ({
  margin: theme.spacing(1),
  padding: theme.spacing(1.5),
  backgroundColor: '#fef2f2',
  borderRadius: '6px',
  border: '1px solid #fecaca',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
}));
