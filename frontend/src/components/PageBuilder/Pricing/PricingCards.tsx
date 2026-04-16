import { ReactNode, useState } from "react";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid2";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import { styled, alpha, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { Chip, Tooltip, Stack, CircularProgress } from "@mui/material";
import { Check, Close, Star, Rocket, Shield } from "@mui/icons-material";
import { useCurrentUser } from "@/hooks/api/Shared/Auth/useCurrentUser";
import { useCheckoutWithProduct } from "@/hooks/api/Shared/Billing/usePayments";
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useUserPlan } from "@/hooks/api/Shared/Billing/usePlans";
import { useCreditsBalance } from "@/hooks/api/Shared/Billing/useCredits";
import UpgradeDialog from "@/components/Shared/Billing/UpgradeDialog";
import { CTAButton, StandardButton } from "@/components/Shared";

const ModernPricingCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.background.paper, 0.95)} 0%, 
    ${alpha(theme.palette.background.default, 0.90)} 100%)`,
  backdropFilter: "blur(20px)",
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: theme.spacing(3),
  padding: theme.spacing(4),
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  position: "relative",
  overflow: "hidden",
  transition: "all 0.3s ease-out",
  "&:hover": {
    transform: "translateY(-8px)",
    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
  },
  ...theme.applyStyles("dark", {
    background: `linear-gradient(135deg, 
      ${alpha(theme.palette.primary.main, 0.05)} 0%, 
      ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  }),
}));

const PopularCard = styled(ModernPricingCard)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.primary.main, 0.08)} 0%, 
    ${alpha(theme.palette.secondary.main, 0.05)} 50%,
    ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
  border: `2px solid ${theme.palette.primary.main}`,
  transform: "scale(1.05)",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "4px",
    background: `linear-gradient(90deg, 
      ${theme.palette.primary.main}, 
      ${theme.palette.secondary.main})`,
  },
  "&:hover": {
    transform: "scale(1.05) translateY(-8px)",
  },
}));

const PriceDisplay = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "baseline",
  justifyContent: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(3),
}));

const FeatureItem = ({
  children,
  tooltipText,
  missing,
}: {
  children: ReactNode;
  tooltipText?: string;
  missing?: boolean;
}) => (
  <Tooltip title={tooltipText || ""} placement="right" arrow>
    <Box sx={{ 
      display: "flex", 
      alignItems: "center", 
      gap: 1.5, 
      py: 1,
      transition: "all 0.2s ease-out",
      "&:hover": {
        transform: "translateX(4px)",
      },
    }}>
      {missing ? (
        <Close sx={{ color: "text.disabled", fontSize: "1.2rem" }} />
      ) : (
        <Check sx={{ color: "success.main", fontSize: "1.2rem" }} />
      )}
      <Typography 
        variant="body2" 
        sx={{ 
          color: missing ? "text.disabled" : "text.secondary",
          fontWeight: 500,
        }}
      >
        {children}
      </Typography>
    </Box>
  </Tooltip>
);

// Plan configurations for the new credit-based system
const PLAN_CONFIGS = {
  free: {
    id: 'free',
    name: 'Free',
    price: '$0',
    priceLabel: 'forever',
    credits: '10 credits',
    icon: <Rocket />,
    isPopular: false,
    features: [
      '10 credits on signup',
      '1 full website generation',
      'Website editor access',
      'Preview your website',
    ],
    missingFeatures: [
      'Publish flow',
      'Website analytics',
      'Additional credit packs',
    ],
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: '$9.99',
    priceLabel: '/month',
    credits: '100 credits',
    icon: <Star />,
    isPopular: true,
    features: [
      '100 credits on subscription',
      '~10 full website generations',
      'Website editor access',
      'Publish your website',
      'Website analytics',
      'Form submissions tracking',
      'Buy additional credit packs',
    ],
    missingFeatures: [],
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    price: 'Contact Us',
    priceLabel: '',
    credits: 'Custom credits',
    icon: <Shield />,
    isPopular: false,
    features: [
      'Everything in Basic',
      'Custom subdomain hosting',
      'Custom sections',
      'Multiple pages',
      'Dedicated support',
      'SLA guarantee',
    ],
    missingFeatures: [],
  },
};

interface PricingCardsProps {
  showAllFeatures?: boolean;
  compact?: boolean;
  maxCards?: number;
}

