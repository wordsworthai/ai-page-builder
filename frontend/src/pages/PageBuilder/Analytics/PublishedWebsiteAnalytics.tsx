import React from 'react';
import {
  Box,
  Typography,
  Grid2 as Grid,
  useTheme,
  CircularProgress
} from '@mui/material';
import {
  People,
  ShowChart,
  PermIdentity,
  AccessTime,
  SystemUpdateAltOutlined
} from '@mui/icons-material';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { format, parseISO } from 'date-fns';

import DashboardV2Layout from '@/components/PageBuilder/Layouts/DashboardV2Layout';
import { ComponentContainer, ComponentTitle, ComponentContent } from '@/components/PageBuilder/Dashboard/ComponentContainer';
import OverviewCard from '@/components/PageBuilder/Dashboard/OverviewCard';
import { usePublishedWebsiteAnalyticsData } from '@/hooks/api/PageBuilder/Analytics/usePublishedWebsiteAnalyticsData';
import NoMediaYet from '@/components/PageBuilder/Media/NoMediaYet';

const PublishedWebsiteAnalytics: React.FC = () => {
  const theme = useTheme();
  
  // --- Data Fetching ---
  const {
    analyticsData,
    isLoadingAnalytics,
    isLoadingWebsites
  } = usePublishedWebsiteAnalyticsData();

  // --- Chart Data ---
  const getChartData = () => {
    if (!analyticsData?.trend) return [];
    
    // Default to showing traffic (pageviews)
    return analyticsData.trend.map((day: any) => ({
      date: format(parseISO(day.date), 'MMM dd'),
      value: day.pageviews,
      displayDate: format(parseISO(day.date), 'MMMM dd, yyyy')
    }));
  };

  const chartData = getChartData();

  if (isLoadingWebsites) {
    return (
      <DashboardV2Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
          <CircularProgress />
        </Box>
      </DashboardV2Layout>
    );
  }

  return (
    <DashboardV2Layout>
      <Box sx={{ maxWidth: 'xl', mx: 'auto', width: '100%', padding: "30px", marginTop: "3vh" }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Key Metrics
          </Typography>
        </Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <OverviewCard 
              icon={<People />} 
              text="Total Traffic" 
              number={analyticsData?.total_pageviews?.toLocaleString() || '0'} 
              iconColor="#757BC8"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <OverviewCard 
              icon={<PermIdentity />} 
              text="Unique Visitors" 
              number={analyticsData?.total_unique_visitors?.toLocaleString() || '0'} 
              iconColor="#757BC8"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <OverviewCard 
              icon={<AccessTime />} 
              text="Avg. Time Spent" 
              number="--" 
              iconColor="#757BC8"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <OverviewCard 
              icon={<SystemUpdateAltOutlined />} 
              text="Avg. Page Depth" 
              number="--" 
              iconColor="#757BC8"
            />
          </Grid>
        </Grid>

        <ComponentContainer>
          <ComponentContent sx={{ height: 500, position: 'relative' }}>
            {isLoadingAnalytics ? (
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : !chartData.length ? (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'text.secondary', height: '59vh' }}>
                <NoMediaYet
                  title="No data available for this period"
                  message="Visitors Data on your published website is shown here, please change the timeframe to view more data."
                  containerSx={{ width: '100%' }}
                />
              </Box>
            ) : (
              <Box sx={{ width: '100%', height: '100%', minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                    
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                      dy={10}
                      padding={{ left: 30, right: 30 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                        boxShadow: theme.shadows[2]
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={theme.palette.primary.main} 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      animationDuration={1500}
                      dot={{ r: 4, fill: theme.palette.primary.main, strokeWidth: 0 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            )}
          </ComponentContent>
        </ComponentContainer>
      </Box>
    </DashboardV2Layout>
  );
};

export default PublishedWebsiteAnalytics;