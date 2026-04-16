import React, { useState } from "react";
import { Box, Typography, TextField, Popover } from "@mui/material";
import { SketchPicker, ColorResult } from "react-color";
import { Palette as PaletteIcon } from "@mui/icons-material";
import type { FieldRenderProps } from "../types";
import { normalizeColorPickerValue } from "../utils/normalizeColorPickerValue";
import { useHighlightSafe } from "../../contexts";
import { parseFieldName } from "../utils/fieldNameParser";

/** Checkerboard pattern for transparent swatch / display. */
const CHECKERBOARD_SX = {
  backgroundColor: "#e0e0e0",
  backgroundImage: `linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
    linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
    linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)`,
  backgroundSize: "8px 8px",
  backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
} as const;

/**
 * Liquid color_picker:
 * Value may be a hex string (with/without #), "transparent", a JSON string, or null.
 * Renders a color picker UI with SketchPicker from react-color.
 * Clicking on the field highlights the corresponding element in the preview iframe.
 */
export function ColorPickerField({ field, name, value, onChange }: FieldRenderProps) {
  const labelText = field?.label || name;
  const elementId = field?.elementId;
  const sectionId = field?.sectionId;
  const parsed = parseFieldName(name);
  const blockType = field?.blockType || parsed.blockType || 'wwai_base_settings';
  const blockIndex = parsed.blockIndex;
  const normalizedColor = normalizeColorPickerValue(value);
  const { highlightElement, clearHighlights } = useHighlightSafe();
  
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [hexInput, setHexInput] = useState(normalizedColor);
  const [isFocused, setIsFocused] = useState(false);
  
  const open = Boolean(anchorEl);

  // Update hex input when value changes externally
  React.useEffect(() => {
    const normalized = normalizeColorPickerValue(value);
    setHexInput(normalized);
  }, [value]);

  const handleColorSwatchClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const handleColorChange = (color: ColorResult) => {
    const hexColor = color.hex;
    setHexInput(hexColor);
    onChange(hexColor);
  };

  const handleHexInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setHexInput(newValue);
    
    // Try to normalize and update if valid
    const normalized = normalizeColorPickerValue(newValue);
    if (normalized) {
      onChange(normalized);
    }
  };

  const handleHexInputBlur = () => {
    // Normalize on blur to ensure consistent format (hex or "transparent")
    const normalized = normalizeColorPickerValue(hexInput);
    if (normalized) {
      setHexInput(normalized);
      onChange(normalized);
    } else {
      // If invalid, revert to current value
      const currentNormalized = normalizeColorPickerValue(value);
      setHexInput(currentNormalized);
    }
  };

  const handleTransparentClick = () => {
    setHexInput("transparent");
    onChange("transparent");
  };

  const isTransparent = normalizedColor === "transparent";
  const displayColor = isTransparent ? undefined : (normalizedColor || "#000000");

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
        <PaletteIcon sx={{ fontSize: 18, color: "text.secondary" }} />
        <Typography variant="subtitle2">
          {labelText}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {/* Color Swatch - Clickable */}
        <Box
          onClick={handleColorSwatchClick}
          sx={{
            width: 44,
            height: 34,
            ...(isTransparent ? CHECKERBOARD_SX : { backgroundColor: displayColor }),
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            cursor: "pointer",
            transition: "transform 0.2s",
            "&:hover": {
              transform: "scale(1.05)",
            },
          }}
        />

        {/* Hex Input */}
        <TextField
          fullWidth
          value={hexInput}
          onChange={handleHexInputChange}
          onBlur={handleHexInputBlur}
          placeholder="#000000, rgb(...), or transparent"
          size="medium"
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: "background.paper",
            },
          }}
        />
      </Box>

      {/* Color Picker Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <Box sx={{ p: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          <Box
            onClick={handleTransparentClick}
            sx={{
              width: "100%",
              height: 28,
              ...CHECKERBOARD_SX,
              border: "1px solid black",
              borderColor: isTransparent ? "primary.main" : "divider",
              borderRadius: 1,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary" }}>
              Transparent
            </Typography>
          </Box>
          <SketchPicker
            color={isTransparent ? "#000000" : (normalizedColor || "#000000")}
            onChange={handleColorChange}
            disableAlpha
          />
        </Box>
      </Popover>
    </Box>
  );
}