const PricingCards = ({ showAllFeatures = true, compact = false, maxCards }: PricingCardsProps) => {
  const theme = useTheme();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { checkoutWithProduct, isLoading: checkoutLoading } = useCheckoutWithProduct();
  const { createSnackBar } = useSnackBarContext();
  const { data: userPlan, isLoading: planLoading } = useUserPlan();
  const { data: creditsBalance } = useCreditsBalance();
  
  // Upgrade dialog state
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  const handlePurchase = (planId: string) => {
    if (!currentUser) {
      createSnackBar({
        content: 'Please log in to continue with your purchase',
        severity: 'info',
        autoHide: false,
      });
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }
    
    if (planId === 'custom') {
      window.location.href = 'mailto:support@example.com?subject=Custom Plan Inquiry';
      return;
    }
    
    if (planId === 'basic') {
      // For Basic plan, show upgrade dialog or direct checkout
      const currentPlan = userPlan?.current_plan || 'free';
      if (currentPlan === 'free') {
        setUpgradeDialogOpen(true);
      } else {
        createSnackBar({
          content: 'You already have a Basic or higher subscription!',
          severity: 'info',
        });
      }
    }
  };

  const handleCloseUpgradeDialog = () => {
    setUpgradeDialogOpen(false);
  };

  if (planLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  const currentPlan = userPlan?.current_plan?.toLowerCase() || 'free';
  const plans = Object.values(PLAN_CONFIGS);
  const displayPlans = maxCards ? plans.slice(0, maxCards) : plans;

  return (
    <Grid container spacing={4} justifyContent="center">
      {displayPlans.map((plan) => {
        const isPopular = plan.isPopular;
        const CardComponent = isPopular ? PopularCard : ModernPricingCard;
        const ButtonComponent = isPopular ? CTAButton : StandardButton;
        const isCurrentPlan = plan.id === currentPlan;
        const isCustom = plan.id === 'custom';
        
        // Determine button state
        const isDisabled = checkoutLoading || isCurrentPlan || (plan.id === 'free');
        const buttonText = isCurrentPlan 
          ? 'Current Plan' 
          : isCustom 
            ? 'Contact Us' 
            : plan.id === 'free' 
              ? 'Free Plan' 
              : `Get ${plan.name}`;
        
        return (
          <Grid size={{ xs: 12, md: 6, lg: maxCards && maxCards <= 2 ? 6 : 4 }} key={plan.id}>
            <CardComponent>
              {isPopular && (
                <Chip
                  label="Most Popular"
                  color="primary"
                  size="small"
                  icon={<Star />}
                  sx={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    fontWeight: 600,
                  }}
                />
              )}
              
              <CardContent sx={{ flexGrow: 1, p: 0 }}>
                {/* Plan Header */}
                <Box sx={{ textAlign: "center", mb: 3 }}>
                  <Box sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    gap: 1,
                    mb: 2,
                  }}>
                    <Box sx={{ color: "primary.main" }}>
                      {plan.icon}
                    </Box>
                    <Typography variant={compact ? "h5" : "h4"} fontWeight={600}>
                      {plan.name}
                    </Typography>
                  </Box>
                  
                  <Chip 
                    label={plan.credits} 
                    color="success" 
                    size="small" 
                    sx={{ mb: 2 }}
                  />
                  
                  <PriceDisplay>
                    <Typography 
                      variant={compact ? "h3" : "h2"} 
                      fontWeight={700}
                      color="primary.main"
                    >
                      {plan.price}
                    </Typography>
                    {plan.priceLabel && (
                      <Typography variant="h6" color="text.secondary">
                        {plan.priceLabel}
                      </Typography>
                    )}
                  </PriceDisplay>
                </Box>

                {/* Features List */}
                {showAllFeatures && (
                  <Box sx={{ mb: 4 }}>
                    <Typography 
                      variant="subtitle2" 
                      fontWeight={600}
                      sx={{ mb: 2 }}
                    >
                      What's included:
                    </Typography>
                    <Stack spacing={0.5}>
                      {plan.features.map((feature, featureIndex) => (
                        <FeatureItem key={featureIndex}>
                          {feature}
                        </FeatureItem>
                      ))}
                      {plan.missingFeatures.map((feature, featureIndex) => (
                        <FeatureItem key={`missing-${featureIndex}`} missing>
                          {feature}
                        </FeatureItem>
                      ))}
                    </Stack>
                  </Box>
                )}
              </CardContent>

              <CardActions sx={{ p: 0, mt: "auto" }}>
                <ButtonComponent
                  fullWidth
                  size="large"
                  variant={isPopular ? undefined : "outlined"}
                  disabled={isDisabled}
                  onClick={() => handlePurchase(plan.id)}
                >
                  {checkoutLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    buttonText
                  )}
                </ButtonComponent>
              </CardActions>
            </CardComponent>
          </Grid>
        );
      })}
      
      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={upgradeDialogOpen}
        onClose={handleCloseUpgradeDialog}
      />
    </Grid>
  );
};

export default PricingCards;
