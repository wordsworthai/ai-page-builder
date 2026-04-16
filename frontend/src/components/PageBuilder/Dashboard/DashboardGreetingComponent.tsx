import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { useCurrentUser } from '@/hooks';

const DashboardGreetingComponent: React.FC = () => {
  const theme = useTheme();
  const { data: currentUser } = useCurrentUser();

  const extractFirstName = (fullName: string) => {
    return fullName.trim().split(' ')[0];
  };

  return (
    <Box sx={{ mb: 1 }}>
      <Typography
        sx={{
          fontFamily: '"General Sans", sans-serif',
          fontSize: { xs: '2rem', sm: '2rem', md: '2rem' },
          fontWeight: 600,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
        }}
      >
        Have a great day, {extractFirstName(currentUser.full_name)}!
      </Typography>
    </Box>
  );
};

export default DashboardGreetingComponent;
