import React from 'react';
import { Box, styled, Button } from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import { useNavigate } from 'react-router-dom';
import { ComponentContainer, ComponentTitle, ComponentContent } from './ComponentContainer';
import OverviewCard from './OverviewCard';
import NoMediaYet from '@/components/PageBuilder/Media/NoMediaYet';
import { 
  AccessTime,
  ArrowForward,
  People, 
  PermIdentity, 
  SystemUpdateAltOutlined
} from '@mui/icons-material';

const ViewMetricsButton = styled(Button)(({ theme }) => ({
  gap: theme.spacing(1),
  marginTop: theme.spacing(1.5)
}));

interface DataAnalyticsComponentProps {
  analyticsData?: {
    total_pageviews?: number;
    total_unique_visitors?: number;
  };
  isLoading?: boolean;
  isPublished?: boolean;
}

const DataAnalyticsComponent: React.FC<DataAnalyticsComponentProps> = ({ 
  analyticsData, 
  isLoading = false,
  isPublished = false
}) => {
  const navigate = useNavigate();

  const handleGoToMetrics = () => {
    navigate('/dashboard/published-website-analytics');
  };

  if (!isPublished) {
    return (
      <ComponentContainer>
        <ComponentTitle sx={{marginBottom: '10px'}}>Data analytics</ComponentTitle>
        <ComponentContent>
          <NoMediaYet
            title="No Analytics Available"
            message="Publish your site to start tracking analytics and visitor data."
            containerSx={{ height: '100%', minHeight: '150px' }}
          />
        </ComponentContent>
      </ComponentContainer>
    );
  }

  return (
    <ComponentContainer>
      <ComponentTitle sx={{marginBottom: '10px'}}>Data analytics</ComponentTitle>
      <ComponentContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'end', justifyContent: 'space-between' }}>
        <Box sx={{ width: '100%' }}>
          <Grid2 container spacing={2}>
            <Grid2 size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}>
              <OverviewCard 
                icon={<People />} 
                text="Total Traffic" 
                number={analyticsData?.total_pageviews?.toLocaleString() || '0'} 
                iconColor="#757BC8"
              />
            </Grid2>
            <Grid2 size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}>
              <OverviewCard 
                icon={<PermIdentity />} 
                text="Unique Visitors" 
                number={analyticsData?.total_unique_visitors?.toLocaleString() || '0'} 
                iconColor="#757BC8"
              />
            </Grid2>
            <Grid2 size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}>
              <OverviewCard 
                icon={<AccessTime />} 
                text="Avg. Time Spent" 
                number="--" 
                iconColor="#757BC8"
              />
            </Grid2>
            <Grid2 size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}>
              <OverviewCard 
                icon={<SystemUpdateAltOutlined />} 
                text="Avg. Page Depth" 
                number="--" 
                iconColor="#757BC8"
              />
            </Grid2>
          </Grid2>
        </Box>
        <ViewMetricsButton 
          variant="contained" 
          color="secondary"
          onClick={handleGoToMetrics}
        >
          Go to Metrics
          <ArrowForward fontSize="small" />
        </ViewMetricsButton>
      </ComponentContent>
    </ComponentContainer>
  );
};

export default DataAnalyticsComponent;
