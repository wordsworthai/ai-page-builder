import { Box, Typography, styled } from "@mui/material";

/**
 * Instructions text for CheckEmail page
 * Consistent typography styling
 */
export const StyledInstructionsText = styled(Typography)({
  fontFamily: "'General Sans', sans-serif",
  fontWeight: 500,
  fontSize: "14px",
  color: "#565656",
  lineHeight: 1.5,
});

/**
 * Container for instruction list items
 * Flex column layout with gap
 */
export const StyledInstructionsList = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
});

/**
 * Individual instruction item
 * Same styling as StyledInstructionsText
 */
export const StyledInstructionItem = styled(Typography)({
  fontFamily: "'General Sans', sans-serif",
  fontWeight: 500,
  fontSize: "14px",
  color: "#565656",
  lineHeight: 1.5,
});

/**
 * Help text container
 * Full width with center justification
 */
export const StyledHelpTextContainer = styled(Box)({
  width: "100%",
  display: "flex",
  justifyContent: "center",
});
