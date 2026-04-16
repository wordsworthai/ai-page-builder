import { Box, Typography, styled } from '@mui/material';

export const ComponentContainer = styled(Box)(({ theme }) => ({
  background: '#FFFFFF',
  borderRadius: '12px',
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  overflow: 'auto',
  overflowX: 'hidden',
}));

export const ComponentTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#333333',
  marginBottom: theme.spacing(2),
}));

export const ComponentContent = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  color: '#999999',
  fontSize: '0.875rem',
  minHeight: 0, // Allow content to shrink and enable scrolling
}));
