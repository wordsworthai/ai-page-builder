import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

interface PolicyModalProps {
  open: boolean;
  onClose: () => void;
  policyType: 'terms' | 'privacy' | null;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  open,
  onClose,
  policyType,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        },
      }}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 1,
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ mr: 1 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" fontWeight="600" sx={{ color: '#000000' }}>
            {policyType === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 2 }}>
          {policyType === 'terms' ? (
            <Box>
              <Typography variant="h6" gutterBottom fontWeight="600" sx={{ color: '#000000' }}>
                Terms of Service
              </Typography>
              <Typography variant="body2" paragraph sx={{ color: '#000000' }}>
                Welcome to our platform. By accessing and using our services, you agree to be bound by these Terms of Service. 
                Please read them carefully before using our website builder and publishing tools.
              </Typography>
              <Typography variant="body2" paragraph sx={{ color: '#000000' }}>
                Our platform provides website creation and hosting services. When you publish content through our service, 
                you retain ownership of your content but grant us a license to host and display it. You are responsible 
                for ensuring that all content you publish complies with applicable laws and does not infringe on the rights 
                of others.
              </Typography>
              <Typography variant="body2" paragraph sx={{ color: '#000000' }}>
                We reserve the right to modify or discontinue any aspect of our service at any time. We may also suspend 
                or terminate accounts that violate these terms or engage in harmful activities. Subdomains and website 
                addresses are provided on a first-come, first-served basis and may be subject to availability.
              </Typography>
              <Typography variant="body2" paragraph sx={{ color: '#000000' }}>
                You agree not to use our service for any illegal purposes, to transmit harmful code, or to interfere with 
                the operation of our platform. We are not liable for any damages resulting from your use of our service, 
                and you agree to indemnify us against any claims arising from your content or use of the service.
              </Typography>
              <Typography variant="body2" paragraph sx={{ color: '#000000' }}>
                These terms may be updated from time to time, and continued use of our service constitutes acceptance of 
                any changes. If you do not agree with these terms, please do not use our service.
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom fontWeight="600" sx={{ color: '#000000' }}>
                Privacy Policy
              </Typography>
              <Typography variant="body2" paragraph sx={{ color: '#000000' }}>
                Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your 
                personal information when you use our website builder and publishing platform.
              </Typography>
              <Typography variant="body2" paragraph sx={{ color: '#000000' }}>
                We collect information that you provide directly to us, such as when you create an account, publish a 
                website, or contact us for support. This may include your name, email address, business information, and 
                the content you create and publish through our platform.
              </Typography>
              <Typography variant="body2" paragraph sx={{ color: '#000000' }}>
                We use your information to provide, maintain, and improve our services, to process your requests, to 
                communicate with you about your account and our services, and to detect and prevent fraud or abuse. We 
                may also use aggregated, anonymized data for analytics and service improvement purposes.
              </Typography>
              <Typography variant="body2" paragraph sx={{ color: '#000000' }}>
                We do not sell your personal information to third parties. We may share your information with service 
                providers who assist us in operating our platform, but only to the extent necessary to provide our 
                services. We may also disclose information if required by law or to protect our rights and the safety of 
                our users.
              </Typography>
              <Typography variant="body2" paragraph sx={{ color: '#000000' }}>
                We implement reasonable security measures to protect your information, but no method of transmission over 
                the internet is completely secure. You are responsible for maintaining the confidentiality of your account 
                credentials. Published websites are publicly accessible, and any information you include in your published 
                content will be visible to visitors.
              </Typography>
              <Typography variant="body2" paragraph sx={{ color: '#000000' }}>
                You may access, update, or delete your account information at any time through your account settings. If 
                you have questions about this Privacy Policy, please contact us. We may update this policy from time to 
                time, and we will notify you of any material changes.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button onClick={onClose} variant="contained" fullWidth size="large">
          Back
        </Button>
      </DialogActions>
    </Dialog>
  );
};
