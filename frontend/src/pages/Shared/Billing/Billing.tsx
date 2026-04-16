import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid2 as Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  styled,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Upgrade,
  AccountBalanceWallet,
  ShoppingCart,
  Star,
  Rocket,
  Shield,
  EventBusy,
  Assessment,
} from '@mui/icons-material';
import DashboardV2Layout from '@/components/PageBuilder/Layouts/DashboardV2Layout';
import { useUserPlan } from '@/hooks/api/Shared/Billing/usePlans';
import { useCreditsInfo } from '@/hooks/api/Shared/Billing/useCredits';
import { useCreateUpgradeCheckout, usePurchaseCreditPack } from '@/hooks/api/Shared/Billing/useUpgrades';
import { useSnackBarContext } from '@/context/SnackBarContext';
import { useCurrentUser } from '@/hooks/api/Shared/Auth/useCurrentUser';
import ContactDialog from '@/components/Shared/Dialogs/ContactDialog';
import CancelSubscriptionDialog from '@/components/Shared/Dialogs/CancelSubscriptionDialog';
import { useQueryClient } from '@tanstack/react-query';
import { useHandleCheckoutSuccess, useUserPaymentInfo } from '@/hooks/api/Shared/Billing/usePayments';
import { 
  getCreateSiteData, 
  isPendingCreateSiteCreditsBlocked,
  setPendingCreateSiteCreditsResume 
} from '@/utils/createSiteStorage';
import { getBillingReturnOrigin, clearBillingReturnOrigin } from '@/utils/billingReturnStorage';

const PlanCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '12px',
  boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-2px)',
  },
}));

const CurrentPlanCard = styled(PlanCard)(({ theme }) => ({
  borderColor: theme.palette.primary.main,
  borderWidth: 2,
}));

const PlanHeader = styled(Box)(({ theme }) => ({
  borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
}));

const PlanContent = styled(CardContent)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column'
}));

const FeatureList = styled(List)(({ theme }) => ({
  flex: 1,
  padding: 0,
}));

const FeatureItem = styled(ListItem)(({ theme }) => ({
  paddingLeft: 0,
  paddingRight: 0,
  paddingTop: 0,
  paddingBottom: 0
}));

const PlanTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.5rem',
  fontWeight: 600,
  color: '#333333'
}));

const CreditsDisplay = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(2),
  backgroundColor: 'rgba(142, 148, 242, 0.1)',
  borderRadius: theme.spacing(1)
}));

const ActionButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(3),
  borderRadius: '8px',
  textTransform: 'none',
  fontWeight: 500,
  padding: theme.spacing(1.5, 3),
}));

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PlanCardProps {
  title: string;
  subtitle?: string;
  credits?: string;
  features: PlanFeature[];
  buttonText?: string;
  buttonVariant?: 'contained' | 'outlined';
  buttonColor?: 'primary' | 'secondary';
  onButtonClick?: () => void;
  isCustom?: boolean;
  isCurrent?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const PlanCardComponent: React.FC<PlanCardProps> = ({
  title,
  subtitle,
  credits,
  features,
  buttonText,
  buttonVariant = 'outlined',
  buttonColor = 'primary',
  onButtonClick,
  isCustom = false,
  isCurrent = false,
  isLoading = false,
  icon,
}) => {
  const CardWrapper = isCurrent ? CurrentPlanCard : PlanCard;
  
  return (
    <CardWrapper>
      <PlanHeader>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          {icon}
          <PlanTitle>{title}</PlanTitle>
          {isCurrent && (
            <Chip label="Current" color="primary" size="small" />
          )}
        </Box>
        {subtitle && (
          <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
            {subtitle}
          </Typography>
        )}
        {credits && (
          <Typography variant="h6" color="primary.main" fontWeight={600}>
            {credits}
          </Typography>
        )}
      </PlanHeader>
      <PlanContent>
        <FeatureList>
          {features.map((feature, index) => (
            <FeatureItem key={index}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                {feature.included ? (
                  <CheckCircle sx={{ color: '#4caf50', fontSize: 20 }} />
                ) : (
                  <Cancel sx={{ color: '#999999', fontSize: 20 }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={feature.text}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  color: feature.included ? '#333333' : '#999999',
                }}
              />
            </FeatureItem>
          ))}
        </FeatureList>
        {buttonText && (
          <ActionButton
            variant={buttonVariant}
            color={buttonColor}
            fullWidth
            onClick={onButtonClick}
            disabled={isLoading || isCurrent}
            startIcon={isLoading ? <CircularProgress size={16} /> : (buttonVariant === 'contained' ? <Upgrade /> : undefined)}
          >
            {isLoading ? 'Processing...' : buttonText}
          </ActionButton>
        )}
      </PlanContent>
    </CardWrapper>
  );
};

const Billing: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: userPlan, isLoading: planLoading } = useUserPlan();
  const { data: creditsInfo, isLoading: creditsLoading } = useCreditsInfo();
  const { data: currentUser } = useCurrentUser();
  const { data: paymentInfo } = useUserPaymentInfo();
  const upgradeCheckout = useCreateUpgradeCheckout();
  const purchaseCreditPack = usePurchaseCreditPack();
  const handleCheckoutSuccess = useHandleCheckoutSuccess();
  const { createSnackBar } = useSnackBarContext();
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const isProcessingRef = useRef(false);
  const processedSessionRef = useRef<string | null>(null);

  const currentPlan = userPlan?.current_plan?.toLowerCase() || 'free';
  const currentCredits = creditsInfo?.balance ?? 0;
  const canGenerate = creditsInfo?.can_generate ?? false;
  const generationsAvailable = creditsInfo?.generations_available ?? 0;
  
  // Subscription cancellation status
  const subscription = paymentInfo?.active_subscription;
  const isCancelledAtPeriodEnd = subscription?.cancel_at_period_end ?? false;
  const subscriptionEndDate = subscription?.current_period_end;

  // Handle credit purchase success redirect
  useEffect(() => {
    const creditPurchase = searchParams.get('credit_purchase');
    const sessionId = searchParams.get('session_id');

    // Prevent duplicate processing
    if (!creditPurchase || creditPurchase !== 'success' || !sessionId) {
      return;
    }
    
    // Already processing this session or already processed
    if (isProcessingRef.current || processedSessionRef.current === sessionId) {
      return;
    }

    // Mark as processing
    isProcessingRef.current = true;
    processedSessionRef.current = sessionId;
    setIsProcessingPayment(true);
    
    // Clear URL params immediately
    setSearchParams({}, { replace: true });

    // Process the checkout success
    const processCheckout = async () => {
      try {
        await handleCheckoutSuccess.mutateAsync(sessionId);
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['userPlan'] });
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        queryClient.invalidateQueries({ queryKey: ['creditsBalance'] });
        queryClient.invalidateQueries({ queryKey: ['creditsInfo'] });
        queryClient.invalidateQueries({ queryKey: ['creditTransactions'] });
        
        setIsProcessingPayment(false);
        isProcessingRef.current = false;
        
        // Redirect back to origin if user came from a credit-check modal
        const returnOrigin = getBillingReturnOrigin();
        if (returnOrigin) {
          clearBillingReturnOrigin();
          navigate(returnOrigin.path, {
            state: { fromBillingCredits: true, ...returnOrigin.context },
            replace: true,
          });
          createSnackBar({
            content: 'Credits added successfully! Your balance has been updated.',
            severity: 'success',
            autoHide: true,
          });
          return;
        }
        
        createSnackBar({
          content: 'Credits added successfully! Your balance has been updated.',
          severity: 'success',
          autoHide: true,
        });
      } catch (error: any) {
        setIsProcessingPayment(false);
        isProcessingRef.current = false;
        
        createSnackBar({
          content: error.message || 'Failed to process payment. Please contact support.',
          severity: 'error',
          autoHide: false,
        });
      }
    };

    processCheckout();
  }, [searchParams, setSearchParams]);

  // Handle plan upgrade success redirect
  useEffect(() => {
    const planUpgrade = searchParams.get('plan_upgrade');
    const sessionId = searchParams.get('session_id');
    // Prevent duplicate processing
    if (!planUpgrade || planUpgrade !== 'success' || !sessionId) {
      return;
    }
    // Already processing this session or already processed
    if (isProcessingRef.current || processedSessionRef.current === sessionId) {
      return;
    }
    // Mark as processing
    isProcessingRef.current = true;
    processedSessionRef.current = sessionId;
    setIsProcessingPayment(true);
    // Clear URL params immediately
    setSearchParams({}, { replace: true });
    // Process the checkout success
    const processCheckout = async () => {
      try {
        await handleCheckoutSuccess.mutateAsync(sessionId);
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['userPlan'] });
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        queryClient.invalidateQueries({ queryKey: ['creditsBalance'] });
        queryClient.invalidateQueries({ queryKey: ['creditsInfo'] });
        queryClient.invalidateQueries({ queryKey: ['creditTransactions'] });
        queryClient.invalidateQueries({ queryKey: ['upgradeOptions'] });
        
        // Redirect back to origin if user came from a credit-check modal
        const returnOrigin = getBillingReturnOrigin();
        if (returnOrigin) {
          clearBillingReturnOrigin();
          setIsProcessingPayment(false);
          isProcessingRef.current = false;
          navigate(returnOrigin.path, {
            state: { fromBillingCredits: true, ...returnOrigin.context },
            replace: true,
          });
          createSnackBar({
            content: 'Plan upgraded successfully! You are now on the Basic plan with 100 credits.',
            severity: 'success',
            autoHide: true,
          });
          return;
        }
        
        // If the user upgraded due to insufficient credits during create-site (API 403 path),
        // redirect back to dashboard and resume generation with stored createSiteData.
        const pendingData = getCreateSiteData();
        if (pendingData.businessName && isPendingCreateSiteCreditsBlocked()) {
          // Set resume status so dashboard knows to trigger generation
          setPendingCreateSiteCreditsResume();
          setIsProcessingPayment(false);
          isProcessingRef.current = false;
          navigate('/dashboard');
          return;
        }
        setIsProcessingPayment(false);
        isProcessingRef.current = false;
        createSnackBar({
          content: 'Plan upgraded successfully! You are now on the Basic plan with 100 credits.',
          severity: 'success',
          autoHide: true,
        });
      } catch (error: any) {
        setIsProcessingPayment(false);
        isProcessingRef.current = false;
        createSnackBar({
          content: error.message || 'Failed to process upgrade. Please contact support.',
          severity: 'error',
          autoHide: false,
        });
      }
    };
    processCheckout();
  }, [searchParams, setSearchParams]);

  const handleUpgradeToBasic = () => {
    upgradeCheckout.mutate({ targetPlan: 'basic' });
  };

  const handleBuyCredits = () => {
    if (currentPlan === 'free') {
      createSnackBar({
        content: 'Please upgrade to Basic first to purchase credit packs.',
        severity: 'warning',
      });
      return;
    }
    purchaseCreditPack.mutate({ packId: 'credits-100' });
  };

  // Determine if we should show loading overlay
  const showLoadingOverlay = isProcessingPayment || upgradeCheckout.isPending || purchaseCreditPack.isPending;
  
  // Get appropriate loading message
  const getLoadingMessage = () => {
    if (upgradeCheckout.isPending) {
      return {
        title: 'Redirecting to Checkout',
        subtitle: 'Please wait while we prepare your upgrade...',
      };
    }
    if (purchaseCreditPack.isPending) {
      return {
        title: 'Redirecting to Checkout',
        subtitle: 'Please wait while we prepare your purchase...',
      };
    }
    return {
      title: 'Processing Transaction',
      subtitle: 'Please wait while we confirm your payment and update your account.',
    };
  };

  const loadingMessage = getLoadingMessage();

  // Loading modal overlay - shows during checkout redirect and after returning from Stripe
  const loadingOverlay = showLoadingOverlay ? createPortal(
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          p: 4,
          borderRadius: 3,
          bgcolor: 'white',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        }}
      >
        <CircularProgress 
          size={56} 
          thickness={4}
          sx={{ color: '#8E94F2' }}
        />
        <Box sx={{ textAlign: 'center' }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600, 
              color: '#1a1a2e',
              mb: 1
            }}
          >
            {loadingMessage.title}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              maxWidth: 300
            }}
          >
            {loadingMessage.subtitle}
          </Typography>
        </Box>
      </Box>
    </Box>,
    document.body
  ) : null;

  const handleContactUs = () => {
    setContactDialogOpen(true);
  };

  const handleCancelSubscription = () => {
    setCancelDialogOpen(true);
  };

  const handleCancelSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['userPlan'] });
    queryClient.invalidateQueries({ queryKey: ['payments', 'user-info'] });
    queryClient.invalidateQueries({ queryKey: ['creditsInfo'] });
    queryClient.invalidateQueries({ queryKey: ['creditsBalance'] });
  };

  const formatSubscriptionEndDate = (date: string | Date | undefined) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const freePlanFeatures: PlanFeature[] = [
    { text: '20 credits on signup', included: true },
    { text: '2 website generations', included: true },
    { text: 'Website editor access', included: true },
    { text: 'Preview your website', included: true },
    { text: 'Publish flow', included: false },
    { text: 'Website analytics', included: false },
  ];

  const basicPlanFeatures: PlanFeature[] = [
    { text: '100 credits on subscription', included: true },
    { text: '~10 full website generations', included: true },
    { text: 'Website editor access', included: true },
    { text: 'Publish your website', included: true },
    { text: 'Website analytics', included: true },
    { text: 'Form submissions tracking', included: true },
    { text: 'Buy additional credit packs', included: true },
  ];

  const customPlanFeatures: PlanFeature[] = [
    { text: 'Everything in Basic', included: true },
    { text: 'Custom subdomain hosting', included: true },
    { text: 'Custom sections', included: true },
    { text: 'Multiple pages', included: true },
    { text: 'Dedicated support', included: true },
    { text: 'SLA guarantee', included: true },
  ];

  const isLoading = planLoading || creditsLoading;

  if (isLoading) {
    return (
      <DashboardV2Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </DashboardV2Layout>
    );
  }

  return (
    <DashboardV2Layout>
      {/* Full-screen loading overlay rendered via portal */}
      {loadingOverlay}

      <Box
        sx={{
          maxWidth: 'xl',
          mx: 'auto',
          width: '100%',
          padding: '30px',
          marginTop: '3vh',
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Billing & Plans
          </Typography>
        </Box>

        {/* Credit Balance Section */}
        <Box sx={{ marginTop: 2, mb: 2 }}>
          <CreditsDisplay gap={4}>
            <AccountBalanceWallet sx={{ color: '#8E94F2', fontSize: 32 }} />
            <Box>
              <Typography variant="h4" fontWeight={600} color="primary.main">
                {currentCredits.toLocaleString()} credits available • {generationsAvailable} generation{generationsAvailable !== 1 ? 's' : ''} remaining
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, ml: 'auto', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<Assessment />}
                onClick={() => navigate('/dashboard/usage')}
              >
                View Usage
              </Button>
              <Button
                variant="outlined"
                startIcon={<ShoppingCart />}
                onClick={handleBuyCredits}
                disabled={purchaseCreditPack.isPending || currentPlan === 'free'}
              >
                {purchaseCreditPack.isPending ? 'Processing...' : 'Buy Credits'}
              </Button>
            </Box>
          </CreditsDisplay>
        </Box>

        {/* Plans Grid */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Free Plan */}
          <Grid size={{ xs: 12, md: 4 }}>
            <PlanCardComponent
              title="Free"
              subtitle="Get started for free"
              credits="20 credits"
              features={freePlanFeatures}
              buttonText={currentPlan === 'free' ? 'Current Plan' : 'Free Plan'}
              buttonVariant="outlined"
              isCurrent={currentPlan === 'free'}
              icon={<Rocket sx={{ color: '#666' }} />}
            />
          </Grid>

          {/* Basic Plan */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <PlanCardComponent
                title="Basic"
                subtitle="$9.99/month"
                credits="100 credits"
                features={basicPlanFeatures}
                buttonText={currentPlan === 'basic' ? 'Current Plan' : 'Upgrade to Basic'}
                buttonVariant="contained"
                buttonColor="primary"
                onButtonClick={handleUpgradeToBasic}
                isCurrent={currentPlan === 'basic'}
                isLoading={upgradeCheckout.isPending}
                icon={<Star sx={{ color: '#8E94F2' }} />}
              />
              {/* Cancel subscription section for Basic plan users */}
              {currentPlan === 'basic' && (
                <Box sx={{ mt: 2 }}>
                  {isCancelledAtPeriodEnd ? (
                    <Alert 
                      severity="warning" 
                      icon={<EventBusy />}
                      sx={{ 
                        borderRadius: '8px',
                        '& .MuiAlert-message': {
                          width: '100%',
                        }
                      }}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        Subscription ending
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Your subscription will end on {formatSubscriptionEndDate(subscriptionEndDate)}. 
                        You can continue using your credits until then.
                      </Typography>
                    </Alert>
                  ) : (
                    <Button
                      variant="text"
                      size="medium"
                      onClick={handleCancelSubscription}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        color: '#d32f2f',
                        width: "100%",
                        backgroundColor: 'rgba(211, 47, 47, 0.04)',
                      }}
                    >
                      Cancel subscription
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          </Grid>

          {/* Custom Plan */}
          <Grid size={{ xs: 12, md: 4 }}>
            <PlanCardComponent
              title="Custom"
              subtitle="Contact Us for Custom Pricing"
              credits="As per Requirements"
              isCustom={true}
              features={customPlanFeatures}
              buttonText={currentPlan === 'custom' ? 'Current Plan' : 'Contact Us'}
              buttonVariant="contained"
              buttonColor="secondary"
              onButtonClick={handleContactUs}
              isCurrent={currentPlan === 'custom'}
              icon={<Shield sx={{ color: '#4caf50' }} />}
            />
          </Grid>
        </Grid>


        {/* Credit Pack Info */}
        <Box sx={{ mt: 3 }}>
          <Card sx={{ borderRadius: 2, p: 1, pl: 3, pr: 3, boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)', border: '1px solid rgba(0, 0, 0, 0.05)', opacity: currentPlan === 'free' ? 0.6 : 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  100 Credits Add On Pack
                </Typography>
                <Typography variant="body2" color="text.primary">
                  Add 100 credits to your balance (~10 website generations){currentPlan === 'free' && ' (Upgrade to basic to enable Add On Packs)'}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  $9.99
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleBuyCredits}
                  disabled={purchaseCreditPack.isPending || currentPlan === 'free'}
                  startIcon={purchaseCreditPack.isPending ? <CircularProgress size={16} /> : <ShoppingCart />}
                  sx={{ mt: 1 }}
                >
                  {purchaseCreditPack.isPending ? 'Processing...' : 'Buy Now'}
                </Button>
              </Box>
            </Box>
          </Card>
        </Box>
      </Box>
      <ContactDialog
        open={contactDialogOpen}
        onClose={() => setContactDialogOpen(false)}
        currentUser={currentUser}
        initialCategory="Custom Plan"
        initialSubject="Upgrade Me to Custom Plan"
      />
      <CancelSubscriptionDialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        subscriptionEndDate={subscriptionEndDate}
        onSuccess={handleCancelSuccess}
      />
    </DashboardV2Layout>
  );
};

export default Billing;
