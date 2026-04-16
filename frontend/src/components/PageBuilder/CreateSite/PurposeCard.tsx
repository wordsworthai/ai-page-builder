import React from "react";
import { Box, Typography, styled } from "@mui/material";
import * as MuiIcons from "@mui/icons-material";

const StyledPurposeCard = styled(Box)<{ selected: boolean }>(({ selected }) => ({
  width: "100%",
  minHeight: "180px",
  backgroundColor: selected ? "#7a80dc" : "#efefef",
  borderRadius: "12px",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  cursor: "pointer",
  transition: "all 0.2s ease-out",
  "&:hover": {
    backgroundColor: selected ? "#7a80dc" : "#E3E5FF",
    transform: "translateY(-2px)",
    boxShadow: selected 
      ? "0px 4px 12px rgba(122, 128, 220, 0.3)" 
      : "0px 4px 12px rgba(0, 0, 0, 0.1)",
  },
  "@media (max-width: 768px)": {
    minHeight: "160px",
    padding: "20px",
  },
}));

const PurposeIcon = styled(Box)<{ selected: boolean }>(({ selected }) => ({
  width: "32px",
  height: "32px",
  flexShrink: 0,
  marginBottom: "32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "& svg": {
    width: "100%",
    height: "100%",
    color: selected ? "white" : "#565656",
  },
}));

const TextContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  marginTop: "auto",
});

const PurposeTitle = styled(Typography)<{ selected: boolean }>(({ selected }) => ({
  fontFamily: '"General Sans", sans-serif',
  fontWeight: 600,
  fontSize: "18px",
  lineHeight: 1.2,
  letterSpacing: "-0.36px",
  color: selected ? "white" : "#565656",
  margin: 0,
}));

const PurposeDescription = styled(Typography)<{ selected: boolean }>(({ selected }) => ({
  fontFamily: '"General Sans", sans-serif',
  fontWeight: 500,
  fontSize: "14px",
  lineHeight: 1.4,
  letterSpacing: "-0.28px",
  color: selected ? "white" : "#565656",
  margin: 0,
}));

const getMuiIcon = (iconName: string): React.ComponentType<any> | null => {
  const IconComponent = (MuiIcons as any)[iconName];
  return IconComponent || null;
};

interface PurposeCardProps {
  heading: string;
  text: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
}

const PurposeCard = ({ heading, text, icon, selected, onClick }: PurposeCardProps) => {
  const IconComponent = getMuiIcon(icon);
  
  return (
    <StyledPurposeCard selected={selected} onClick={onClick}>
      <PurposeIcon selected={selected}>
        <IconComponent />
      </PurposeIcon>
      <TextContainer>
        <PurposeTitle selected={selected}>
          {heading}
        </PurposeTitle>
        <PurposeDescription selected={selected}>
          {text}
        </PurposeDescription>
      </TextContainer>
    </StyledPurposeCard>
  );
};

export default PurposeCard;

