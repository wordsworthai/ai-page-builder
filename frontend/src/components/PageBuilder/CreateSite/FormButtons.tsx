import { Button, styled } from "@mui/material";

export const NextButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.brand?.primaryCta || theme.palette.primary.main,
  color: theme.palette.brand?.primaryCtaText || theme.palette.primary.contrastText,
  fontFamily: '"General Sans", sans-serif',
  fontWeight: 600,
  fontSize: "16px",
  letterSpacing: "-0.32px",
  lineHeight: 1,
  textTransform: "none",
  borderRadius: "12px",
  padding: "16px 24px",
  minWidth: "126.5px",
  boxShadow: "none",
  transition: "all 0.2s ease-out",
  "&:hover": {
    backgroundColor: theme.palette.brand?.primaryCta || theme.palette.primary.main,
    opacity: 0.9,
    boxShadow: "none",
  },
  "&:disabled": {
    backgroundColor: theme.palette.brand?.primaryCta || theme.palette.primary.main,
    color: theme.palette.brand?.primaryCtaText || theme.palette.primary.contrastText,
    opacity: 0.5,
  },
}));

export const BackButton = styled(Button)({
  backgroundColor: "#e0e0e0",
  color: "#7f7f7f",
  fontFamily: '"General Sans", sans-serif',
  fontWeight: 600,
  fontSize: "16px",
  letterSpacing: "-0.32px",
  lineHeight: 1,
  textTransform: "none",
  borderRadius: "12px",
  padding: "16px 24px",
  minWidth: "126.5px",
  boxShadow: "none",
  transition: "all 0.2s ease-out",
  "&:hover": {
    backgroundColor: "#d0d0d0",
    boxShadow: "none",
  },
});


