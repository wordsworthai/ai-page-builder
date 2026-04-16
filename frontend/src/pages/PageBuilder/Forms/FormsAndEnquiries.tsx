import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Alert,
  styled,
  Chip,
} from '@mui/material';
import DashboardV2Layout from '@/components/PageBuilder/Layouts/DashboardV2Layout';
import FormSubmissionsTable from '@/components/PageBuilder/Forms/FormSubmissionsTable';
import { useFormSubmissions } from '@/hooks/api/PageBuilder/Forms/useFormSubmissions';
import NoMediaYet from '@/components/PageBuilder/Media/NoMediaYet';


const StyledTabs = styled(Tabs)(({ theme }) => ({
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: theme.spacing(1),
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
  marginBottom: theme.spacing(3),
  '& .MuiTabs-indicator': {
    backgroundColor: '#8067E6',
    height: 3,
    borderRadius: '3px 3px 0 0',
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontSize: '0.95rem',
  fontWeight: 500,
  color: '#6B7280',
  minHeight: 48,
  padding: theme.spacing(1.5, 3),
  '&.Mui-selected': {
    color: '#8067E6',
    fontWeight: 600,
  },
  '&:hover': {
    backgroundColor: 'rgba(128, 103, 230, 0.08)',
    borderRadius: '8px',
  },
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '400px',
}));

const EmptyState = styled(Paper)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(3, 3),
  borderRadius: '12px',
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
}));

const FormsAndEnquiries: React.FC = () => {
  const { data, isLoading, error } = useFormSubmissions();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (isLoading) {
    return (
      <DashboardV2Layout>
        <Box sx={{ maxWidth: 'xl', mx: 'auto', width: '100%', padding: '30px', marginTop: '3vh' }}>
          <LoadingContainer>
            <CircularProgress size={48} sx={{ color: '#8067E6' }} />
          </LoadingContainer>
        </Box>
      </DashboardV2Layout>
    );
  }

  if (error) {
    return (
      <DashboardV2Layout>
        <Box sx={{ maxWidth: 'xl', mx: 'auto', width: '100%', padding: '30px', marginTop: '3vh' }}>
          <Alert severity="error" sx={{ borderRadius: '12px' }}>
            Failed to load form submissions. Please try again later.
          </Alert>
        </Box>
      </DashboardV2Layout>
    );
  }

  const hasSubmissions = data && data.forms && data.forms.length > 0;

  return (
    <DashboardV2Layout>
      <Box
        sx={{
          maxWidth: 'xl',
          mx: 'auto',
          width: '100%',
          minWidth: 0,
          padding: '30px',
          marginTop: '3vh',
          height: 'calc(100vh - 220px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Fixed: Title - never scrolls */}
        <Typography variant="h4" fontWeight={700} sx={{ flexShrink: 0, marginBottom: 2 }}>
          Forms & Enquiries
        </Typography>

        {!hasSubmissions ? (
          <EmptyState elevation={0} sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <NoMediaYet
              title="No form submissions yet"
              message="Once visitors start filling out forms on your published website, their submissions will appear here."
              containerSx={{ minHeight: '75vh' }}
            />
          </EmptyState>
        ) : (
          <>
            {/* Fixed: Tabs row with horizontal scrollbar when many tabs */}
            <Box sx={{ flexShrink: 0, minWidth: 0, overflowX: 'auto', overflowY: 'hidden', marginBottom: 2, '&::-webkit-scrollbar': { height: 8 } }}>
              <StyledTabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{ minWidth: 'min-content' }}
              >
                {data.forms.map((form, index) => (
                  <StyledTab
                    key={form.form_id}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, whiteSpace: 'nowrap' }}>
                        {form.form_label}
                        <Chip
                          label={form.submission_count}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.75rem',
                            backgroundColor: activeTab === index ? '#8067E6' : '#E5E7EB',
                            color: activeTab === index ? '#FFFFFF' : '#6B7280',
                          }}
                        />
                      </Box>
                    }
                  />
                ))}
              </StyledTabs>
            </Box>

            {/* Scrollable: Table only - full content, no truncation */}
            {data.forms[activeTab] && (
              <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, overflow: 'auto' }}>
                <FormSubmissionsTable formGroup={data.forms[activeTab]} />
              </Box>
            )}
          </>
        )}
      </Box>
    </DashboardV2Layout>
  );
};

export default FormsAndEnquiries;