import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Alert,
  CircularProgress,
  Link,
  Paper,
  Collapse,
  IconButton,
  Chip,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle,
  OpenInNew,
  ExpandMore,
  Check,
  Close,
  Image as ImageIcon,
  Public,
  ContentCopy,
} from '@mui/icons-material';
import { useEditorDefaults, usePublishFromEditor, useCheckSubdomain } from '@/hooks/api/PageBuilder/Websites/usePublishing';
import { PUBLISHING_DOMAIN } from '@/config/env';
import { useUserPlan } from '@/hooks/api/Shared/Billing/usePlans';
import { useWebsiteData } from '@/hooks/api/PageBuilder/Websites/useWebsiteData';
import { PublishUpgradeDialog } from './PublishUpgradeDialog';
import { PolicyModal } from './PolicyModal';
import type { PageHtmlEntry } from '@/components/PageBuilder/Dashboard/PublishSiteContainer';

interface PublishDialogProps {
  open: boolean;
  onClose: () => void;
  htmlContent: string | null;
  pageHtmls?: PageHtmlEntry[];
  preCompletedPublishResult?: {
    cloudfront_url: string;
    subdomain: string;
    is_new_website: boolean;
    subdomain_changed: boolean;
  } | null;
}

export const PublishDialog: React.FC<PublishDialogProps> = ({
  open,
  onClose,
  htmlContent,
  pageHtmls,
  preCompletedPublishResult,
}) => {
  // State
  const [subdomain, setSubdomain] = useState('');
  const [websiteTitle, setWebsiteTitle] = useState('');
  const [description, setDescription] = useState('');
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [htmlPreviewUrl, setHtmlPreviewUrl] = useState<string | null>(null);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [subdomainValidated, setSubdomainValidated] = useState<boolean | null>(null);
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyType, setPolicyType] = useState<'terms' | 'privacy' | null>(null);

  // API hooks
  const { data: editorDefaults, isLoading: isLoadingDefaults } = useEditorDefaults();
  const publishMutation = usePublishFromEditor();
  const checkSubdomainMutation = useCheckSubdomain();
  const { data: userPlan } = useUserPlan();
  const { data: websiteData } = useWebsiteData();

  // Create a blob URL preview from HTML (used when preview_link is unavailable, e.g. editor)
  useEffect(() => {
    if (!htmlContent) {
      return;
    }
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setHtmlPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [htmlContent]);

  // Pre-fill form when defaults are loaded
  useEffect(() => {
    if (editorDefaults && open) {
      // If we have valid pending_publish_data, it should take precedence (avoid overwriting restored values)
      try {
        const raw = localStorage.getItem('pending_publish_data');
        if (raw) {
          const data = JSON.parse(raw);
          const age = Date.now() - (data.timestamp || 0);
          if (age <= 60 * 60 * 1000) {
            return;
          }
        }
      } catch {
        // fall through to editorDefaults pre-fill
      }
      if (editorDefaults.existing_website) {
        // Pre-fill with existing website data
        setSubdomain(editorDefaults.existing_website.subdomain);
        setWebsiteTitle(editorDefaults.existing_website.website_name);
        setDescription(editorDefaults.existing_website.homepage.description || '');
        setSubdomainValidated(true);
      } else {
        // Pre-fill with suggested values
        setSubdomain(editorDefaults.suggested_subdomain);
        setWebsiteTitle(editorDefaults.business_name);
        setDescription('');
        setSubdomainValidated(null);
      }
    }
  }, [editorDefaults, open]);

  // Pre-fill from pending_publish_data (restores the user's prior inputs)
  useEffect(() => {
    if (!open) {
      return;
    }
    try {
      const raw = localStorage.getItem('pending_publish_data');
      if (!raw) return;
      const data = JSON.parse(raw);
      const age = Date.now() - (data.timestamp || 0);
      if (age > 60 * 60 * 1000) return; // 1 hour
      setSubdomain(data.subdomain ?? '');
      setWebsiteTitle(data.websiteTitle ?? '');
      setDescription(data.description ?? '');
      setSubdomainValidated(null);

      // Restore favicon if present
      if (data.faviconFileBase64 && data.faviconFileName) {
        try {
          const byteCharacters = atob(data.faviconFileBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const mimeType = data.faviconFileType || 'image/png';
          const blob = new Blob([byteArray], { type: mimeType });
          const file = new File([blob], data.faviconFileName, { type: mimeType });
          setFaviconFile(file);
          setFaviconPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(blob);
          });
        } catch {
          // ignore favicon restore errors
        }
      }
    } catch {
      // ignore
    }
  }, [open]);

  // Convert HTML string to File when dialog opens
  useEffect(() => {
    if (htmlContent && open && !htmlFile) {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const file = new File([blob], 'page.html', { type: 'text/html' });
      setHtmlFile(file);
    }
  }, [htmlContent, open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      // When the upgrade dialog is showing, keep preview URL alive for the iframe.
      if (showUpgradeDialog) {
        return;
      }
      setSubdomainValidated(null);
      setAdvancedExpanded(false);
      if (faviconPreview) {
        URL.revokeObjectURL(faviconPreview);
      }
      if (htmlPreviewUrl) {
        URL.revokeObjectURL(htmlPreviewUrl);
      }
      setFaviconFile(null);
      setFaviconPreview(null);
      setHtmlPreviewUrl(null);
      setHtmlFile(null);
      setCopied(false);
    }
  }, [open, faviconPreview, htmlPreviewUrl, showUpgradeDialog]);

  useEffect(() => {
    return () => {
      if (faviconPreview) {
        URL.revokeObjectURL(faviconPreview);
      }
    };
  }, [faviconPreview]);

  useEffect(() => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainValidated(null);
      return;
    }
    if (editorDefaults?.existing_website?.subdomain === subdomain) {
      setSubdomainValidated(true);
      return;
    }
    const timer = setTimeout(() => {
      checkSubdomainMutation.mutateAsync(subdomain)
        .then(result => setSubdomainValidated(result.available))
        .catch(() => setSubdomainValidated(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [subdomain, editorDefaults?.existing_website?.subdomain]);

  const handleSubdomainChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdomain(cleaned);
    setSubdomainValidated(null);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(`www.${subdomain}.${PUBLISHING_DOMAIN}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleFaviconSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/x-icon', 'image/png', 'image/svg+xml', 'image/jpeg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid favicon file (.ico, .png, .svg, .jpg)');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        alert('Favicon size must be less than 2MB');
        return;
      }

      if (faviconPreview) {
        URL.revokeObjectURL(faviconPreview);
      }
      const previewUrl = URL.createObjectURL(file);
      setFaviconFile(file);
      setFaviconPreview(previewUrl);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64String = result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const faviconFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64String = result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handlePublish = async () => {
    const currentPlan = userPlan?.current_plan || 'free';
    if (currentPlan === 'free') {
      if (!htmlFile) {
        alert('No HTML content available to publish');
        return;
      }
      try {
        const htmlContentBase64 = await fileToBase64(htmlFile);
        let faviconFileBase64: string | undefined;
        if (faviconFile) {
          faviconFileBase64 = await faviconFileToBase64(faviconFile);
        }
        const publishData = {
          subdomain,
          websiteTitle,
          description: description || undefined,
          htmlContentBase64,
          htmlFileName: htmlFile.name,
          faviconFileName: faviconFile?.name || undefined,
          faviconFileBase64: faviconFileBase64 || undefined,
          faviconFileType: faviconFile?.type || undefined,
          timestamp: Date.now(),
          return_path: window.location.pathname,
        };
        localStorage.setItem('pending_publish_data', JSON.stringify(publishData));
        setShowUpgradeDialog(true);
        onClose();
        return;
      } catch (error) {
        console.error('Failed to store publish data:', error);
        alert('Failed to prepare publish data. Please try again.');
        return;
      }
    }

    if (!htmlFile) {
      alert('No HTML content available to publish');
      return;
    }

    try {
      await publishMutation.mutateAsync({
        subdomain,
        websiteTitle,
        htmlFile,
        description: description || undefined,
        faviconFile: faviconFile || undefined,
        pageHtmls,
      });
      localStorage.removeItem('pending_publish_data');
    } catch (error) {
      // Error handled by mutation
      console.error('Publish error:', error);
    }
  };

  const handleClose = () => {
    publishMutation.reset();
    onClose();
  };

  const handlePolicyLinkClick = (type: 'terms' | 'privacy') => {
    setPolicyType(type);
    setShowPolicyModal(true);
  };

  const handlePolicyModalClose = () => {
    setShowPolicyModal(false);
    setPolicyType(null);
  };

  const injectTailwindScript = (html: string): string => {
    const scriptTag = '<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>';
    if (html.includes('@tailwindcss/browser@4')) {
      return html;
    }
    if (html.includes('</head>')) {
      return html.replace('</head>', `${scriptTag}\n</head>`);
    }
    if (html.includes('</body>')) {
      return html.replace('</body>', `${scriptTag}\n</body>`);
    }
    return `${scriptTag}\n${html}`;
  };

  const handleDownload = async () => {
    try {
      let htmlString: string | null = null;
      if (htmlContent) {
        htmlString = htmlContent;
      } else if (htmlFile) {
        htmlString = await htmlFile.text();
      }
      if (!htmlString) {
        alert('Nothing to download yet');
        return;
      }
      const htmlWithTailwind = injectTailwindScript(htmlString);
      const blob = new Blob([htmlWithTailwind], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'page.html';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  const isPublishing = publishMutation.isPending;
  const isSuccess = (publishMutation.isSuccess && publishMutation.data) || preCompletedPublishResult;
  const successData = preCompletedPublishResult || publishMutation.data;
  const existingWebsite = editorDefaults?.existing_website;

  // Calculate time since last edit
  const getTimeSinceLastEdit = () => {
    if (!existingWebsite?.homepage.last_published_at) {
      return 'Not published yet';
    }

    const lastPublished = new Date(existingWebsite.homepage.last_published_at);
    const now = new Date();
    const diffMs = now.getTime() - lastPublished.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <>
      {!showUpgradeDialog && (
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 2,
              maxHeight: '90vh',
            },
          }}
        >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" component="div" fontWeight="600">
          Take your website live
        </Typography>
      </DialogTitle>

      <DialogContent>
        {isLoadingDefaults ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : isSuccess ? (
          // Success State
          <Box sx={{ py: 2 }}>
            <Box display="flex" justifyContent="center" mb={3}>
              <CheckCircle sx={{ fontSize: 80, color: '#8E94F2' }} />
            </Box>

            <Typography variant="h5" align="center" gutterBottom fontWeight="600" color="text.primary">
              {successData?.is_new_website
                ? 'Website Published!'
                : 'Website Updated!'}
            </Typography>

            <Typography variant="body1" color="text.primary" align="center" paragraph>
              Your website is now live and accessible to everyone.
            </Typography>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: 'background.default',
                borderRadius: 2,
                mb: 2,
                boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.16)',
              }}
            >
              <Typography variant="subtitle2" color="text.primary" gutterBottom fontWeight="500">
                Your website is live at:
              </Typography>
              <Link
                href={successData?.cloudfront_url || ''}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontWeight: 'medium',
                  wordBreak: 'break-all',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                <OpenInNew fontSize="small" />
                {successData?.cloudfront_url}
              </Link>
            </Paper>

            <Alert severity="info" sx={{ mb: 2, bgcolor: '#434775' }}>
              <Typography variant="body2">
                Changes typically appear within 1–5 minutes after CloudFront cache invalidation.
              </Typography>
            </Alert>

            {successData?.subdomain_changed && (
              <Alert severity="warning">
                <Typography variant="body2">
                  Your subdomain was changed. Old links will no longer work.
                </Typography>
              </Alert>
            )}
          </Box>
        ) : (
          <Box sx={{ mt: 1 }}>
            {/* Website Title Section */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 3,
                boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.16)',
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle1" gutterBottom fontWeight="600">
                {websiteTitle || editorDefaults?.business_name || 'Your Website'}
              </Typography>

              <Typography variant="body2" color="text.primary" fontWeight="500" sx={{ mb: 0.5 }}>
                Last edited: {getTimeSinceLastEdit()}
              </Typography>
              <Typography variant="body2" color="text.primary" fontWeight="500" sx={{ mb: 1 }}>
                Last published: {existingWebsite?.homepage.last_published_at
                  ? new Date(existingWebsite.homepage.last_published_at).toLocaleDateString()
                  : 'Not published yet'}
              </Typography>
              <Typography variant="caption" color="text.primary" fontWeight="500">
                *You can edit your website later and republish anytime
              </Typography>
            </Paper>

            {/* Website Address Section */}
            <Box mb={3}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 3,
                  boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.16)',
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle1" gutterBottom fontWeight="600">
                  Website address
                </Typography>
                <Typography variant="caption" color="text.primary" fontWeight="500" display="block" mb={2}>
                  *This will be the link you share with customers
                </Typography>

                <Typography variant="body2" gutterBottom color="text.primary" fontWeight="500">
                  Choose your website name
                </Typography>

                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Typography variant="body2" color="text.primary" fontWeight="500">
                    www.
                  </Typography>
                  <TextField
                    value={subdomain}
                    onChange={(e) => handleSubdomainChange(e.target.value)}
                    placeholder="websitename"
                    size="small"
                    fullWidth
                    disabled={isPublishing}
                    InputProps={{
                      endAdornment: subdomainValidated !== null && (
                        <InputAdornment position="end">
                          {subdomainValidated ? (
                            <Check color="success" fontSize="small" />
                          ) : (
                            <Close color="error" fontSize="small" />
                          )}
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Typography variant="body2" color="text.primary" fontWeight="500" >
                    .{PUBLISHING_DOMAIN}
                  </Typography>
                </Box>

                {subdomainValidated !== null && (
                  <Typography
                    variant="caption"
                    color={subdomainValidated ? 'success.main' : 'error.main'}
                    display="block"
                    mb={1}
                    fontWeight="500"
                  >
                    {subdomainValidated ? 'Looks Good' : 'Subdomain not available'}
                  </Typography>
                )}

                {subdomain && (
                  <Box
                    sx={{
                      mt: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.primary" fontWeight="500" display="block">
                        Your website will be available at
                      </Typography>
                      <Link
                        href={`https://www.${subdomain}.${PUBLISHING_DOMAIN}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'none',
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        www.{subdomain}.{PUBLISHING_DOMAIN}
                      </Link>
                    </Box>
                    <Tooltip title={copied ? 'Copied!' : 'Copy URL'}>
                      <IconButton
                        onClick={handleCopyUrl}
                        size="small"
                        sx={{
                          color: copied ? 'success.main' : 'text.secondary',
                          '&:hover': {
                            color: 'primary.main',
                          },
                        }}
                      >
                        {copied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Paper>
            </Box>

            {/* Advanced Details Section */}
            <Box mb={2}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 3,
                  boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.16)',
                  borderRadius: 2,
                }}
              >
                <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                onClick={() => setAdvancedExpanded(!advancedExpanded)}
                sx={{
                  cursor: 'pointer',
                }}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight="600">
                    Advanced details
                  </Typography>
                  <Typography variant="caption" color="text.primary" fontWeight="500">
                    *Auto-filled for you
                  </Typography>
                </Box>
                <IconButton size="small">
                  <ExpandMore
                    sx={{
                      transform: advancedExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s',
                    }}
                  />
                </IconButton>
              </Box>

              <Collapse in={advancedExpanded}>
                <Box sx={{ mt: 2 }}>
                  {/* Site Title */}
                  <Typography variant="body2" gutterBottom fontWeight="500">
                    Site Title
                  </Typography>
                  <TextField
                    value={websiteTitle}
                    onChange={(e) => setWebsiteTitle(e.target.value)}
                    placeholder={editorDefaults?.business_name || 'websitename'}
                    fullWidth
                    size="small"
                    disabled={isPublishing}
                    sx={{ mb: 2 }}
                  />

                  {/* Short Description */}
                  <Typography variant="body2" gutterBottom fontWeight="500">
                    Short Description
                  </Typography>
                  <TextField
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Two line long description"
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    disabled={isPublishing}
                    sx={{ mb: 2 }}
                  />

                  {/* Favicon */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom fontWeight="500">
                      Favicon
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<ImageIcon />}
                        disabled={isPublishing}
                        size="small"
                      >
                        {faviconFile ? 'Change' : 'Add'}
                        <input
                          type="file"
                          hidden
                          accept=".ico,.png,.svg,.jpg,.jpeg"
                          onChange={handleFaviconSelect}
                        />
                      </Button>
                      {faviconFile && (
                        <Box display="flex" alignItems="center" gap={1.5}>
                          {faviconPreview && (
                            <Box
                              component="img"
                              src={faviconPreview}
                              alt="Favicon preview"
                              sx={{
                                width: 64,
                                height: 64,
                                objectFit: 'fill',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                bgcolor: 'background.paper',
                              }}
                            />
                          )}
                          <Chip
                            label={faviconFile.name}
                            onDelete={() => {
                              if (faviconPreview) {
                                URL.revokeObjectURL(faviconPreview);
                              }
                              setFaviconFile(null);
                              setFaviconPreview(null);
                            }}
                            size="small"
                          />
                        </Box>
                      )}
                    </Box>
                    <Typography variant="caption" color="text.primary" display="block" mt={0.5}>
                      Recommended: 32x32px or 64x64px
                    </Typography>
                  </Box>
                </Box>
              </Collapse>
              </Paper>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, flexDirection: 'column', gap: 1 }}>
        {isSuccess ? (
          <Button onClick={handleClose} variant="contained" fullWidth size="large">
            Done
          </Button>
        ) : (
          <>
            <Button
              onClick={handlePublish}
              variant="contained"
              fullWidth
              size="large"
              disabled={!subdomain || !websiteTitle || !htmlFile || isPublishing || subdomainValidated === false}
              startIcon={isPublishing ? <CircularProgress size={20} color="inherit" /> : <Public />}
              sx={{
                bgcolor: '#434775',
                '&:disabled': {
                  bgcolor: 'grey.300',
                },
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              {isPublishing ? 'Publishing...' : 'Publish'}
            </Button>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', width: '100%', mt: 1 }}>
              <Link
                component="button"
                onClick={(e) => {
                  e.preventDefault();
                  handlePolicyLinkClick('terms');
                }}
                sx={{
                  color: '#000000',
                  textDecoration: 'none',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: 'primary.main',
                  },
                }}
              >
                Terms of Service
              </Link>
              <Link
                component="button"
                onClick={(e) => {
                  e.preventDefault();
                  handlePolicyLinkClick('privacy');
                }}
                sx={{
                  color: '#000000',
                  textDecoration: 'none',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: 'primary.main',
                  },
                }}
              >
                Privacy Policy
              </Link>
            </Box>
          </>
        )}
      </DialogActions>
        </Dialog>
      )}

      {/* Upgrade Dialog for Free Users */}
      <PublishUpgradeDialog
        open={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        preview_link={websiteData?.homepage?.preview_link || htmlPreviewUrl || undefined}
      />

      {/* Policy Modal */}
      <PolicyModal
        open={showPolicyModal}
        onClose={handlePolicyModalClose}
        policyType={policyType}
      />
    </>
  );
};