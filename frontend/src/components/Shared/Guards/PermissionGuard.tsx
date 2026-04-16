/**
 * Permission Guard Component
 *
 * Controls access to features based on user's plan and permissions.
 * Shows upgrade prompts when features are not available.
 * Simplified for credit-based pricing system (FREE, BASIC, CUSTOM).
 */

import React from "react";
import { Box, Typography, Chip, Stack } from "@mui/material";
import { Lock, Upgrade, Star } from "@mui/icons-material";
import { useFeatureAccess, useUserPlan } from "@/hooks/api/Shared/Billing/usePlans";
import { useCreditsInfo } from "@/hooks/api/Shared/Billing/useCredits";
import { useCheckoutWithProduct } from "@/hooks/api/Shared/Billing/usePayments";
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useCurrentUser } from "@/hooks/api/Shared/Auth/useCurrentUser";
import { StandardButton, ModernCard } from "@/components/Shared";

interface PermissionGuardProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  upgradeMessage?: string;
}

/**
 * Permission Guard that checks if user has access to a feature.
 * If not, shows an upgrade prompt or fallback content.
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  upgradeMessage,
}) => {
  const { data: currentUser } = useCurrentUser();
  const { data: userPlan } = useUserPlan();
  const { data: creditsInfo } = useCreditsInfo();
  const { data: featureAccess, isLoading } = useFeatureAccess(feature);
  const { checkoutWithProduct } = useCheckoutWithProduct();
  const { createSnackBar } = useSnackBarContext();

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <Typography color="text.secondary">Checking permissions...</Typography>
      </Box>
    );
  }

  // If user has access, render children
  if (featureAccess?.has_access) {
    return <>{children}</>;
  }

  // If custom fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // If upgrade prompt is disabled, show nothing
  if (!showUpgradePrompt) {
    return null;
  }

  // Show upgrade prompt
  const handleUpgrade = () => {
    if (!currentUser) {
      createSnackBar({
        content: "Please log in to upgrade your plan",
        severity: "info",
      });
      return;
    }

    const requiredPlan = featureAccess?.required_plan?.toLowerCase();
    
    // Map plan names to product IDs for checkout
    // Simplified for new credit-based system
    if (requiredPlan === 'basic') {
      checkoutWithProduct('basic');
    } else if (requiredPlan === 'custom') {
      // For custom plans, redirect to contact
      window.location.href = 'mailto:support@example.com?subject=Custom Plan Inquiry';
    } else {
      // Default to basic upgrade
      checkoutWithProduct('basic');
    }
  };

  const currentPlan = userPlan?.current_plan || "free";
  const currentCredits = creditsInfo?.balance ?? 0;

  return (
    <ModernCard title="Premium Feature" icon={<Lock />} variant="gradient">
      <Box sx={{ textAlign: "center" }}>
        <Typography color="text.secondary" paragraph>
          {upgradeMessage ||
            `This feature requires ${
              featureAccess?.required_plan || "a higher"
            } plan.`}
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          justifyContent="center"
          sx={{ mb: 3 }}
        >
          <Chip
            label={`Current: ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}`}
            size="small"
            variant="outlined"
          />
          {featureAccess?.required_plan && (
            <Chip
              label={`Required: ${featureAccess.required_plan.charAt(0).toUpperCase() + featureAccess.required_plan.slice(1)}`}
              size="small"
              color="primary"
              icon={<Star />}
            />
          )}
        </Stack>

        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
          Current credits: {currentCredits}
        </Typography>

        <StandardButton
          variant="contained"
          startIcon={<Upgrade />}
          onClick={handleUpgrade}
          size="large"
          color="primary"
        >
          {featureAccess?.required_plan?.toLowerCase() === 'custom' 
            ? 'Contact Us' 
            : 'Upgrade to Basic'}
        </StandardButton>
      </Box>
    </ModernCard>
  );
};

/**
 * Simple hook-based permission check
 */
export const usePermission = (feature: string) => {
  const { data: featureAccess, isLoading } = useFeatureAccess(feature);

  return {
    hasAccess: featureAccess?.has_access || false,
    isLoading,
    requiredPlan: featureAccess?.required_plan,
    upgradeNeeded: featureAccess?.upgrade_needed || false,
  };
};

/**
 * Higher-order component for permission-based rendering
 */
export const withPermission = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: string,
  options?: {
    fallback?: React.ReactNode;
    showUpgradePrompt?: boolean;
    upgradeMessage?: string;
  }
) => {
  const WithPermissionComponent = (props: P) => (
    <PermissionGuard
      feature={feature}
      fallback={options?.fallback}
      showUpgradePrompt={options?.showUpgradePrompt}
      upgradeMessage={options?.upgradeMessage}
    >
      <WrappedComponent {...props} />
    </PermissionGuard>
  );

  WithPermissionComponent.displayName = `withPermission(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return WithPermissionComponent;
};

export default PermissionGuard;
