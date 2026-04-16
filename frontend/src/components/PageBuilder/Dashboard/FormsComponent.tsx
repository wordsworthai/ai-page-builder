import React from 'react';
import { Box, Button, styled } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ComponentContainer, ComponentTitle, ComponentContent } from './ComponentContainer';
import { ArrowForward, Description } from '@mui/icons-material';
import OverviewCard from './OverviewCard';
import NoMediaYet from '@/components/PageBuilder/Media/NoMediaYet';
import { useFormSubmissions } from '@/hooks/api/PageBuilder/Forms/useFormSubmissions';

const ViewFormDataButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(1.5),
  gap: theme.spacing(1)
}));

interface FormsComponentProps {
  isPublished?: boolean;
}

const FormsComponent: React.FC<FormsComponentProps> = ({ isPublished = false }) => {
  const navigate = useNavigate();
  const { data } = useFormSubmissions();

  const handleViewFormData = () => {
    navigate('/dashboard/forms');
  };

  if (!isPublished) {
    return (
      <ComponentContainer>
        <ComponentTitle sx={{marginBottom: "10px"}}>Forms</ComponentTitle>
        <ComponentContent>
          <NoMediaYet
            title="No Form Data Available"
            message="Publish your site to start receiving form submissions and enquiries."
            containerSx={{ height: '100%', minHeight: '150px' }}
          />
        </ComponentContent>
      </ComponentContainer>
    );
  }

  return (
    <ComponentContainer>
      <ComponentTitle sx={{marginBottom: "10px"}}>Forms</ComponentTitle>
      <ComponentContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'end', justifyContent: 'space-between' }}>
        <Box sx={{ width: '100%' }}>
          <OverviewCard 
            icon={<Description />} 
            text="Total enquiries" 
            number={data?.total_submissions ?? 0} 
          />
        </Box>
        <ViewFormDataButton 
          variant="contained" 
          color="secondary"
          onClick={handleViewFormData}
        >
          View form data
          <ArrowForward fontSize="small" />
        </ViewFormDataButton>
      </ComponentContent>
    </ComponentContainer>
  );
};

export default FormsComponent;
