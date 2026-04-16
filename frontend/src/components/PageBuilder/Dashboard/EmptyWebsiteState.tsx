import React from 'react';
import { Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ComponentContainer, ComponentContent } from './ComponentContainer';
import AddIcon from '@mui/icons-material/Add';
import NoMediaYet from '@/components/PageBuilder/Media/NoMediaYet';

export const EmptyWebsiteState: React.FC = () => {
  const navigate = useNavigate();

  const handleCreateWebsite = () => {
    navigate('/create-site');
  };

  return (
    <ComponentContainer sx={{backgroundColor: '#f5f5f5'}}>
      <ComponentContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <NoMediaYet
          title="No Website Yet"
          message="Create your professional website in minutes with our AI-powered builder. Our AI will analyze your business and generate a custom website tailored to your needs."
          containerSx={{
            flex: 1,
            minHeight: 200,
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={handleCreateWebsite}
            sx={{ minWidth: 200 }}
          >
            Create Website
          </Button>
        </Box>
      </ComponentContent>
    </ComponentContainer>
  );
};

export default EmptyWebsiteState;