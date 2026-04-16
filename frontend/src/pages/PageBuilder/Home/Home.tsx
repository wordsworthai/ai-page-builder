import { styled } from "@mui/material";
import { alpha } from "@mui/material/styles";
// import { useTheme } from "@mui/material/styles";
// import HeroSection from "@/components/PageBuilder/Home/HeroSection";
// import StatsSection from "@/components/PageBuilder/Home/StatsSection";
// import FeaturesSection from "@/components/PageBuilder/Home/FeaturesSection";
// import TestimonialsSection from "@/components/PageBuilder/Home/TestimonialsSection";
// import PricingPreviewSection from "@/components/PageBuilder/Home/PricingPreviewSection";
// import FAQ from "@/components/PageBuilder/Home/FAQ";
import CTASection from "@/components/PageBuilder/Home/CTASection";

// Main page container with dynamic background
const HomePageContainer = styled("main")(({ theme }) => ({
  width: "100%",
  minHeight: "100vh",
  position: "relative",
  scrollBehavior: "smooth",
  overflow: "hidden",
  
  // Base background with subtle gradient
  background: `linear-gradient(180deg, 
    ${theme.palette.background.default} 0%,
    ${alpha(theme.palette.background.paper, 0.8)} 25%,
    ${theme.palette.background.default} 50%,
    ${alpha(theme.palette.primary.main, 0.02)} 75%,
    ${theme.palette.background.default} 100%)`,
    
  ...theme.applyStyles("dark", {
    background: `linear-gradient(180deg, 
      ${theme.palette.background.default} 0%,
      ${alpha(theme.palette.background.paper, 0.3)} 25%,
      ${theme.palette.background.default} 50%,
      ${alpha(theme.palette.primary.main, 0.05)} 75%,
      ${theme.palette.background.default} 100%)`,
  }),
}));

// Individual section containers with consistent hero-aligned backgrounds
// const StatsWrapper = styled(Box)(({ theme }) => ({
//   position: "relative",
//   zIndex: 1,
//   background: `linear-gradient(135deg, 
//     ${theme.palette.background.default} 0%, 
//     ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
    
//   ...theme.applyStyles("dark", {
//     background: `linear-gradient(135deg, 
//       ${theme.palette.background.default} 0%, 
//       ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
//   }),
  
//   "&::before": {
//     content: '""',
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     background: `radial-gradient(ellipse 70% 40% at 20% 80%, 
//       ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
//     ...theme.applyStyles("dark", {
//       background: `radial-gradient(ellipse 70% 40% at 20% 80%, 
//         ${alpha(theme.palette.primary.main, 0.15)}, transparent)`,
//     }),
//     pointerEvents: "none",
//     zIndex: 0,
//   },
// }));

// const FeaturesWrapper = styled(Box)(({ theme }) => ({
//   position: "relative",
//   zIndex: 1,
//   background: `linear-gradient(135deg, 
//     ${theme.palette.background.default} 0%, 
//     ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
    
//   ...theme.applyStyles("dark", {
//     background: `linear-gradient(135deg, 
//       ${theme.palette.background.default} 0%, 
//       ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
//   }),
  
//   "&::before": {
//     content: '""',
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     background: `radial-gradient(ellipse 80% 50% at 80% 20%, 
//       ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
//     ...theme.applyStyles("dark", {
//       background: `radial-gradient(ellipse 80% 50% at 80% 20%, 
//         ${alpha(theme.palette.primary.main, 0.15)}, transparent)`,
//     }),
//     pointerEvents: "none",
//     zIndex: 0,
//   },
// }));

// const TestimonialsWrapper = styled(Box)(({ theme }) => ({
//   position: "relative",
//   zIndex: 1,
//   background: `linear-gradient(135deg, 
//     ${theme.palette.background.default} 0%, 
//     ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
    
//   ...theme.applyStyles("dark", {
//     background: `linear-gradient(135deg, 
//       ${theme.palette.background.default} 0%, 
//       ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
//   }),
  
//   "&::before": {
//     content: '""',
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     background: `radial-gradient(ellipse 60% 80% at 50% 50%, 
//       ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
//     ...theme.applyStyles("dark", {
//       background: `radial-gradient(ellipse 60% 80% at 50% 50%, 
//         ${alpha(theme.palette.primary.main, 0.15)}, transparent)`,
//     }),
//     pointerEvents: "none",
//     zIndex: 0,
//   },
// }));

// const PricingWrapper = styled(Box)(({ theme }) => ({
//   position: "relative",
//   zIndex: 1,
//   background: `linear-gradient(135deg, 
//     ${theme.palette.background.default} 0%, 
//     ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
    
//   ...theme.applyStyles("dark", {
//     background: `linear-gradient(135deg, 
//       ${theme.palette.background.default} 0%, 
//       ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
//   }),
  
//   "&::before": {
//     content: '""',
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     background: `radial-gradient(ellipse 90% 60% at 30% 70%, 
//       ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
//     ...theme.applyStyles("dark", {
//       background: `radial-gradient(ellipse 90% 60% at 30% 70%, 
//         ${alpha(theme.palette.primary.main, 0.15)}, transparent)`,
//     }),
//     pointerEvents: "none",
//     zIndex: 0,
//   },
// }));

// const FAQWrapper = styled(Box)(({ theme }) => ({
//   position: "relative",
//   zIndex: 1,
//   background: `linear-gradient(135deg, 
//     ${theme.palette.background.default} 0%, 
//     ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
    
//   ...theme.applyStyles("dark", {
//     background: `linear-gradient(135deg, 
//       ${theme.palette.background.default} 0%, 
//       ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
//   }),
  
//   "&::before": {
//     content: '""',
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     background: `radial-gradient(ellipse 100% 40% at 70% 30%, 
//       ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
//     ...theme.applyStyles("dark", {
//       background: `radial-gradient(ellipse 100% 40% at 70% 30%, 
//         ${alpha(theme.palette.primary.main, 0.15)}, transparent)`,
//     }),
//     pointerEvents: "none",
//     zIndex: 0,
//   },
// }));


const HomePage = () => {
  // const theme = useTheme();
  
  return (
    <HomePageContainer>
      {/* 7. Final CTA Section - Convert to Action */}
      <CTASection />

      {/* 1. Hero Section - First Impression & Value Proposition */}
      {/* <Box sx={{ position: "relative", zIndex: 2 }}>
        <HeroSection />
      </Box> */}

      {/* 2. Stats Section - Social Proof & Credibility */}
      {/* <StatsWrapper>
        <StatsSection />
      </StatsWrapper> */}

      {/* 3. Features Section - Product Capabilities & Benefits */}
      {/* <FeaturesWrapper id="features">
        <FeaturesSection />
      </FeaturesWrapper> */}

      {/* 4. Testimonials Section - Trust & Social Validation */}
      {/* <TestimonialsWrapper id="testimonials">
        <TestimonialsSection />
      </TestimonialsWrapper> */}

      {/* 5. Pricing Preview - Value Proposition & Options */}
      {/* <PricingWrapper>
        <PricingPreviewSection />
      </PricingWrapper> */}

      {/* 6. FAQ Section - Address Objections & Concerns */}
      {/* <FAQWrapper id="faq">
        <FAQ />
      </FAQWrapper> */}
      
    </HomePageContainer>
  );
};

export default HomePage;
