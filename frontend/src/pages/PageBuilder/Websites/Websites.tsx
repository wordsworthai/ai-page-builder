import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  OpenInNew,
  Edit,
  Schedule,
  Language,
  Visibility,
  CheckCircle,
} from '@mui/icons-material';
import { useWebsites, useWebsitePages } from '@/hooks/api/PageBuilder/Websites/usePublishing';
import { PUBLISHING_DOMAIN } from '@/config/env';

const Websites: React.FC = () => {
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: websitesData, isLoading: isLoadingWebsites } = useWebsites();
  const { data: pagesData, isLoading: isLoadingPages } = useWebsitePages(selectedWebsiteId);

  const selectedWebsite = websitesData?.websites.find(
    (w) => w.website_id === selectedWebsiteId
  );

  const handleWebsiteSelect = (websiteId: string) => {
    setSelectedWebsiteId(websiteId);
    setShowPreview(false);
  };

  const handleBack = () => {
    setSelectedWebsiteId(null);
    setShowPreview(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (isLoadingWebsites) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // No websites state
  if (!websitesData?.websites || websitesData.websites.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            No websites yet
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Create your first website from the editor
          </Typography>
          <Button variant="contained" href="/editor">
            Go to Editor
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4}>
          {selectedWebsiteId ? (
            <>
              <Breadcrumbs sx={{ mb: 2 }}>
                <Link
                  component="button"
                  variant="body1"
                  onClick={handleBack}
                  sx={{
                    cursor: 'pointer',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Websites
                </Link>
                <Typography color="text.primary">{selectedWebsite?.subdomain}</Typography>
              </Breadcrumbs>

              {/* Website Details Header */}
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box>
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Typography variant="h4" component="h1">
                      {selectedWebsite?.website_name}
                    </Typography>
                    {selectedWebsite?.is_published && (
                      <Chip
                        icon={<CheckCircle />}
                        label="Live"
                        color="success"
                        size="small"
                      />
                    )}
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Language fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {selectedWebsite?.subdomain}.{PUBLISHING_DOMAIN}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    href="/editor"
                  >
                    Edit in Editor
                  </Button>
                  {selectedWebsite?.is_published && (
                    <>
                      <Tooltip title="View Live Site">
                        <IconButton
                          color="primary"
                          onClick={() => setShowPreview(!showPreview)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Open in New Tab">
                        <IconButton
                          color="primary"
                          href={`https://${selectedWebsite.subdomain}.${PUBLISHING_DOMAIN}`}
                          target="_blank"
                        >
                          <OpenInNew />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Box>
              </Box>

              {/* Website Stats */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatDate(selectedWebsite?.created_at || null)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      Last Published
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatDate(selectedWebsite?.last_published_at || null)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      Total Pages
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {pagesData?.total || 0}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Live Preview */}
              {showPreview && selectedWebsite?.is_published && (
                <Paper
                  variant="outlined"
                  sx={{
                    mb: 3,
                    height: '600px',
                    overflow: 'hidden',
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: 'grey.100',
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Live Preview
                    </Typography>
                    <IconButton size="small" onClick={() => setShowPreview(false)}>
                      <ArrowBack fontSize="small" />
                    </IconButton>
                  </Box>
                  <iframe
                    src={`https://${selectedWebsite.subdomain}.${PUBLISHING_DOMAIN}`}
                    title="Website Preview"
                    style={{
                      width: '100%',
                      height: 'calc(100% - 48px)',
                      border: 'none',
                    }}
                  />
                </Paper>
              )}

              <Divider sx={{ mb: 3 }} />

              {/* Pages List */}
              <Box>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  Pages
                </Typography>

                {isLoadingPages ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : pagesData && pagesData.pages.length > 0 ? (
                  <Grid container spacing={2}>
                    {pagesData.pages.map((page) => (
                      <Grid item xs={12} key={page.page_id}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                          }}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                <Typography variant="subtitle1" fontWeight="600">
                                  {page.page_title}
                                </Typography>
                                {page.is_published && (
                                  <Chip
                                    label="Published"
                                    color="success"
                                    size="small"
                                    sx={{ height: 20 }}
                                  />
                                )}
                              </Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Path: <code>{page.page_path}</code>
                              </Typography>
                              {page.description && (
                                <Typography variant="body2" color="text.secondary">
                                  {page.description}
                                </Typography>
                              )}
                              <Box display="flex" alignItems="center" gap={2} mt={1}>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <Schedule fontSize="small" sx={{ fontSize: 16 }} />
                                  <Typography variant="caption" color="text.secondary">
                                    Published: {formatDate(page.last_published_at)}
                                  </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  Publish count: {page.publish_count}
                                </Typography>
                              </Box>
                            </Box>

                            {page.is_published && (
                              <Box display="flex" gap={1}>
                                <Tooltip title="View Live">
                                  <IconButton
                                    size="small"
                                    href={page.last_cloudfront_url || '#'}
                                    target="_blank"
                                    color="primary"
                                  >
                                    <OpenInNew fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            )}
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Alert severity="info">No pages found for this website.</Alert>
                )}
              </Box>
            </>
          ) : (
            // Websites List
            <>
              <Typography variant="h4" component="h1" gutterBottom>
                My Websites
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={3}>
                Manage your published websites
              </Typography>

              <Grid container spacing={3}>
                {websitesData.websites.map((website) => (
                  <Grid item xs={12} sm={6} md={4} key={website.website_id}>
                    <Paper
                      sx={{
                        p: 3,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                        },
                      }}
                      onClick={() => handleWebsiteSelect(website.website_id)}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Typography variant="h6" component="div" gutterBottom>
                            {website.website_name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                          >
                            <Language fontSize="small" />
                            {website.subdomain}.{PUBLISHING_DOMAIN}
                          </Typography>
                        </Box>
                        <Chip
                          label={website.is_published ? 'Live' : 'Draft'}
                          color={website.is_published ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Box>
                        <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                          <Schedule fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            Created: {formatDate(website.created_at)}
                          </Typography>
                        </Box>

                        {website.is_published && website.last_published_at && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Last published: {formatDate(website.last_published_at)}
                          </Typography>
                        )}
                      </Box>

                      <Box mt={2}>
                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWebsiteSelect(website.website_id);
                          }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default Websites;