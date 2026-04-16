import { Box, styled } from '@mui/material';

export const LayoutContainer = styled(Box)({
  display: 'flex',
  gap: '16px',
  height: '100%',
  width: '100%',
});

export const LeftSection = styled(Box)({
  flex: '9',
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
});

export const RightSection = styled(Box)({
  flex: '3',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  minWidth: 0,
});

export const ErrorContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  minHeight: '100%',
  width: '100%',
  padding: theme.spacing(4),
  textAlign: 'center',
}));

export const ErrorIconContainer = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.error.light + '20',
  marginBottom: theme.spacing(3),
}));

export const LoadingContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  minHeight: '200px',
  gap: '16px',
});
