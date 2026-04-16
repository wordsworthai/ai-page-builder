import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography, styled } from "@mui/material";
import * as MuiIcons from "@mui/icons-material";
import { NextButton, BackButton } from "./FormButtons";
import { FormCard, FormContent, FormTitle, FormButtonContainer } from "./SharedFormStyles";

const ToneGrid = styled(Box)({
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gridTemplateRows: "repeat(2, 1fr)",
  gap: "12px",
  width: "100%",
  height: "337.33px",
});

const ToneCard = styled(Box)<{ selected: boolean }>(({ selected }) => ({
  backgroundColor: selected ? "#7a80dc" : "#efefef",
  borderRadius: "12px",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  cursor: "pointer",
  transition: "all 0.2s ease-out",
  overflow: "hidden",
  "&:hover": {
    backgroundColor: selected ? "#7a80dc" : "#E3E5FF",
    transform: "translateY(-2px)",
    boxShadow: selected 
      ? "0px 4px 12px rgba(122, 128, 220, 0.3)" 
      : "0px 4px 12px rgba(0, 0, 0, 0.1)",
  },
}));

const ToneIcon = styled(Box)<{ selected: boolean }>(({ selected }) => ({
  width: "24px",
  height: "24px",
  flexShrink: 0,
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

const ToneTitle = styled(Typography)<{ selected: boolean }>(({ selected }) => ({
  fontFamily: '"General Sans", sans-serif',
  fontWeight: 600,
  fontSize: "16px",
  lineHeight: 1,
  letterSpacing: "-0.32px",
  color: selected ? "white" : "#565656",
  margin: 0,
}));

const ToneDescription = styled(Typography)<{ selected: boolean }>(({ selected }) => ({
  fontFamily: '"General Sans", sans-serif',
  fontWeight: 500,
  fontSize: "12px",
  lineHeight: "normal",
  letterSpacing: "-0.24px",
  color: selected ? "white" : "#565656",
  margin: 0,
}));


export interface ToneOption {
  id: string;
  title: string;
  description: string;
  icon?: string;
  iconSelected?: string;
}

const defaultToneOptions: ToneOption[] = [
  {
    id: "professional",
    title: "Professional",
    description: "Clear, confident, and polished language that builds trust and credibility.",
    icon: "Work",
    iconSelected: "WorkOutlineOutlined"
  },
  {
    id: "friendly",
    title: "Friendly",
    description: "Warm, welcoming, and conversational tone that feels approachable.",
    icon: "LocalCafe",
    iconSelected: "LocalCafeOutlined"
  },
  {
    id: "bold",
    title: "Bold",
    description: "Strong, energetic, and attention-grabbing statements that stand out.",
    icon: "Whatshot",
    iconSelected: "WhatshotOutlined"
  },
  {
    id: "minimal",
    title: "Minimal",
    description: "Clean, concise, and to-the-point messaging with zero fluff.",
    icon: "CropSquare",
    iconSelected: "CropSquareOutlined"
  },
];

interface ToneSelectionFormProps {
  selectedTone?: string;
  onBack?: () => void;
  onNext?: (tone: string) => void;
  onChange?: (tone: string) => void;
  toneOptions?: ToneOption[];
}

const getMuiIcon = (iconName: string | undefined): React.ComponentType<any> | null => {
  if (!iconName) return null;
  const IconComponent = (MuiIcons as any)[iconName];
  return IconComponent || null;
};

const ToneSelectionForm = ({ 
  selectedTone: initialTone,
  onBack,
  onNext,
  onChange,
  toneOptions: providedToneOptions,
}: ToneSelectionFormProps) => {
  const [selectedTone, setSelectedTone] = useState<string>(initialTone || "");
  const toneOptions = providedToneOptions || defaultToneOptions;

  // Sync internal state with prop changes
  useEffect(() => {
    if (initialTone !== undefined) {
      setSelectedTone(initialTone);
    }
  }, [initialTone]);

  const handleToneSelect = (toneId: string) => {
    setSelectedTone(toneId);
    if (onChange) {
      onChange(toneId);
    }
  };

  const handleNext = () => {
    if (selectedTone && onNext) {
      onNext(selectedTone);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <FormCard>
      <FormContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
          <FormTitle>Select the tone of your website.</FormTitle>
          
          <ToneGrid>
            {toneOptions.map((tone) => {
              const isSelected = selectedTone === tone.id;
              const iconName = isSelected ? (tone.iconSelected || tone.icon) : tone.icon;
              const IconComponent = iconName ? getMuiIcon(iconName) : null;
              return (
                <ToneCard
                  key={tone.id}
                  selected={isSelected}
                  onClick={() => handleToneSelect(tone.id)}
                >
                  <ToneIcon selected={isSelected}>
                    <IconComponent />
                  </ToneIcon>
                  <TextContainer>
                    <ToneTitle selected={isSelected}>
                      {tone.title}
                    </ToneTitle>
                    <ToneDescription selected={isSelected}>
                      {tone.description}
                    </ToneDescription>
                  </TextContainer>
                </ToneCard>
              );
            })}
          </ToneGrid>
        </Box>

        <FormButtonContainer>
          <BackButton onClick={handleBack}>
            Back
          </BackButton>
          <NextButton
            onClick={handleNext}
            disabled={!selectedTone}
          >
            Next
          </NextButton>
        </FormButtonContainer>
      </FormContent>
    </FormCard>
  );
};

export default ToneSelectionForm;

