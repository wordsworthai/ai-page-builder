/**
 * Upgrade Dialog Component
 * 
 * Simplified for credit-based pricing system.
 * Shows upgrade to BASIC plan for FREE users.
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Stack,
  Chip,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Close,
  Upgrade,
  CheckCircle,
  Star,
  CreditCard,
} from '@mui/icons-material';
import { StandardButton } from '@/components/Shared';
import { useCreateUpgradeCheckout } from '@/hooks/api/Shared/Billing/useUpgrades';
import { useUserPlan } from '@/hooks/api/Shared/Billing/usePlans';
import { useCreditsBalance } from '@/hooks/api/Shared/Billing/useCredits';

interface UpgradeDialogProps {
  open: boolean;
  onClose: () => void;
}

const UpgradeDialog: React.FC<UpgradeDialogProps> = ({
  open,
  onClose,
}) => {
  const { data: userPlan } = useUserPlan();
  const { data: creditsBalance } = useCreditsBalance();
  const createUpgradeCheckout = useCreateUpgradeCheckout();

  const currentPlan = userPlan?.current_plan || 'free';
  const currentCredits = creditsBalance?.balance || 0;

  const handleUpgrade = async () => {
    try {
      await createUpgradeCheckout.mutateAsync({ targetPlan: 'basic' });
    } catch (error) {
      // Error handling is done by the hook
    }
  };

  // Features for BASIC plan
  const basicFeatures = [
    '100 credits on subscription',
    'Full page website generation',
    'Website editor access',
    'Publish your website',
    'Website analytics',
    'Form submissions tracking',
    'Buy additional credit packs',
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <Upgrade color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Upgrade to Basic
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Current Status */}
          <Box>
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Current Plan
                </Typography>
                <Chip 
                  label={currentPlan.toUpperCase()} 
                  color="default" 
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Typography variant="h6" color="text.secondary">→</Typography>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Upgrading To
                </Typography>
                <Chip 
                  label="BASIC" 
                  color="primary" 
                  icon={<Star />}
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Stack>
            
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Current Credits: {currentCredits}
            </Typography>
          </Box>

          {/* Pricing */}
          <Box 
            sx={{ 
              bgcolor: 'background.default',
              borderRadius: 2, 
              p: 3,
              border: 1,
              borderColor: 'primary.main',
              textAlign: 'center',
            }}
          >
            <Typography variant="h3" fontWeight={700} color="primary.main">
              $9.99
            </Typography>
            <Typography variant="body2" color="text.secondary">
              per month
            </Typography>
            <Chip 
              label="+100 Credits" 
              color="success" 
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>

          {/* Key Features */}
          <Box>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              What's included:
            </Typography>
            <Stack spacing={1}>
              {basicFeatures.map((feature, index) => (
                <Box key={index} display="flex" alignItems="center" gap={1}>
                  <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography variant="body2">
                    {feature}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Billing Info */}
          <Alert severity="info" icon={<CreditCard />}>
            <Typography variant="body2">
              <strong>Billing:</strong> You'll receive 100 credits immediately upon subscribing. 
              Monthly renewals maintain your subscription but don't add new credits.
              Cancel anytime from your dashboard.
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <StandardButton onClick={onClose} variant="outlined">
          Cancel
        </StandardButton>
        <StandardButton 
          onClick={handleUpgrade}
          variant="contained"
          startIcon={<Upgrade />}
          isLoading={createUpgradeCheckout.isPending}
          loadingText="Processing..."
          color="primary"
        >
          Subscribe to Basic
        </StandardButton>
      </DialogActions>
    </Dialog>
  );
};

export default UpgradeDialog;
