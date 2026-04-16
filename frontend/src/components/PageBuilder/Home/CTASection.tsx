import {
  Box,
  Container,
  Typography,
  Stack,
  styled,
  useTheme,
  Fade,
  Dialog,
  IconButton,
  Avatar,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ArrowForward, Close, AutoAwesome, Speed, Devices } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { StandardButton, CTAButton } from "@/components/Shared";
import BackgroundImage from "@/components/Shared/Common/BackgroundImage";
import brandBadgeImg from "@/assets/wwai_badge.png";

const CTAContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(8),
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "60vh",
}));


const CTAWrapper = styled(Box)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(3),
  padding: theme.spacing(6, 5),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: "0px 48px 100px 0px rgba(17, 12, 46, 0.15)",
  position: "relative",
  width: "68%",
  textAlign: "center",
}));

const CTAContent = styled(Box)(({ theme }) => ({
  position: "relative",
  zIndex: 1,
}));

// Purple badge with logo
const BrandBadge = styled(Box)(({ theme }) => ({
  display: "inline-block",
  marginBottom: "36px",
  textAlign: "center",
  "& img": {
    display: "block",
    width: "170px",
    height: "40px",
    objectFit: "contain",
    margin: "0 auto",
  },
}));

// Learn More Modal Styles
const LearnMoreDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    overflow: 'auto',
    borderRadius: theme.spacing(3),
    background: theme.palette.background.paper,
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    boxShadow: "0px 48px 100px 0px rgba(17, 12, 46, 0.15)",
    position: 'relative',
    maxWidth: 520,
    width: '100%',
    margin: theme.spacing(2),
  },
}));

const ModalHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4, 4, 2),
  textAlign: 'center',
  position: 'relative',
}));

const ModalCloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2),
  background: alpha(theme.palette.grey[300], 0.5),
  '&:hover': {
    background: alpha(theme.palette.grey[400], 0.5),
  },
}));

const ModalContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0, 4, 4),
}));

const FeatureItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

const FeatureIcon = styled(Avatar)(({ theme }) => ({
  width: 48,
  height: 48,
  background: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
}));

