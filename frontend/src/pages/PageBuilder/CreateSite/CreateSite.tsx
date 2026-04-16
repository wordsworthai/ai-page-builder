import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Container, styled, Box } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import BusinessInputForm from "@/components/PageBuilder/CreateSite/BusinessInputForm";
import PurposeSelectionForm from "@/components/PageBuilder/CreateSite/PurposeSelectionForm";
import ToneSelectionForm from "@/components/PageBuilder/CreateSite/ToneSelectionForm";
import ColourPaletteSection from "@/components/PageBuilder/CreateSite/ColourPaletteSection";
import PreviewPanel from "@/components/PageBuilder/CreateSite/PreviewPanel";
import ProgressSidebar from "@/components/PageBuilder/CreateSite/ProgressSidebar";
import CreateSiteLoading from "@/components/PageBuilder/CreateSite/CreateSiteLoading";
import { getCreateSiteData, saveCreateSiteData, setPendingBusinessDataCreation, clearPendingBusinessDataCreation, clearCreateSiteData, setPendingCreateSiteCreditsBlocked } from "@/utils/createSiteStorage";
import { useCurrentUser } from "@/hooks/api/Shared/Auth/useCurrentUser";
import { useCreateBusiness } from "@/hooks/api/PageBuilder/CreateSite/useCreateBusiness";
import { useGenerationTrigger } from "@/hooks/api/PageBuilder/Generation/useGenerationTrigger";
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useGenerationState } from "@/context/generation_state/useGenerationState";
import { useCreditsForAction } from "@/hooks/api/Shared/Billing/useCredits";
import { CreditConfirmationModal } from "@/components/PageBuilder/PuckEditor/components/LiquidEditor/modals/SidebarModal/editor/CreditConfirmationModal";
import background_image_preview from "@/assets/background_image_preview.png";
import { getCategoryFromPaletteId, getFontFamilyFromCategory } from "@/components/PageBuilder/CreateSite/colorPaletteConstants";
import { trackOnboardingStep } from '@/utils/productAnalytics';

const CreateSiteContainer = styled(Container)(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(3),
}));

const MainLayout = styled(Box)({
  display: "flex",
  gap: "24px",
  alignItems: "stretch",
  width: "100%",
  maxWidth: "100vw",
  margin: "0 auto",
});

const MainContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== "hasSidebar",
})<{ hasSidebar?: boolean }>(({ hasSidebar }) => ({
  flex: hasSidebar ? "1 0 0" : "none",
  display: "flex",
  flexDirection: "column",
  ...(hasSidebar ? {} : { width: "100%", maxWidth: "600px", margin: "0 auto" }),
}));

const SidebarContainer = styled(Box)({
  width: "17vw",
  flexShrink: 0,
  height: "75vh",
  display: "flex",
  flexDirection: "column",
});

const PreviewContainer = styled(Box)({
  width: "24vw",
  flexShrink: 0,
  height: "75vh",
  display: "flex",
  flexDirection: "column",
});

type CreateSiteStep = "business-info" | "purpose-selection" | "tone-selection" | "color-palette-selection";

const CreateSitePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();
  const [currentStep, setCurrentStep] = useState<CreateSiteStep>("business-info");
  const [savedData, setSavedData] = useState(getCreateSiteData());
  const [isLoading, setIsLoading] = useState(false);
  const createBusinessMutation = useCreateBusiness();
  const { clearActiveGeneration, setActiveGeneration } = useGenerationState();
  const { mutateAsync: triggerGeneration } = useGenerationTrigger();
  const { cost: generationCost, balance: currentBalance, hasEnoughCredits } = useCreditsForAction('create_site');
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [pendingPaletteData, setPendingPaletteData] = useState<{
    paletteId: string;
    colors: { primary: string; secondary: string; accent: string; background: string };
  } | null>(null);

  useEffect(() => {
    const data = getCreateSiteData();
    setSavedData(data);
  }, []);

  // Restore step when returning from billing after credit purchase
  useEffect(() => {
    const state = location.state as { fromBillingCredits?: boolean; step?: CreateSiteStep } | null;
    if (state?.fromBillingCredits && state?.step) {
      const validSteps: CreateSiteStep[] = [
        "business-info",
        "purpose-selection",
        "tone-selection",
        "color-palette-selection",
      ];
      if (validSteps.includes(state.step)) {
        setCurrentStep(state.step);
      }
    }
  }, [location.state]);

  const getStartStep = (): number => {
    switch (currentStep) {
      case "purpose-selection":
        return 1;
      case "tone-selection":
        return 4;
      case "color-palette-selection":
        return 7;
      case "business-info":
      default:
        return 1;
    }
  };

  const getMaxStep = (): number => {
    switch (currentStep) {
      case "purpose-selection":
        return 3;
      case "tone-selection":
        return 6;
      case "color-palette-selection":
        return 10;
      case "business-info":
      default:
        return 10;
    }
  };

  const handleBusinessInfoNext = (data: { businessName: string; googleUrl: string; yelpUrl: string; googlePlacesData?: any }) => {
    // Track analytics (non-blocking - fire and forget)
    trackOnboardingStep({
      business_name: data.businessName,
      google_maps_url: data.googleUrl,
      yelp_url: data.yelpUrl,
      google_places_data: data.googlePlacesData
    }).catch(err => {
      // Silently fail - don't block user flow
      console.error('Analytics tracking failed:', err);
    });
    saveCreateSiteData(data);
    setSavedData({ ...savedData, ...data });
    setCurrentStep("purpose-selection");
  };

  const handlePurposeNext = (purpose: string) => {
    saveCreateSiteData({ purpose });
    setSavedData({ ...savedData, purpose });
    setCurrentStep("tone-selection");
  };

  const handlePurposeBack = () => {
    setCurrentStep("business-info");
  };

  const handleToneChange = (tone: string) => {
    setSavedData({ ...savedData, tone });
  };

  const handleToneNext = (tone: string) => {
    saveCreateSiteData({ tone });
    setSavedData({ ...savedData, tone });
    setCurrentStep("color-palette-selection");
  };

  const handleToneBack = () => {
    setCurrentStep("purpose-selection");
  };

  const proceedWithGeneration = async (paletteId: string, colors: { primary: string; secondary: string; accent: string; background: string }) => {
    setIsLoading(true);
    try {
      // Step 1: Create/update business
      await createBusinessMutation.mutateAsync({
        business_name: savedData.businessName || undefined,
        google_maps_url: savedData.googleUrl || undefined,
        google_maps_data: savedData.googlePlacesData || undefined,
        yelp_url: savedData.yelpUrl || undefined,
        intent: savedData.purpose || undefined,
        tone: savedData.tone || undefined,
        color_palette_id: paletteId || undefined,
      });

      const paletteCategoryId = getCategoryFromPaletteId(paletteId);
      const fontFamily = getFontFamilyFromCategory(paletteCategoryId);
      let palette = { ...colors, palette_id: paletteId, category: paletteCategoryId };

      // Step 2: Trigger generation
      console.log('Triggering website generation...');
      const generationResponse = await triggerGeneration({
        business_name: savedData.businessName || currentUser!.email,
        website_intention: savedData.purpose || "generate_leads",
        website_tone: savedData.tone || "professional",
        color_palette_id: paletteId || null,
        google_places_data: savedData.googlePlacesData || null,
        yelp_url: savedData.yelpUrl || null,
        query: null,
        palette: palette,
        font_family: fontFamily
      });

      console.log('Generation triggered:', generationResponse);

      // Step 3: Clear localStorage
      clearPendingBusinessDataCreation();
      clearCreateSiteData();

      // Step 4: Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      await queryClient.refetchQueries({ queryKey: ["currentUser"] });

      // Step 5: Set active generation in context so dashboard starts polling
      clearActiveGeneration();
      setActiveGeneration({
        generationVersionId: generationResponse.generation_version_id,
        type: 'fresh',
        fromCreateSite: true,
      });
      navigate("/dashboard", { replace: true });

    } catch (error: any) {
      console.error("Failed to create business or trigger generation:", error);

      if (error.code === 'INSUFFICIENT_CREDITS' || error.code === 'QUOTA_EXCEEDED') {
        setPendingCreateSiteCreditsBlocked();
      } else {
        createSnackBar({
          content: "Failed to start website generation. Please try again.",
          autoHide: true,
          severity: "error",
        });
        setPendingBusinessDataCreation();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreditModalConfirm = () => {
    setShowCreditModal(false);
    if (pendingPaletteData) {
      proceedWithGeneration(pendingPaletteData.paletteId, pendingPaletteData.colors);
      setPendingPaletteData(null);
    }
  };

  const handleCreditModalClose = () => {
    setShowCreditModal(false);
    setPendingPaletteData(null);
  };

  const handleColorPaletteNext = async (paletteId: string, colors: { primary: string; secondary: string; accent: string; background: string }) => {
    saveCreateSiteData({ colorPalette: paletteId, colors });
    const updatedData = { ...savedData, colorPalette: paletteId, colors };
    setSavedData(updatedData);

    if (!isLoadingUser) {
      if (!currentUser?.email) {
        // User not authenticated - redirect to signup
        setPendingBusinessDataCreation();
        navigate("/signup");
      } else if (!currentUser?.verified) {
        // User is authenticated but email NOT verified - redirect to dashboard to show verification banner
        setPendingBusinessDataCreation();
        navigate("/dashboard");
      } else {
        // User is authenticated AND verified - check credits before proceeding (cost from API)
        if (generationCost !== undefined && hasEnoughCredits) {
          // Sufficient credits - proceed directly, no modal
          await proceedWithGeneration(paletteId, colors);
        } else if (generationCost !== undefined) {
          // Insufficient credits - show confirmation modal
          setPendingPaletteData({ paletteId, colors });
          setShowCreditModal(true);
        }
        // When generationCost is undefined (API loading), do nothing; user can retry
      }
    }
  };

  const handleColorPaletteChange = (paletteId: string, colors: { primary: string; secondary: string; accent: string; background: string }) => {
    setSavedData({ ...savedData, colorPalette: paletteId, colors });
  };

  const handleColorPaletteBack = () => {
    setCurrentStep("tone-selection");
  };

  const showSidebar = currentStep !== "business-info";
  const showPreview = currentStep === "tone-selection" || currentStep === "color-palette-selection";
  const shouldShowColors = currentStep === "color-palette-selection";
  const categoryId = savedData.colorPalette ? getCategoryFromPaletteId(savedData.colorPalette) : null;
  const fontFamily = getFontFamilyFromCategory(categoryId);

  return (
    <>
      <CreateSiteContainer>
        <MainLayout>
          {showPreview && (
            <PreviewContainer>
              <PreviewPanel 
                selectedTone={savedData.tone}
                colors={shouldShowColors ? savedData.colors : undefined}
                backgroundImage={shouldShowColors ? background_image_preview : undefined}
                fontFamily={shouldShowColors ? fontFamily : undefined}
              />
            </PreviewContainer>
          )}
          
          <MainContent hasSidebar={showSidebar}>
            {currentStep === "business-info" ? (
              <BusinessInputForm onNext={handleBusinessInfoNext} />
            ) : currentStep === "purpose-selection" ? (
              <PurposeSelectionForm
                selectedPurpose={savedData.purpose}
                onBack={handlePurposeBack}
                onNext={handlePurposeNext}
              />
            ) : currentStep === "tone-selection" ? (
              <ToneSelectionForm
                selectedTone={savedData.tone}
                onBack={handleToneBack}
                onNext={handleToneNext}
                onChange={handleToneChange}
              />
            ) : (
              <ColourPaletteSection
                selectedPalette={savedData.colorPalette}
                onBack={handleColorPaletteBack}
                onNext={handleColorPaletteNext}
                onChange={handleColorPaletteChange}
              />
            )}
          </MainContent>
          
          {showSidebar && (
            <SidebarContainer>
              <ProgressSidebar startStep={getStartStep()} maxStep={getMaxStep()} />
            </SidebarContainer>
          )}
        </MainLayout>
      </CreateSiteContainer>
      
      {/* Loading overlay - shown when checking user status or creating business */}
      <CreateSiteLoading isVisible={isLoadingUser || isLoading} />

      {/* Credit confirmation modal - shown when insufficient credits */}
      <CreditConfirmationModal
        open={showCreditModal}
        onClose={handleCreditModalClose}
        actionType="create_site"
        onConfirm={handleCreditModalConfirm}
        returnOrigin={{ path: '/create-site', context: { step: currentStep } }}
      />
    </>
  );
};

export default CreateSitePage;