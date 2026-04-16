import { Box, Typography, styled } from "@mui/material";
import { ColorScheme } from "./colorPaletteConstants";

interface TonePreviewProps {
  tone?: string;
  colors?: ColorScheme;
  backgroundImage?: string;
  fontFamily?: string;
}

const PreviewContainer = styled(Box)({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  width: "100%",
  overflow: "auto",
  border: "2px solid #D7D7D7",
  backgroundColor: "#D7D7D7 !important"
});

const HeaderContainer = styled(Box)({
  width: "100%",
  padding: "18px",
});

const HeaderContent = styled(Box)({
  width: "100%",
  margin: "0 auto",
  borderRadius: "9px",
  padding: "8px 12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: "white",
});

const HeaderTitle = styled(Typography)({
  fontSize: "12px",
  fontWeight: 600,
  color: "#000000",
  fontFamily: '"General Sans", sans-serif',
});

const MenuIcon = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
});

const MenuBar = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'color',
})<{ color: string }>(({ color }) => ({
  width: "16px",
  height: "1.5px",
  backgroundColor: color,
}));

const HeroSection = styled(Box)({
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 8px",
  minHeight: 0,
});

const HeroContent = styled(Box)({
  width: "100%",
  margin: "0 auto",
  textAlign: "center",
  padding: "0 8px",
});

const Headline = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'fontFamily' && prop !== 'color',
})<{ fontFamily?: string; color?: string }>(({ fontFamily, color }) => ({
  fontSize: "28px",
  fontWeight: 700,
  lineHeight: 1.2,
  marginBottom: "12px",
  fontFamily: fontFamily || '"General Sans", sans-serif',
  color: color || "#000000",
}));

const Subheadline = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'fontFamily' && prop !== 'color',
})<{ fontFamily?: string; color?: string }>(({ fontFamily, color }) => ({
  fontSize: "16px",
  marginBottom: "12px",
  fontFamily: fontFamily || '"General Sans", sans-serif',
  lineHeight: 1.3,
  color: color || "#000000",
}));

const CTAButton = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'color',
})<{ color: string }>(({ color }) => ({
  padding: "6px 12px",
  borderRadius: "9px",
  color: "white",
  fontSize: "10px",
  fontWeight: 500,
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  backgroundColor: color,
  cursor: "pointer",
  transition: "opacity 0.2s",
  "&:hover": {
    opacity: 0.9,
  },
}));

const ArrowIcon = styled(Typography)({
  fontSize: "12px",
});

const ContentWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'backgroundImage' && prop !== 'primaryColor',
})<{ backgroundImage?: string; primaryColor?: string }>(({ backgroundImage, primaryColor }) => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  position: "relative",
  minHeight: 0,
  ...(backgroundImage && {
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      opacity: 0.5,
      zIndex: 0,
    },
    ...(primaryColor && {
      "&::after": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: primaryColor,
        opacity: 0.3,
        zIndex: 1,
      },
    }),
    "& > *": {
      position: "relative",
      zIndex: 2,
    },
  }),
}));

const DescriptionSection = styled(Box)({
  height: "30%"
});

const DescriptionContent = styled(Box)({
  height: "100%",
  width: "100%",
  borderBottomLeftRadius: "12px",
  borderBottomRightRadius: "12px",
  padding: "12px 16px",
  backgroundColor: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const DescriptionText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'fontFamily',
})<{ fontFamily?: string }>(({ fontFamily }) => ({
  fontSize: "12px",
  lineHeight: 1.4,
  textAlign: "center",
  fontFamily: fontFamily || '"General Sans", sans-serif',
}));

const toneConfigs: Record<string, {
  headline: string;
  subheadline: string;
  cta: string;
  description: string;
}> = {
  professional: {
    headline: "Beautiful outdoor spaces, done right",
    subheadline: "Professional landscaping services for homes and businesses",
    cta: "Book a site visit",
    description: "From precise lawn care to full-scale garden design, we create outdoor spaces that are functional, durable and easy to maintain. Our trained team follows structured processes, clear timelines and transparent pricing so you always know what to expect.",
  },
  friendly: {
    headline: "Let's make your yard the best on the block",
    subheadline: "Down-to-earth landscaping, just around the corner",
    cta: "Start your yard glow-up",
    description: "We listen to how you use your outdoor space and turn it into a place you actually enjoy spending time in. No jargon, no drama - just a friendly crew that shows up on time and cleans up before we leave.",
  },
  bold: {
    headline: "Turn your lawn into the best investment on your street",
    subheadline: "High-impact landscaping that boosts curb appeal and property value",
    cta: "Get my instant Quote",
    description: "Stop losing value to an average yard. Our landscape makeovers are designed to impress buyers, delight guests and reduce maintenance costs. From concept to completion, we move fast and deliver results you can see from the curb.",
  },
  minimal: {
    headline: "A quiet retreat, right outside your door",
    subheadline: "Thoughtful landscaping for peaceful outdoor living",
    cta: "Design my peaceful garden",
    description: "We design soft, balanced landscapes that feel restful the moment you step outside. Gentle lines, low-maintenance plants and subtle lighting come together to create an outdoor space that invites you to slow down and breathe.",
  }
};

const TonePreview = ({ tone, colors, backgroundImage, fontFamily }: TonePreviewProps) => {
  const config = tone ? (toneConfigs[tone] || toneConfigs.professional) : toneConfigs.professional;

  // Apply colors with fallback to defaults
  const colorScheme: ColorScheme = {
    primary: colors?.primary || "#000000",
    secondary: colors?.secondary || "#FFB3BA",
    accent: colors?.accent || "#B3E5FC",
    background: colors?.background || "#000000",
  };

  return (
    <PreviewContainer
      sx={{
        backgroundColor: colorScheme.background,
      }}
    >
      <ContentWrapper 
        backgroundImage={backgroundImage}
        primaryColor={colorScheme.primary}
      >
        {/* Header */}
        <HeaderContainer>
          <HeaderContent>
            <HeaderTitle>ABC Gardening</HeaderTitle>
            <MenuIcon>
              <MenuBar color="#000000" />
              <MenuBar color="#000000" />
              <MenuBar color="#000000" />
            </MenuIcon>
          </HeaderContent>
        </HeaderContainer>

        {/* Hero Section */}
        <HeroSection>
          <HeroContent>
            <Headline color={colorScheme.background} fontFamily={fontFamily}>{config.headline}</Headline>
            <Subheadline color={colorScheme.background} fontFamily={fontFamily}>{config.subheadline}</Subheadline>
            <CTAButton color={colorScheme.primary}>
              {config.cta}
              <ArrowIcon>→</ArrowIcon>
            </CTAButton>
          </HeroContent>
        </HeroSection>
      </ContentWrapper>

      {/* Description Section */}
      <DescriptionSection>
        <DescriptionContent>
          <DescriptionText fontFamily={fontFamily}>{config.description}</DescriptionText>
        </DescriptionContent>
      </DescriptionSection>
    </PreviewContainer>
  );
};

export default TonePreview;

