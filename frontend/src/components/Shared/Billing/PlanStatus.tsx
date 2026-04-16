/**
 * Plan Status Component
 *
 * Displays current plan status, credit balance, and upgrade options.
 * Simplified for the credit-based pricing system (FREE, BASIC, CUSTOM).
 */

import React from "react";
import {
  Box,
  Typography,
  Chip,
  Stack,
  LinearProgress,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  Star,
  Upgrade,
  CheckCircle,
  Lock,
  Speed,
  Shield,
  Rocket,
  AccountBalanceWallet,
} from "@mui/icons-material";
import { useUserPlan, useAvailableUpgrades } from "@/hooks/api/Shared/Billing/usePlans";
import { useCreditsInfo, useCreditCostForAction } from "@/hooks/api/Shared/Billing/useCredits";
import { useCheckoutWithProduct } from "@/hooks/api/Shared/Billing/usePayments";
import { useSnackBarContext } from "@/context/SnackBarContext";
import { StandardButton, ModernCard } from "@/components/Shared";

interface PlanStatusProps {
  compact?: boolean;
  showUpgradeButton?: boolean;
  showCreditsInfo?: boolean;
}

const PlanStatus: React.FC<PlanStatusProps> = ({
  compact = false,
  showUpgradeButton = true,
  showCreditsInfo = true,
}) => {
  const { data: userPlan, isLoading: planLoading } = useUserPlan();
  const { data: creditsInfo, isLoading: creditsLoading } = useCreditsInfo();
  const { cost: creditCostFromHook, isLoading: costLoading } = useCreditCostForAction('create_site');
  const { data: upgrades } = useAvailableUpgrades();
  const { checkoutWithProduct } = useCheckoutWithProduct();
  const { createSnackBar } = useSnackBarContext();

  const isLoading = planLoading || creditsLoading || costLoading;

  const getPlanIcon = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case "basic":
        return <Star />;
      case "custom":
        return <Shield />;
      default:
        return <Rocket />;
    }
  };

  const getPlanColor = (plan: string): "default" | "primary" | "secondary" | "success" | "info" => {
    switch (plan?.toLowerCase()) {
      case "basic":
        return "primary";
      case "custom":
        return "success";
      default:
        return "default";
    }
  };

  const handleUpgrade = () => {
    if (!upgrades || upgrades.length === 0) {
      createSnackBar({
        content: "No upgrades available",
        severity: "info",
      });
      return;
    }

    // For the simplified system, always upgrade to basic
    checkoutWithProduct('basic');
  };

  if (isLoading) {
    return (
      <ModernCard title="Plan Status" icon={<Speed />}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={100}
        >
          <LinearProgress sx={{ width: "100%" }} />
        </Box>
      </ModernCard>
    );
  }

  const currentPlan = userPlan?.current_plan || "free";
  const planIcon = getPlanIcon(currentPlan);
  const planColor = getPlanColor(currentPlan);
  
  // Credits info (cost from API via hook; no default)
  const balance = creditsInfo?.balance ?? 0;
  const canGenerate = creditsInfo?.can_generate ?? false;
  const generationsAvailable = creditsInfo?.generations_available ?? 0;
  const creditCost = creditCostFromHook;

  return (
    <ModernCard
      title={`${
        currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)
      } Plan`}
      subtitle="Current subscription level"
      icon={planIcon}
      variant="gradient"
      action={
        <Chip
          label={currentPlan.toUpperCase()}
          color={planColor}
          size="small"
        />
      }
    >
      {!compact && showCreditsInfo && (
        <>
          {/* Credit Balance */}
          <Box mb={3}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <AccountBalanceWallet sx={{ fontSize: 20, color: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary">
                  Credit Balance
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight={600} color="primary.main">
                {balance.toLocaleString()}
              </Typography>
            </Box>
            
            {/* Credit usage indicator */}
            <LinearProgress
              variant="determinate"
              value={Math.min((balance / 100) * 100, 100)}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: "rgba(255,255,255,0.1)",
              }}
            />
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {generationsAvailable} website generation{generationsAvailable !== 1 ? 's' : ''} available ({creditCost !== undefined ? creditCost : '—'} credits each)
            </Typography>
          </Box>

          {/* Generation Status */}
          <Box mb={3}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box display="flex" alignItems="center" gap={1}>
                {canGenerate ? (
                  <CheckCircle sx={{ color: "success.main", fontSize: 20 }} />
                ) : (
                  <Lock sx={{ color: "warning.main", fontSize: 20 }} />
                )}
                <Typography variant="body2">
                  {canGenerate
                    ? `Ready to generate (${balance} credits)`
                    : creditCost !== undefined
                      ? `Need ${creditCost - balance} more credits`
                      : 'Loading credit cost…'}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Divider sx={{ my: 2 }} />
        </>
      )}

      {/* Upgrade Section */}
      {showUpgradeButton && currentPlan === 'free' && (
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" fontWeight={600}>
              Upgrade to Basic
            </Typography>
            <Typography variant="body2" color="text.secondary">
              $9.99/month • +100 credits
            </Typography>
          </Box>

          <StandardButton
            variant="contained"
            size={compact ? "small" : "medium"}
            startIcon={<Upgrade />}
            onClick={handleUpgrade}
            color="primary"
          >
            Upgrade
          </StandardButton>
        </Box>
      )}

      {currentPlan === 'basic' && (
        <Box textAlign="center" py={1}>
          <Typography variant="body2" color="text.secondary">
            You're on the Basic plan. Need more credits?{' '}
            <Typography 
              component="span" 
              variant="body2" 
              color="primary.main" 
              sx={{ cursor: 'pointer', fontWeight: 600 }}
              onClick={() => window.location.href = '/dashboard/billing'}
            >
              Buy credit packs
            </Typography>
          </Typography>
        </Box>
      )}

      {currentPlan === 'custom' && (
        <Box textAlign="center" py={1}>
          <Typography variant="body2" color="text.secondary">
            You're on a Custom plan. Contact support for adjustments.
          </Typography>
        </Box>
      )}
    </ModernCard>
  );
};

/**
 * Compact plan badge for headers and navigation
 */
export const PlanBadge: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const { data: userPlan } = useUserPlan();
  const { data: creditsInfo } = useCreditsInfo();
  
  const currentPlan = userPlan?.current_plan || "free";
  const balance = creditsInfo?.balance ?? 0;
  const planColor = getPlanColorStandalone(currentPlan);
  const planIcon = getPlanIconStandalone(currentPlan);

  return (
    <Tooltip title={`${currentPlan.toUpperCase()} • ${balance} credits`}>
      <Chip
        label={`${balance}`}
        color={planColor}
        icon={planIcon}
        size="small"
        onClick={onClick}
        clickable={!!onClick}
        sx={{
          fontWeight: 600,
          "& .MuiChip-icon": {
            fontSize: 16,
          },
        }}
      />
    </Tooltip>
  );
};

// Standalone helper functions
const getPlanIconStandalone = (plan: string) => {
  switch (plan?.toLowerCase()) {
    case "basic":
      return <Star />;
    case "custom":
      return <Shield />;
    default:
      return <Rocket />;
  }
};

const getPlanColorStandalone = (plan: string): "default" | "primary" | "success" => {
  switch (plan?.toLowerCase()) {
    case "basic":
      return "primary";
    case "custom":
      return "success";
    default:
      return "default";
  }
};

export default PlanStatus;