const CTASection = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    const section = document.getElementById("final-cta");
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  const handlePrimaryAction = () => {
    navigate("/create-site");
  };

  const handleOpenLearnMore = () => {
    setLearnMoreOpen(true);
  };

  const handleCloseLearnMore = () => {
    setLearnMoreOpen(false);
  };

  return (
    <Box 
      id="final-cta" 
      component="section" 
      sx={{ 
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: theme.palette.background.default,
        overflow: "hidden",
      }}
    >
      <BackgroundImage opacity={0.15} zIndex={0} />
      <CTAContainer maxWidth="lg">
        <Fade in={isVisible} timeout={800}>
          <CTAWrapper>
            <CTAContent>
              {/* Brand Badge */}
              <BrandBadge>
                <img src={brandBadgeImg} alt="Wordsworth AI" />
              </BrandBadge>

              {/* Main Headline */}
              <Typography
                component="h2"
                sx={{
                  fontFamily: '"General Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: { xs: "32px", md: "48px" },
                  lineHeight: 1,
                  letterSpacing: { xs: "-0.64px", md: "-0.96px" },
                  mb: "12px",
                  textAlign: "center",
                  whiteSpace: "pre-wrap",
                }}
              >
                <Box component="span" sx={{ color: "#878787" }}>
                  Unlock your company's
                </Box>
                <br />
                <Box component="span" sx={{ color: "#565656" }}>
                  full potential{" "}
                </Box>
                <Box component="span" sx={{ color: "#878787" }}>
                  with us.
                </Box>
              </Typography>

              {/* Description */}
              <Typography
                variant="body1"
                sx={{
                  fontFamily: '"General Sans", sans-serif',
                  fontWeight: 500,
                  fontSize: "20px",
                  lineHeight: 1.1,
                  letterSpacing: "-0.4px",
                  color: "#878787",
                  mb: "45px",
                  textAlign: "center",
                  whiteSpace: "pre-wrap",
                }}
              >
                Get a clean, high-performing website designed to grow your business.
              </Typography>

              {/* Action Buttons */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="center"
                alignItems="center"
              >
                <StandardButton
                  variant="contained"
                  color="inherit"
                  onClick={handleOpenLearnMore}
                  sx={{
                    backgroundColor: theme.palette.grey[300], // #E0E0E0 - matches Figma #e1e1e1
                    color: theme.palette.brand?.textColor || theme.palette.grey[600], // #565656
                    border: 'none',
                    boxShadow: 'none',
                    '&:hover': {
                      backgroundColor: theme.palette.grey[300],
                      opacity: 0.9,
                      boxShadow: 'none',
                    },
                    width: '165.61px'
                  }}
                >
                  Learn more
                </StandardButton>
                <CTAButton
                  onClick={handlePrimaryAction}
                  endIcon={<ArrowForward />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: 500,
                  }}
                >
                  Try for free
                </CTAButton>
              </Stack>
            </CTAContent>
          </CTAWrapper>
        </Fade>
      </CTAContainer>

      {/* Learn More Modal */}
      <LearnMoreDialog
        open={learnMoreOpen}
        onClose={handleCloseLearnMore}
        aria-labelledby="learn-more-dialog-title"
      >
        <ModalHeader>
          <ModalCloseButton onClick={handleCloseLearnMore} size="small">
            <Close fontSize="small" />
          </ModalCloseButton>

          <BrandBadge sx={{ mb: 2 }}>
            <img src={brandBadgeImg} alt="Wordsworth AI" />
          </BrandBadge>

          <Typography
            id="learn-more-dialog-title"
            component="h2"
            sx={{
              fontFamily: '"General Sans", sans-serif',
              fontWeight: 600,
              fontSize: { xs: "24px", md: "32px" },
              lineHeight: 1.2,
              letterSpacing: "-0.64px",
              color: "#565656",
              mb: 1,
            }}
          >
            AI-Powered Websites for Growing Businesses
          </Typography>

          <Typography
            variant="body1"
            sx={{
              fontFamily: '"General Sans", sans-serif',
              fontWeight: 500,
              fontSize: "16px",
              lineHeight: 1.4,
              color: "#878787",
            }}
          >
            We combine cutting-edge AI technology with proven design principles to create websites that convert.
          </Typography>
        </ModalHeader>

        <ModalContent>
          <FeatureItem>
            <FeatureIcon>
              <AutoAwesome />
            </FeatureIcon>
            <Box>
              <Typography
                sx={{
                  fontFamily: '"General Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: "18px",
                  color: "#565656",
                  mb: 0.5,
                }}
              >
                Smart Content Generation
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"General Sans", sans-serif',
                  fontWeight: 400,
                  fontSize: "14px",
                  color: "#878787",
                  lineHeight: 1.5,
                }}
              >
                Our AI analyzes your business to create compelling copy, optimized headlines, and engaging content that resonates with your audience.
              </Typography>
            </Box>
          </FeatureItem>

          <FeatureItem>
            <FeatureIcon>
              <Devices />
            </FeatureIcon>
            <Box>
              <Typography
                sx={{
                  fontFamily: '"General Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: "18px",
                  color: "#565656",
                  mb: 0.5,
                }}
              >
                Beautiful, Responsive Design
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"General Sans", sans-serif',
                  fontWeight: 400,
                  fontSize: "14px",
                  color: "#878787",
                  lineHeight: 1.5,
                }}
              >
                Every website is crafted with modern design standards, ensuring your business looks professional on any device.
              </Typography>
            </Box>
          </FeatureItem>

          <FeatureItem sx={{ mb: 0 }}>
            <FeatureIcon>
              <Speed />
            </FeatureIcon>
            <Box>
              <Typography
                sx={{
                  fontFamily: '"General Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: "18px",
                  color: "#565656",
                  mb: 0.5,
                }}
              >
                Launch in Minutes
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"General Sans", sans-serif',
                  fontWeight: 400,
                  fontSize: "14px",
                  color: "#878787",
                  lineHeight: 1.5,
                }}
              >
                No coding required. Our AI handles the technical complexity so you can focus on running your business.
              </Typography>
            </Box>
          </FeatureItem>

          <Stack spacing={2} sx={{ mt: 4 }}>
            <CTAButton
              onClick={() => {
                handleCloseLearnMore();
                navigate("/create-site");
              }}
              endIcon={<ArrowForward />}
              fullWidth
            >
              Get Started Free
            </CTAButton>
          </Stack>
        </ModalContent>
      </LearnMoreDialog>
    </Box>
  );
};

export default CTASection; 