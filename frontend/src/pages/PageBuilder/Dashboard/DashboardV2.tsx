import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import DashboardV2Layout from '@/components/PageBuilder/Layouts/DashboardV2Layout';
import DashboardGreetingComponent from '@/components/PageBuilder/Dashboard/DashboardGreetingComponent';
import WebsiteComponent from '@/components/PageBuilder/Dashboard/WebsiteComponent';
import { StartingGenerationPlaceholderView } from '@/components/PageBuilder/Dashboard/WebsiteComponent/views';
import FormsComponent from '@/components/PageBuilder/Dashboard/FormsComponent';
import MediaComponent from '@/components/PageBuilder/Dashboard/MediaComponent';
import DataAnalyticsComponent from '@/components/PageBuilder/Dashboard/DataAnalyticsComponent';
import { PublishDialog } from '@/components/PageBuilder/Publishing/PublishDialog';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/api/Shared/Auth/useCurrentUser';
import { useCreateBusiness } from '@/hooks/api/PageBuilder/CreateSite/useCreateBusiness';
import { useGenerationTrigger } from '@/hooks/api/PageBuilder/Generation/useGenerationTrigger';
import { 
  hasPendingBusinessDataCreation, 
  getCreateSiteData, 
  clearPendingBusinessDataCreation, 
  clearCreateSiteData, 
  setPendingBusinessDataCreation,
  setPendingGenerationAfterVerification,
  hasPendingGenerationAfterVerification,
  clearPendingGenerationAfterVerification,
  isPendingCreateSiteCreditsResume,
  clearPendingCreateSiteState,
} from '@/utils/createSiteStorage';
import EmailVerificationBanner from '@/components/PageBuilder/Dashboard/EmailVerificationBanner';
import CreateSiteLoading from '@/components/PageBuilder/CreateSite/CreateSiteLoading';
import { ERROR_CODES } from '@/streaming/types/generation';
import { usePublishedWebsiteAnalyticsData } from '@/hooks/api/PageBuilder/Analytics/usePublishedWebsiteAnalyticsData';
import { useHandleCheckoutSuccess } from '@/hooks/api/Shared/Billing/usePayments';
import { usePublishFromEditor } from '@/hooks/api/PageBuilder/Websites/usePublishing';
import { useSnackBarContext } from '@/context/SnackBarContext';
import { useWebsiteData } from '@/hooks/api/PageBuilder/Websites/useWebsiteData';
import { getCategoryFromPaletteId, getFontFamilyFromCategory, colorCategories } from '@/components/PageBuilder/CreateSite/colorPaletteConstants';
import { useGenerationState } from '@/context/generation_state/useGenerationState';

