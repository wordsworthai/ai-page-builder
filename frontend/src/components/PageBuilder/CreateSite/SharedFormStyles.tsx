import { Box, Typography, styled } from "@mui/material";

export const FormCard = styled(Box)(({ theme }) => ({
  background: "white",
  borderRadius: "24px",
  boxShadow: "0px 48px 100px 0px rgba(17, 12, 46, 0.15)",
  padding: "36px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  height: "100%",
  flex: "1 0 0",
}));

export const FormContent = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "24px",
  flex: 1,
  justifyContent: "space-between",
  minHeight: 0,
});

export const FormTitle = styled(Typography)({
  fontFamily: '"General Sans", sans-serif',
  fontWeight: 600,
  fontSize: "16px",
  lineHeight: 1,
  letterSpacing: "-0.32px",
  color: "#565656",
});

export const FormButtonContainer = styled(Box)({
  display: "flex",
  gap: "12px",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
});

