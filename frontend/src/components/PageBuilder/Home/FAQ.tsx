import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  alpha,
  styled,
  useTheme,
  Fade,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Help, TrendingUp, Shield, Support } from "@mui/icons-material";

const FAQSectionWrapper = styled(Box)(({ theme }) => ({
  position: "relative",
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.primary.main, 0.02)} 0%, 
    ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(ellipse 50% 50% at 50% 50%, 
      ${alpha(theme.palette.primary.main, 0.03)} 0%, 
      transparent 70%)`,
    pointerEvents: "none",
    zIndex: 0,
  },
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  textAlign: "center",
  marginBottom: theme.spacing(8),
  position: "relative",
  zIndex: 1,
}));

const ModernAccordion = styled(Accordion)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(2),
  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.05)}`,
  "&::before": {
    display: "none",
  },
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.08)}`,
  },
  transition: "transform 0.2s ease-out, box-shadow 0.2s ease-out",
}));

const CategoryChip = styled(Chip)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  fontWeight: 600,
  fontSize: "0.75rem",
  marginBottom: theme.spacing(1),
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  width: 40,
  height: 40,
  borderRadius: theme.spacing(1),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.primary.main, 0.1)}, 
    ${alpha(theme.palette.secondary.main, 0.1)})`,
  marginRight: theme.spacing(2),
  "& .MuiSvgIcon-root": {
    fontSize: "1.5rem",
    color: theme.palette.primary.main,
  },
}));

interface FAQItem {
  question: string;
  answer: string;
  category: string;
  icon: React.ReactNode;
}

const faqData: FAQItem[] = [
  {
    question: "What is Wordsworth AI?",
    answer: "Wordsworth AI is an AI-powered website page builder. Describe your business and our AI generates a complete, professionally styled website — ready to edit visually and publish to a live URL in minutes.",
    category: "General",
    icon: <Help />,
  },
  {
    question: "Who is Wordsworth AI for?",
    answer: "Small businesses, freelancers, agencies, and anyone who needs a professional website without hiring a developer. If you can describe your business, Wordsworth AI can build your site.",
    category: "General",
    icon: <TrendingUp />,
  },
  {
    question: "How does the AI generation work?",
    answer: "Enter your business name and details. Our AI researches your business, selects the best page layout and sections, generates copy and imagery, and assembles a fully styled website — all in under a minute.",
    category: "Features",
    icon: <TrendingUp />,
  },
  {
    question: "Can I edit the website after it's generated?",
    answer: "Yes! Every generated website opens in our visual drag-and-drop editor. Rearrange sections, edit text, swap images, adjust colors, and customize every detail before publishing.",
    category: "Features",
    icon: <TrendingUp />,
  },
  {
    question: "Do I need any technical skills?",
    answer: "No coding or design experience needed. The entire workflow — from generation to editing to publishing — is visual and guided. Just describe your business and we handle the rest.",
    category: "Technical",
    icon: <Support />,
  },
  {
    question: "How do I publish my website?",
    answer: "Once you're happy with your site, hit Publish. Your website goes live on a unique URL instantly. You can also connect a custom domain for a fully branded experience.",
    category: "Technical",
    icon: <Support />,
  },
  {
    question: "Can I generate multiple websites?",
    answer: "Absolutely. Create as many websites as you need from your dashboard. Each site is independently editable and publishable — perfect for agencies managing multiple clients.",
    category: "Features",
    icon: <TrendingUp />,
  },
  {
    question: "What if I don't like the generated result?",
    answer: "You can regenerate your website with different preferences, or use the visual editor to make changes. The AI gives you a strong starting point — you have full control to refine it.",
    category: "Support",
    icon: <Support />,
  },
  {
    question: "Is my data secure?",
    answer: "Yes. Your business information and website content are stored securely. We use industry-standard encryption and never share your data with third parties.",
    category: "Licensing",
    icon: <Shield />,
  },
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Features": return <TrendingUp />;
    case "Technical": return <Support />;
    case "Support": return <Support />;
    case "Licensing": return <Shield />;
    default: return <Help />;
  }
};

interface FAQAccordionItemProps {
  faq: FAQItem;
  index: number;
}

const FAQAccordionItem: React.FC<FAQAccordionItemProps> = ({ faq, index }) => {
  const theme = useTheme();
  
  return (
    <Fade in timeout={600 + index * 100}>
      <ModernAccordion>
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon />}
          sx={{ 
            py: 1,
            "& .MuiAccordionSummary-content": {
              alignItems: "center",
            }
          }}
        >
          <Stack direction="row" alignItems="center" sx={{ width: "100%" }}>
            <IconWrapper>
              {getCategoryIcon(faq.category)}
            </IconWrapper>
            <Box sx={{ flex: 1 }}>
              <CategoryChip label={faq.category} size="small" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {faq.question}
              </Typography>
            </Box>
          </Stack>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0, pb: 3, px: 3 }}>
          <Typography 
            sx={{ 
              color: "text.secondary", 
              lineHeight: 1.7,
              fontSize: "1rem",
              ml: 7 // Align with the text above
            }}
          >
            {faq.answer}
          </Typography>
        </AccordionDetails>
      </ModernAccordion>
    </Fade>
  );
};

interface FAQProps {
  noBg?: boolean;
}

const FAQ = ({ noBg }: FAQProps) => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById("faq");
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <FAQSectionWrapper
      id="faq"
      sx={{
        py: 12,
        position: "relative",
        zIndex: 1,
      }}
    >
      <Container maxWidth="lg">
        <Fade in={isVisible} timeout={600}>
          <SectionHeader>
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontWeight: 700,
                mb: 3,
                background: `linear-gradient(135deg, 
                  ${theme.palette.text.primary} 0%, 
                  ${theme.palette.primary.main} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Frequently Asked Questions
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{
                fontWeight: 400,
                lineHeight: 1.6,
                maxWidth: 600,
                mx: "auto",
              }}
            >
              Everything you need to know about getting started with our boilerplate
            </Typography>
          </SectionHeader>
        </Fade>

        <Box sx={{ maxWidth: 800, mx: "auto" }}>
          {faqData.map((faq, index) => (
            <FAQAccordionItem
              key={index}
              faq={faq}
              index={index}
            />
          ))}
        </Box>

        {/* Call to Action */}
        <Fade in={isVisible} timeout={1200}>
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Still have questions?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Our team is here to help you succeed with your project
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Chip
                label="📧 Email Support"
                variant="outlined"
                sx={{ py: 2, px: 1, fontSize: "0.9rem" }}
              />
              <Chip
                label="📚 Documentation"
                variant="outlined"
                sx={{ py: 2, px: 1, fontSize: "0.9rem" }}
              />
              <Chip
                label="🎥 Video Tutorials"
                variant="outlined"
                sx={{ py: 2, px: 1, fontSize: "0.9rem" }}
              />
            </Stack>
          </Box>
        </Fade>
      </Container>
    </FAQSectionWrapper>
  );
};

export default FAQ;