const DashboardV2: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();
  const createBusinessMutation = useCreateBusiness();
  const generationMutation = useGenerationTrigger();
  const { setActiveGeneration } = useGenerationState();
  const { analyticsData, isLoadingAnalytics } = usePublishedWebsiteAnalyticsData();
  const { data: websiteData } = useWebsiteData();
  const { createSnackBar } = useSnackBarContext();
  const isPublished = websiteData?.homepage?.is_published ?? false;
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishHtmlContent, setPublishHtmlContent] = useState<string | null>(null);
  const [preCompletedPublishResult, setPreCompletedPublishResult] = useState<{
    cloudfront_url: string;
    subdomain: string;
    is_new_website: boolean;
    subdomain_changed: boolean;
  } | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const openModal = params.get('open_publish_modal') === 'true' || params.get('publish_after_payment') === 'true';
    return !!sessionId && openModal;
  });
  const handleCheckoutSuccess = useHandleCheckoutSuccess();
  const publishMutation = usePublishFromEditor();
  const isProcessingPaymentRef = useRef(false);
  const processedSessionIdRef = useRef<string | null>(null);
  
  // Email verification state - tracks if user just verified their email
  const [justVerified, setJustVerified] = useState(() => {
    // Check URL param on initial load
    const params = new URLSearchParams(window.location.search);
    return params.get('verified') === 'true' || hasPendingGenerationAfterVerification();
  });
  const [isStartingGeneration, setIsStartingGeneration] = useState(false);
  const [isPendingCreateSiteTrigger, setIsPendingCreateSiteTrigger] = useState(false);

  const base64ToFile = (base64: string, filename: string, mimeType: string = 'text/html'): File => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return new File([blob], filename, { type: mimeType });
  };

  const cleanupStaleData = () => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('publish_session_processed:')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.timestamp && now - data.timestamp > oneDayMs) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          localStorage.removeItem(key);
        }
      }
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('publish_result:')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.timestamp && now - data.timestamp > oneDayMs) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          localStorage.removeItem(key);
        }
      }
    }
  };

  useEffect(() => {
    const openPublishModal = searchParams.get('open_publish_modal') === 'true' || searchParams.get('publish_after_payment') === 'true';
    const sessionId = searchParams.get('session_id');
    if (!openPublishModal || !sessionId) {
      return;
    }
    if (isProcessingPaymentRef.current && processedSessionIdRef.current === sessionId) {
      return;
    }
    if (processedSessionIdRef.current && processedSessionIdRef.current !== sessionId) {
      isProcessingPaymentRef.current = false;
    }
    cleanupStaleData();
    isProcessingPaymentRef.current = true;
    processedSessionIdRef.current = sessionId;
    setIsProcessingPayment(true);
    setSearchParams({}, { replace: true });

    const processPaymentFlow = async () => {
      try {
        await handleCheckoutSuccess.mutateAsync(sessionId);
        queryClient.invalidateQueries({ queryKey: ['userPlan'] });
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        queryClient.invalidateQueries({ queryKey: ['creditsBalance'] });
        queryClient.invalidateQueries({ queryKey: ['creditsInfo'] });
        queryClient.invalidateQueries({ queryKey: ['editor-defaults'] });
        queryClient.invalidateQueries({ queryKey: ['websites'] });

        const pendingPublishData = localStorage.getItem('pending_publish_data');
        if (pendingPublishData) {
          try {
            const publishData = JSON.parse(pendingPublishData);
            const publishDataAge = Date.now() - (publishData.timestamp || 0);
            const oneHourMs = 60 * 60 * 1000;
            if (publishDataAge <= oneHourMs && publishData.htmlContentBase64) {
              const htmlString = atob(publishData.htmlContentBase64);
              setPublishHtmlContent(htmlString);
            }
          } catch {
            // ignore parse error
          }
        }
        setPublishDialogOpen(true);
      } catch (error: any) {
        createSnackBar({
          content: error.message || 'Failed to process. Please try again.',
          severity: 'error',
          autoHide: true,
        });
      } finally {
        isProcessingPaymentRef.current = false;
        processedSessionIdRef.current = null;
        setIsProcessingPayment(false);
      }
    };
    processPaymentFlow();
  }, [searchParams, handleCheckoutSuccess, queryClient, createSnackBar, setSearchParams]);

  // Handle credits-resume flow (triggered after successful upgrade from billing)
  useEffect(() => {
    if (!isPendingCreateSiteCreditsResume()) {
      return;
    }
    const createSiteData = getCreateSiteData();
    if (!createSiteData.businessName || !currentUser?.email || !currentUser?.verified) {
      return;
    }
    // Clear resume state immediately to prevent loops
    clearPendingCreateSiteState();
    // Trigger generation
    triggerPendingGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.email, currentUser?.verified]);

  // Handle verified=true URL param (from email verification redirect)
  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setJustVerified(true);
      setPendingGenerationAfterVerification(); // Persist across page refreshes
      setSearchParams({}, { replace: true }); // Clear param from URL
    }
  }, [searchParams, setSearchParams]);

  // Extracted function to trigger pending generation (used by auto-trigger and manual button)
  const triggerPendingGeneration = async () => {
    setIsPendingCreateSiteTrigger(true);
    const createSiteData = getCreateSiteData();
    if (!createSiteData.businessName || !currentUser?.email) {
      setIsPendingCreateSiteTrigger(false);
      return;
    }
    
    setIsStartingGeneration(true);
    clearPendingBusinessDataCreation();
    clearPendingGenerationAfterVerification();
    
    try {
      await createBusinessMutation.mutateAsync({
        business_name: createSiteData.businessName || undefined,
        google_maps_url: createSiteData.googleUrl || undefined,
        google_maps_data: createSiteData.googlePlacesData || undefined,
        yelp_url: createSiteData.yelpUrl || undefined,
        intent: createSiteData.purpose || undefined,
        tone: createSiteData.tone || undefined,
        color_palette_id: createSiteData.colorPalette || undefined,
      });

      // Build palette and font_family from createSiteData (mirrors CreateSite flow)
      const paletteId = createSiteData.colorPalette;
      let palette: { primary: string; secondary: string; accent: string; background: string; palette_id: string; category: string | null } | null = null;
      let fontFamily: string | null = null;
      if (paletteId) {
        const categoryId = getCategoryFromPaletteId(paletteId);
        fontFamily = getFontFamilyFromCategory(categoryId);
        const colors = createSiteData.colors;
        if (colors) {
          palette = { ...colors, palette_id: paletteId, category: categoryId };
        } else {
          // Fallback: lookup colors from palette ID
          for (const cat of colorCategories) {
            const p = cat.palettes.find((x) => x.id === paletteId);
            if (p) {
              palette = { ...p.colors, palette_id: paletteId, category: cat.id };
              break;
            }
          }
        }
      }

      const generationResponse = await generationMutation.mutateAsync({
        business_name: createSiteData.businessName || currentUser.email,
        website_intention: createSiteData.purpose || "online_portfolio",
        website_tone: createSiteData.tone || "professional",
        color_palette_id: createSiteData.colorPalette || null,
        google_places_data: createSiteData.googlePlacesData || null,
        yelp_url: createSiteData.yelpUrl || null,
        query: null,
        palette: palette ?? undefined,
        font_family: fontFamily ?? undefined,
      });
      clearCreateSiteData();
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      await queryClient.refetchQueries({ queryKey: ["currentUser"] });
      // Set generation state in context and navigate to dashboard
      setActiveGeneration({
        generationVersionId: generationResponse.generation_version_id,
        type: 'fresh',
        fromCreateSite: true
      });
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      // Don't re-set pending flag if error is due to insufficient credits
      const isInsufficientCredits = error?.code === ERROR_CODES.INSUFFICIENT_CREDITS || error?.code === ERROR_CODES.QUOTA_EXCEEDED;
      if (!isInsufficientCredits) {
        setPendingBusinessDataCreation();
      }
    } finally {
      setIsStartingGeneration(false);
      setIsPendingCreateSiteTrigger(false);
    }
  };

  // Handler for manual "Start Generation" button click
  const handleStartGeneration = async () => {
    setJustVerified(false);
    await triggerPendingGeneration();
  };

  useEffect(() => {
    const createBusinessFromPendingData = async () => {
      if (isLoadingUser) {
        return;
      }
      if (!hasPendingBusinessDataCreation()) {
        return;
      }
      if (!currentUser?.email) {
        console.log("Waiting for user data to be available...");
        return;
      }
      
      // EMAIL VERIFICATION GATE
      // Skip auto-trigger if email is not verified (banner will show instead)
      if (!currentUser?.verified) {
        console.log("Waiting for email verification before generation...");
        return;
      }
      
      // Skip auto-trigger if user just verified (wait for button click)
      // This gives user control after verifying their email
      if (justVerified) {
        console.log("Just verified - waiting for user to click Start Generation");
        return;
      }
      
      // Auto-trigger for:
      // - Verified returning users (verified && !justVerified)
      // - Google OAuth users (auto-verified on signup)
      const createSiteData = getCreateSiteData();
      if (createSiteData.businessName) {
        await triggerPendingGeneration();
      } else {
        clearPendingBusinessDataCreation();
        clearCreateSiteData();
      }
    };
    createBusinessFromPendingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.email, currentUser?.business_id, currentUser?.verified, isLoadingUser, justVerified, createBusinessMutation, generationMutation]);

  const handleClosePublishDialog = () => {
    setPublishDialogOpen(false);
    setPublishHtmlContent(null);
    setPreCompletedPublishResult(null);
    publishMutation.reset();
  };

  const loadingOverlay = isProcessingPayment ? createPortal(
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
            Processing Transasction...
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              maxWidth: 300
            }}
          >
            Payment confirmed! Please wait while we process your transaction.
          </Typography>
        </Box>
      </Box>
    </Box>,
    document.body
  ) : null;

  return (
    <DashboardV2Layout>
      {/* Full-screen loading overlay rendered via portal */}
      {loadingOverlay}

      <Box sx={{ 
        maxWidth: 'xl', 
        mx: 'auto', 
        width: '100%', 
        height: 'calc(100vh - 48px)',
        padding: "24px",
        display: 'flex',
        flexDirection: 'column',
        minHeight: '600px',
      }}>
        {/* Greeting Component */}
        <Box sx={{ flexShrink: 0 }}>
          <DashboardGreetingComponent />
        </Box>

        {/* Email Verification Banner - shows when user needs to verify email before generation */}
        {currentUser && hasPendingBusinessDataCreation() && (
          <EmailVerificationBanner
            email={currentUser.email}
            verified={currentUser.verified}
            justVerified={justVerified}
            hasPendingGeneration={true}
            onStartGeneration={handleStartGeneration}
            isGenerating={isStartingGeneration}
          />
        )}

        {/* Grid Layout for 4 Components */}
        <Grid2 container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
          {/* Left Column */}
          <Grid2 size={{ xs: 12, md: 8 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0 }}>
            {/* Website Component - Takes more space (Building Your Website placeholder while pending create-site trigger) */}
            <Box sx={{ flex: 1.7, minHeight: 0 }}>
              {isPendingCreateSiteTrigger ? <StartingGenerationPlaceholderView /> : <WebsiteComponent />}
            </Box>
            {/* Data Analytics Component */}
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <DataAnalyticsComponent 
                analyticsData={analyticsData}
                isLoading={isLoadingAnalytics}
                isPublished={isPublished}
              />
            </Box>
          </Grid2>

          {/* Right Column */}
          <Grid2 size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0 }}>
            {/* Forms Component */}
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <FormsComponent isPublished={isPublished} />
            </Box>
            {/* Media Component */}
            <Box sx={{ flex: 1.7, minHeight: 0 }}>
              <MediaComponent />
            </Box>
          </Grid2>
        </Grid2>
      </Box>

      {/* Publish Dialog */}
      <PublishDialog
        open={publishDialogOpen}
        onClose={handleClosePublishDialog}
        htmlContent={publishHtmlContent}
        preCompletedPublishResult={preCompletedPublishResult}
      />

      {/* Loading overlay - hidden during pending create-site trigger so only the box shows Building Your Website */}
      <CreateSiteLoading isVisible={isStartingGeneration && !isPendingCreateSiteTrigger} />
    </DashboardV2Layout>
  );
};

export default DashboardV2;
