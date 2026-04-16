import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Button,
  Link,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Public, Star } from '@mui/icons-material';
import { useCheckoutWithProduct } from '@/hooks/api/Shared/Billing/usePayments';
import { useSnackBarContext } from '@/context/SnackBarContext';
import { useCreditsInfo } from '@/hooks/api/Shared/Billing/useCredits';
import { PolicyModal } from './PolicyModal';

interface PublishUpgradeDialogProps {
  open: boolean;
  onClose: () => void;
  preview_link?: string | null;
}

export const PublishUpgradeDialog: React.FC<PublishUpgradeDialogProps> = ({
  open,
  onClose,
  preview_link,
}) => {
  const { checkoutWithProduct, isLoading: checkoutLoading } = useCheckoutWithProduct();
  const { createSnackBar } = useSnackBarContext();
  const { data: creditsInfo } = useCreditsInfo();
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyType, setPolicyType] = useState<'terms' | 'privacy' | null>(null);
  const [iframeLoading, setIframeLoading] = useState(!!preview_link);

  useEffect(() => {
    setIframeLoading(!!preview_link);
  }, [preview_link]);

  const handleSubscribeToBasic = () => {
    try {
      let returnPath = '/dashboard';
      try {
        const raw = localStorage.getItem('pending_publish_data');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.return_path) {
            returnPath = parsed.return_path;
          }
        }
      } catch {
        // use default
      }
      const origin = window.location.origin;
      const success_url = `${origin}${returnPath}?open_publish_modal=true&session_id={CHECKOUT_SESSION_ID}`;
      const cancel_url = `${origin}${returnPath}`;
      checkoutWithProduct('basic', { success_url, cancel_url });
    } catch (error) {
      createSnackBar({
        content: 'Failed to start checkout. Please try again.',
        severity: 'error',
      });
    }
  };

  const handlePolicyLinkClick = (type: 'terms' | 'privacy') => {
    setPolicyType(type);
    setShowPolicyModal(true);
  };

  const handlePolicyModalClose = () => {
    setShowPolicyModal(false);
    setPolicyType(null);
  };

  const currentCredits = creditsInfo?.balance ?? 0;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        <DialogContent sx={{ p: 2 }}>
          {/* Header Image/Preview */}
          <Box
            sx={{
              width: '100%',
              height: 270,
              bgcolor: '#D9D9D9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {preview_link ? (
              <>
                <iframe
                  src={preview_link}
                  style={{
                    width: '200%',
                    height: '100%'
                  }}
                  title="Website Preview"
                  sandbox="allow-scripts allow-same-origin"
                  onLoad={() => setIframeLoading(false)}
                />
                {iframeLoading && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1.5,
                      bgcolor: '#D9D9D9',
                    }}
                  >
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary" fontWeight="500">
                      Loading your site
                    </Typography>
                  </Box>
                )}
              </>
            ) : null}
          </Box>

          {/* Content */}
          <Box sx={{ p: 3, pt: 2.5 }}>
            {/* Title */}
            <Typography
              variant="h6"
              align="center"
              fontWeight="600"
              sx={{ mb: 1 }}
              color="text.primary"
            >
              Go live with your website in 2 mins
            </Typography>

            {/* Subtitle */}
            <Typography
              variant="body2"
              align="center"
              color="text.primary"
              sx={{ mb: 2 }}
              fontWeight="500"
            >
              Subscribe to Basic to publish your site and get 100 credits for more generations.
            </Typography>

            {/* Current Credits Display */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="caption" color="text.primary" fontWeight="600">
                Current credits: {currentCredits}
              </Typography>
            </Box>

            {/* Basic Plan Card */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                p: 2,
                borderRadius: 2,
                bgcolor: '#8E94F2',
                color: 'white',
                mb: 1
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Star />
                <Typography variant="h6" fontWeight="600">Basic Plan</Typography>
              </Box>
              <Typography variant="h4" fontWeight="700">$9.99 / month</Typography>
              <Chip 
                label="+100 Credits" 
                size="medium" 
                sx={{ 
                  mt: 1.5, 
                  fontWeight: 600,
                }} 
              />
            </Box>

            {/* Cancel Anytime Note */}
            <Typography
              variant="caption"
              color="text.primary"
              align="center"
              display="block"
              fontWeight="500"
              sx={{ mb: 3 }}
            >
              *Cancel anytime
            </Typography>

            {/* CTA Button */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleSubscribeToBasic}
              disabled={checkoutLoading}
              startIcon={checkoutLoading ? <CircularProgress size={20} color="inherit" /> : <Public />}
              sx={{
                bgcolor: '#434775',
                '&:hover': {
                  bgcolor: '#363963',
                },
                '&:disabled': {
                  bgcolor: '#434775',
                  opacity: 0.6,
                },
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 2,
                mb: 2,
              }}
            >
              {checkoutLoading ? 'Processing...' : 'Subscribe & Publish'}
            </Button>

            {/* Footer Links */}
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
          </Box>
        </DialogContent>
      </Dialog>

      {/* Policy Modal */}
      <PolicyModal
        open={showPolicyModal}
        onClose={handlePolicyModalClose}
        policyType={policyType}
      />
    </>
  );
};
