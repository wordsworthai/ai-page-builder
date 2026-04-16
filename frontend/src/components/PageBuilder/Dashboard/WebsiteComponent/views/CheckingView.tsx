import React from 'react';
import { CircularProgress, Typography } from '@mui/material';
import { ComponentContainer, ComponentContent } from '../../ComponentContainer';
import { LoadingContainer } from '../Layout';

const CheckingView: React.FC = () => (
  <ComponentContainer>
    <ComponentContent>
      <LoadingContainer
        sx={{
          alignItems: 'center',
          height: '100%',
          width: '100%',
          backgroundColor: '#e0e0e0',
          borderRadius: '8px',
        }}
      >
        <CircularProgress size={50} sx={{ color: '#8067E6' }} />
        <Typography variant="h4" color="text.primary">
          Loading your website...
        </Typography>
      </LoadingContainer>
    </ComponentContent>
  </ComponentContainer>
);

export default CheckingView;
