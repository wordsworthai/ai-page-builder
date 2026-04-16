import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Stack,
  Alert,
  IconButton,
} from '@mui/material';
import { Close, CheckCircle, Warning } from '@mui/icons-material';
import { Sparkles, Palette, RefreshCw, FilePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCreditsForAction } from '@/hooks/api/Shared/Billing/useCredits';
import { StandardButton } from '@/components/Shared';
import { setBillingReturnOrigin } from '@/utils/billingReturnStorage';
import type { ActionType } from '@/config/credits';

interface ActionConfig {
  title: string;
  description: string;
  icon: React.ElementType;
}

const ACTION_CONFIG: Record<ActionType, ActionConfig> = {
  full_page: {
    title: 'Regenerate Full Page',
    description: 'Regenerate the entire page with new AI-generated content, layout, and styling.',
    icon: Sparkles,
  },
  color_theme: {
    title: 'Change Color Theme',
    description: 'Apply a new color palette across all page elements while preserving content.',
    icon: Palette,
  },
  content: {
    title: 'Regenerate Content',
    description: 'Regenerate text content throughout the page while keeping the current layout.',
    icon: RefreshCw,
  },
  add_page: {
    title: 'Generate New Page',
    description: 'Generate a new page with AI-powered content, layout, and styling based on the selected template.',
    icon: FilePlus,
  },
  create_site: {
    title: 'Generate Website',
    description: 'Generate your new website with AI-powered content, layout, and styling. This will use credits from your balance.',
    icon: Sparkles,
  },
  section_regeneration: {
    title: 'Regenerate Section',
    description: 'Regenerate AI content for this section. The section layout will be preserved.',
    icon: RefreshCw,
  },
};

export type { ActionType };

interface CreditConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  actionType: ActionType | null;
  onConfirm: () => void;
  /** When provided, stored before navigating to billing so user is redirected back after payment */
  returnOrigin?: { path: string; context?: Record<string, unknown> };
}

export const CreditConfirmationModal: React.FC<CreditConfirmationModalProps> = ({
  open,
  onClose,
  actionType,
  onConfirm,
  returnOrigin,
}) => {
  const navigate = useNavigate();
  const { cost, balance, hasEnoughCredits, isLoading } = useCreditsForAction(actionType ?? 'create_site');

  if (!actionType) return null;

  const config = ACTION_CONFIG[actionType];
  const Icon = config.icon;
  const displayCost = cost !== undefined ? cost : '—';
  const creditsShortfall = cost !== undefined && !hasEnoughCredits ? cost - balance : 0;

  const handleBuyCredits = () => {
    onClose();
    if (returnOrigin) {
      setBillingReturnOrigin(returnOrigin.path, returnOrigin.context);
    }
    navigate('/dashboard/billing');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          fontFamily: '"General Sans", sans-serif',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '10px',
                backgroundColor: 'rgba(142, 148, 242, 0.1)',
              }}
            >
              <Icon size={20} color="#8E94F2" />
            </Box>
            <Typography variant="h6" fontWeight={600} sx={{ color: '#333' }}>
              {config.title}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Description */}
          <Typography variant="body2" color="text.secondary">
            {config.description}
          </Typography>

          {/* Cost and Balance Display */}
          <Box
            sx={{
              backgroundColor: hasEnoughCredits ? 'rgba(76, 175, 80, 0.08)' : 'rgba(211, 47, 47, 0.08)',
              borderRadius: '12px',
              p: 2.5,
              border: '1px solid',
              borderColor: hasEnoughCredits ? 'rgba(76, 175, 80, 0.3)' : 'rgba(211, 47, 47, 0.3)',
            }}
          >
            <Stack spacing={1.5}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Action cost
                </Typography>
                <Typography variant="body1" fontWeight={600} color={hasEnoughCredits ? '#4CAF50' : '#d32f2f'}>
                  {isLoading ? '...' : `${displayCost} credits`}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Your balance
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {isLoading ? '...' : `${balance} credits`}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Status Alert */}
          {hasEnoughCredits ? (
            <Alert
              severity="success"
              icon={<CheckCircle sx={{ fontSize: 20 }} />}
              sx={{ borderRadius: '10px' }}
            >
              <Typography variant="body2">
                You have enough credits for this action.
              </Typography>
            </Alert>
          ) : (
            <Alert
              severity="error"
              icon={<Warning sx={{ fontSize: 20 }} />}
              sx={{ borderRadius: '10px' }}
            >
              <Typography variant="body2">
                You need <strong>{creditsShortfall} more credits</strong> to perform this action.
              </Typography>
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <StandardButton onClick={onClose} variant="outlined" sx={{ flex: 1 }}>
          Cancel
        </StandardButton>
        {hasEnoughCredits ? (
          <StandardButton
            onClick={onConfirm}
            variant="contained"
            color="primary"
            sx={{ flex: 1 }}
          >
            Confirm & Apply
          </StandardButton>
        ) : (
          <StandardButton
            onClick={handleBuyCredits}
            variant="contained"
            color="primary"
            sx={{ flex: 1 }}
          >
            Buy Credits
          </StandardButton>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreditConfirmationModal;
