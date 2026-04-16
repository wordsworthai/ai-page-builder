import React, { useState, useEffect } from "react";
import { Box, styled } from "@mui/material";
import { NextButton, BackButton } from "./FormButtons";
import PurposeCard from "./PurposeCard";
import { FormCard, FormContent, FormTitle, FormButtonContainer } from "./SharedFormStyles";

const PurposeGrid = styled(Box)({
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "16px",
  width: "100%",
});

export interface PurposeOption {
  id: string;
  title: string;
  description: string;
  icon?: string; 
  iconSelected?: string;
}

const defaultPurposeOptions: PurposeOption[] = [
  {
    id: "lead_generation",
    title: "Lead Generation",
    description: "Get more inquiries, calls, and bookings from potential customers.",
    icon: "PersonAdd",
    iconSelected: "PersonAddAltOutlined"
  },
  {
    id: "brand_credibility",
    title: "Brand Credibility",
    description: "Build trust with reviews, certifications, and a professional presence.",
    icon: "EmojiEvents",
    iconSelected: "EmojiEventsOutlined"
  },
  {
    id: "online_portfolio",
    title: "Online Portfolio",
    description: "Showcase your work, services, and past projects to win confidence.",
    icon: "WorkHistory",
    iconSelected: "WorkHistoryOutlined"
  },
  // {
  //   id: "customer_support",
  //   title: "Customer Support",
  //   description: "Provide FAQs, guides, and contact options to assist users anytime.",
  //   icon: "SupportAgent",
  //   iconSelected: "SupportAgentOutlined"
  // },
  // {
  //   id: "ecommerce_sales",
  //   title: "E-commerce Sales",
  //   description: "Sell products or services directly through a secure online store.",
  //   icon: "ShoppingCart",
  //   iconSelected: "ShoppingCartOutlined"
  // },
  // {
  //   id: "community_building",
  //   title: "Community Building",
  //   description: "Create a space for users to engage, share, and interact with your brand.",
  //   icon: "GroupAdd",
  //   iconSelected: "GroupAddOutlined"
  // },
  {
    id: "local_discovery",
    title: "Local Discovery",
    description: "Help nearby customers find and contact you through search and maps.",
    icon: "GroupAdd",
    iconSelected: "GroupAddOutlined"
  },
];


interface PurposeSelectionFormProps {
  selectedPurpose?: string;
  onBack?: () => void;
  onNext?: (purpose: string) => void;
  purposeOptions?: PurposeOption[];
}

const PurposeSelectionForm = ({ 
  selectedPurpose: initialPurpose,
  onBack,
  onNext,
  purposeOptions: providedPurposeOptions,
}: PurposeSelectionFormProps) => {
  const [selectedPurpose, setSelectedPurpose] = useState<string>(initialPurpose || "");
  const purposeOptions = providedPurposeOptions || defaultPurposeOptions;

  // Sync internal state with prop changes
  useEffect(() => {
    if (initialPurpose !== undefined) {
      setSelectedPurpose(initialPurpose);
    }
  }, [initialPurpose]);

  const handlePurposeSelect = (purposeId: string) => {
    setSelectedPurpose(purposeId);
  };

  const handleNext = () => {
    if (selectedPurpose && onNext) {
      onNext(selectedPurpose);
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
          <FormTitle>Tell us why you are creating this website.</FormTitle>
          
          <PurposeGrid>
            {purposeOptions.map((purpose) => {
              const isSelected = selectedPurpose === purpose.id;
              const iconName = isSelected ? (purpose.iconSelected || purpose.icon) : purpose.icon;
              if (!iconName) {
                return null;
              }
              return (
                <PurposeCard
                  key={purpose.id}
                  heading={purpose.title}
                  text={purpose.description}
                  icon={iconName}
                  selected={isSelected}
                  onClick={() => handlePurposeSelect(purpose.id)}
                />
              );
            })}
          </PurposeGrid>
        </Box>

        <FormButtonContainer>
          <BackButton onClick={handleBack}>
            Back
          </BackButton>
          <NextButton
            onClick={handleNext}
            disabled={!selectedPurpose}
          >
            Next
          </NextButton>
        </FormButtonContainer>
      </FormContent>
    </FormCard>
  );
};

export default PurposeSelectionForm;

