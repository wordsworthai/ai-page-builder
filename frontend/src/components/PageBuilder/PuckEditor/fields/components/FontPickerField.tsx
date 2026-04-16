import React, { useMemo, useState } from "react";
import { 
  Box, 
  Typography, 
  Select, 
  MenuItem, 
  FormControl, 
  TextField, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from "@mui/material";
import { TextFields as TextFieldsIcon, Edit } from "@mui/icons-material";
import type { FieldRenderProps } from "../types";
import { useHighlightSafe } from "../../contexts";
import { parseFieldName } from "../utils/fieldNameParser";

/**
 * Font families available for selection
 */
const FONT_FAMILIES = ["Londrina Solid", "Limelight", "Public Sans", "Oswald"];

/**
 * Font weight options with labels
 */
const FONT_WEIGHTS = [
  { value: "400", label: "400 - Regular" },
  { value: "500", label: "500 - Medium" },
  { value: "600", label: "600 - Semi Bold" },
  { value: "700", label: "700 - Bold" },
];

/**
 * Get weight label (e.g., "400" -> "400 - Regular")
 */
const getWeightLabel = (weight: string): string => {
  const weightMap: Record<string, string> = {
    "100": "Thin",
    "200": "Extra Light",
    "300": "Light",
    "400": "Regular",
    "500": "Medium",
    "600": "Semi Bold",
    "700": "Bold",
    "800": "Extra Bold",
    "900": "Black",
  };
  const label = weightMap[weight] || weight;
  return weight ? `${weight} - ${label}` : "";
};

/**
 * Format value for display in TextField
 * Input: "Londrina Solid|400"
 * Output: "Londrina Solid - Regular" or "None" if empty
 */
const formatDisplayValue = (value: string): string => {
  if (!value) return "None";
  const parts = value.split("|");
  const fontFamily = parts[0] || "";
  const fontWeight = parts[1] || "";
  if (!fontFamily || !fontWeight) return "None";
  const weightLabel = getWeightLabel(fontWeight);
  return `${fontFamily} - ${weightLabel.split(" - ")[1] || fontWeight}`;
};

/**
 * Liquid font_picker for "Font Family|Font Weight":
 * Renders a disabled text field with a button that opens a modal.
 * The modal contains two select dropdowns (font family and weight) on the left,
 * and a preview on the right.
 * Value is stored as a pipe-separated string: "FontFamily|FontWeight" (e.g., "Londrina Solid|400")
 * Clicking on the field highlights the corresponding element in the preview iframe.
 */
export function FontPickerField({ field, name, value, onChange }: FieldRenderProps) {
  const labelText = field?.label || name;
  const elementId = field?.elementId;
  const sectionId = field?.sectionId;
  // Parse field name to extract block information
  const parsed = parseFieldName(name);
  const blockType = field?.blockType || parsed.blockType || 'wwai_base_settings';
  const blockIndex = parsed.blockIndex;
  const stringValue = typeof value === "string" ? value : "";
  const { highlightElement, clearHighlights } = useHighlightSafe();
  const [isFocused, setIsFocused] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFontFamily, setModalFontFamily] = useState("");
  const [modalFontWeight, setModalFontWeight] = useState("");
  
  // Parse the pipe-separated value: "FontFamily|FontWeight"
  const [fontFamily, fontWeight] = useMemo(() => {
    if (!stringValue) return ["", ""];
    const parts = stringValue.split("|");
    return [parts[0] || "", parts[1] || ""];
  }, [stringValue]);
  
  // Format font family for CSS (add quotes and sans-serif fallback)
  const cssFontFamily = useMemo(() => {
    if (!modalFontFamily) return "";
    return `"${modalFontFamily}", sans-serif`;
  }, [modalFontFamily]);
  
  // Get weight label for modal preview
  const modalWeightLabel = getWeightLabel(modalFontWeight);
  
  // Get display text for modal preview
  const modalDisplayText = modalFontFamily && modalFontWeight 
    ? `${modalFontFamily} ${modalWeightLabel.split(" - ")[1] || modalFontWeight}` 
    : "";

  // Handle opening modal - parse current value and initialize modal state
  const handleOpenModal = () => {
    if (stringValue) {
      const parts = stringValue.split("|");
      setModalFontFamily(parts[0] || "");
      setModalFontWeight(parts[1] || "");
    } else {
      // Default to first font and weight if no value
      setModalFontFamily(FONT_FAMILIES[0] || "");
      setModalFontWeight(FONT_WEIGHTS[0]?.value || "");
    }
    setIsModalOpen(true);
  };

  // Handle applying changes - combine selections and save
  const handleApply = () => {
    if (modalFontFamily && modalFontWeight) {
      const newValue = `${modalFontFamily}|${modalFontWeight}`;
      onChange(newValue);
    }
    setIsModalOpen(false);
  };

  // Handle canceling - reset modal state and close
  const handleCancel = () => {
    // Reset to current value
    if (stringValue) {
      const parts = stringValue.split("|");
      setModalFontFamily(parts[0] || "");
      setModalFontWeight(parts[1] || "");
    } else {
      setModalFontFamily("");
      setModalFontWeight("");
    }
    setIsModalOpen(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (elementId) {
      highlightElement(elementId, sectionId, blockType, blockIndex);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    clearHighlights();
  };

  const handleMouseLeave = () => {
    // Only clear if not focused (not actively editing)
    if (!isFocused) {
      clearHighlights();
    }
  };
  
  return (
    <Box 
      sx={{ width: "100%" }}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseLeave={handleMouseLeave}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <TextFieldsIcon sx={{ fontSize: 18, color: "text.primary" }} />
        <Typography variant="subtitle2">
          {labelText}
        </Typography>
      </Box>
      
      {/* ReadOnly TextField + Button */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          value={formatDisplayValue(stringValue)}
          placeholder=""
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
        />
        <IconButton
          aria-label="Choose Font"
          title="Choose Font"
          onClick={handleOpenModal}
          sx={{
            color: "white",
            backgroundColor: "#434775",
            "&:hover": {
              backgroundColor: "white",
              color: "#434775",
            },
            "&:focus": {
              outline: "none",
              boxShadow: "none",
            },
            "&:focus-visible": {
              outline: "none",
              boxShadow: "none",
            },
            "&.Mui-focusVisible": {
              outline: "none",
              boxShadow: "none",
            },
          }}
        >
          <Edit fontSize="small" />
        </IconButton>
      </Box>

      {/* Font Selection Modal */}
      <Dialog
        open={isModalOpen}
        onClose={handleCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select Font</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", alignItems: 'center', gap: 3, mt: 1 }}>
            {/* Left Column: Font Family and Weight Selects */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flex: "0 0 300px" }}>
              <FormControl fullWidth size="small">
                <Typography variant="caption" sx={{ mb: 0.5, color: "text.primary" }}>
                  Font Family
                </Typography>
                <Select
                  value={modalFontFamily}
                  onChange={(e) => setModalFontFamily(e.target.value)}
                >
                  {FONT_FAMILIES.map((font) => (
                    <MenuItem key={font} value={font}>
                      {font}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <Typography variant="caption" sx={{ mb: 0.5, color: "text.primary" }}>
                  Font Weight
                </Typography>
                <Select
                  value={modalFontWeight}
                  onChange={(e) => setModalFontWeight(e.target.value)}
                >
                  {FONT_WEIGHTS.map((weight) => (
                    <MenuItem key={weight.value} value={weight.value}>
                      {weight.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Right Column: Preview */}
            <Box sx={{ flex: 1, mt: 1.5 }}>
              {modalFontFamily && modalFontWeight ? (
                <Box
                  sx={{
                    backgroundColor: "background.paper",
                    borderRadius: 2,
                    p: 2,
                    border: "2px solid",
                    borderColor: "primary.main",
                    boxShadow: 3
                  }}
                >
                  {/* Large Preview Text */}
                  {modalDisplayText && (
                    <Typography
                      variant="h4"
                      sx={{
                        fontFamily: cssFontFamily,
                        fontWeight: parseInt(modalFontWeight) || 400,
                        mb: 2,
                        color: "text.primary",
                      }}
                    >
                      {modalDisplayText}
                    </Typography>
                  )}
                  
                  {/* Pangram Preview */}
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: cssFontFamily,
                      fontWeight: parseInt(modalFontWeight) || 400,
                      color: "text.primary",
                    }}
                  >
                    The quick brown fox jumps over the lazy dog
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    backgroundColor: "background.paper",
                    borderRadius: 2,
                    p: 2,
                    border: "1px dashed",
                    borderColor: "divider",
                    textAlign: "center",
                    color: "text.primary",
                  }}
                >
                  <Typography variant="body2">
                    Select a font family and weight to see preview
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleApply} variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

