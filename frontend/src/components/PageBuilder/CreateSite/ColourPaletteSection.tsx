import { useState, useEffect } from "react";
import { Box, Typography, styled } from "@mui/material";
import { AutoAwesome } from "@mui/icons-material";
import { NextButton, BackButton } from "./FormButtons";
import { FormCard, FormContent, FormTitle, FormButtonContainer } from "./SharedFormStyles";
import ColorPalette from "./ColorPalette";
import { colorCategories, ColorScheme } from "./colorPaletteConstants";

const CurrentSchemeContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px"
});

const CurrentSchemeLabel = styled(Typography)({
  fontFamily: '"General Sans", sans-serif',
  fontWeight: 600,
  fontSize: "14px",
  lineHeight: 1,
  letterSpacing: "-0.28px",
  color: "#565656",
  margin: 0,
});

const CurrentSchemeSwatches = styled(Box)({
  display: "flex",
  filter: "drop-shadow(0px 7px 29px rgba(100, 100, 111, 0.2))",
});

const CurrentSchemeSwatch = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  flex: 1,
  "&:first-of-type > *:first-of-type": {
    borderTopLeftRadius: "8px",
    borderBottomLeftRadius: "8px",
  },
  "&:last-child > *:first-of-type": {
    borderTopRightRadius: "8px",
    borderBottomRightRadius: "8px",
  },
});

const SwatchBox = styled(Box)<{ color: string }>(({ color }) => ({
  width: "100%",
  aspectRatio: "1",
  backgroundColor: color,
  height: "85px",
}));

const SwatchLabel = styled(Typography)({
  fontFamily: '"General Sans", sans-serif',
  fontWeight: 500,
  fontSize: "12px",
  lineHeight: 1,
  letterSpacing: "-0.24px",
  color: "#565656",
  textAlign: "center",
  margin: 0,
});

const SuggestionsContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
});

const CategorySection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
});

const CategoryHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const CategoryLabel = styled(Typography)({
  fontFamily: '"General Sans", sans-serif',
  fontWeight: 600,
  fontSize: "14px",
  lineHeight: 1,
  letterSpacing: "-0.28px",
  color: "#565656",
  margin: 0,
});

const CategoryDescription = styled(Typography)({
  fontFamily: '"General Sans", sans-serif',
  fontWeight: 400,
  fontSize: "12px",
  lineHeight: 1.4,
  letterSpacing: "-0.24px",
  color: "#999",
  margin: 0,
});

const PalettesGrid = styled(Box)({
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "12px",
});

interface ColourPaletteSectionProps {
  selectedPalette?: string;
  onBack?: () => void;
  onNext?: (paletteId: string, colors: ColorScheme) => void;
  onChange?: (paletteId: string, colors: ColorScheme) => void;
}

const ColourPaletteSection = ({
  selectedPalette: initialPalette,
  onBack,
  onNext,
  onChange,
}: ColourPaletteSectionProps) => {
  const [selectedPalette, setSelectedPalette] = useState<string>(
    initialPalette || "minimal-1"
  );

  // Sync internal state with prop changes
  useEffect(() => {
    if (initialPalette !== undefined) {
      setSelectedPalette(initialPalette);
    }
  }, [initialPalette]);

  const getSelectedColors = (): ColorScheme => {
    for (const category of colorCategories) {
      const palette = category.palettes.find((p) => p.id === selectedPalette);
      if (palette) {
        return palette.colors;
      }
    }
    // Default to minimal-1
    return colorCategories[2].palettes[0].colors;
  };

  const currentColors = getSelectedColors();

  const handlePaletteSelect = (paletteId: string, colors: ColorScheme) => {
    setSelectedPalette(paletteId);
    if (onChange) {
      onChange(paletteId, colors);
    }
  };

  const handleNext = () => {
    if (selectedPalette && onNext) {
      onNext(selectedPalette, currentColors);
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
          <FormTitle>What colors best define your business?</FormTitle>

          <CurrentSchemeContainer>
            <CurrentSchemeLabel>Current Color Scheme</CurrentSchemeLabel>
            <CurrentSchemeSwatches>
              <CurrentSchemeSwatch>
                <SwatchBox color={currentColors.primary} />
                <SwatchLabel>Primary</SwatchLabel>
              </CurrentSchemeSwatch>
              <CurrentSchemeSwatch>
                <SwatchBox color={currentColors.secondary} />
                <SwatchLabel>Secondary</SwatchLabel>
              </CurrentSchemeSwatch>
              <CurrentSchemeSwatch>
                <SwatchBox color={currentColors.accent} />
                <SwatchLabel>Accent</SwatchLabel>
              </CurrentSchemeSwatch>
              <CurrentSchemeSwatch>
                <SwatchBox color={currentColors.background} />
                <SwatchLabel>Background</SwatchLabel>
              </CurrentSchemeSwatch>
            </CurrentSchemeSwatches>
          </CurrentSchemeContainer>

          <SuggestionsContainer>
            <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AutoAwesome sx={{ color: "#FFD700", fontSize: "20px" }} />
              <Typography
                sx={{
                  fontFamily: '"General Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: "14px",
                  lineHeight: 1,
                  letterSpacing: "-0.28px",
                  color: "#565656",
                }}
              >
                Suggestions
              </Typography>
            </Box>

            {colorCategories.map((category) => (
              <CategorySection key={category.id}>
                <CategoryHeader>
                  <CategoryLabel>{category.name}</CategoryLabel>
                  <CategoryDescription>({category.description})</CategoryDescription>
                </CategoryHeader>
                <PalettesGrid>
                  {category.palettes.map((palette) => (
                    <ColorPalette
                      key={palette.id}
                      primary={palette.colors.primary}
                      secondary={palette.colors.secondary}
                      accent={palette.colors.accent}
                      background={palette.colors.background}
                      selected={selectedPalette === palette.id}
                      onClick={() => handlePaletteSelect(palette.id, palette.colors)}
                    />
                  ))}
                </PalettesGrid>
              </CategorySection>
            ))}
          </SuggestionsContainer>
        </Box>

        <FormButtonContainer>
          <BackButton onClick={handleBack}>Back</BackButton>
          <NextButton onClick={handleNext}>Next</NextButton>
        </FormButtonContainer>
      </FormContent>
    </FormCard>
  );
};

export default ColourPaletteSection;

