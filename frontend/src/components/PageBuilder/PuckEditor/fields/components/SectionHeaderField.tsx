import { Box, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import type { FieldRenderProps } from "../types";
import { useHighlightSafe } from "../../contexts";
import { parseFieldName } from "../utils/fieldNameParser";

/**
 * Section Header Field:
 * Renders a non-editable H1 header to group related settings by element_id.
 * The header text comes from field.headerText or field.label.
 * Clicking on the header highlights the corresponding element in the preview iframe.
 */
export function SectionHeaderField({ field, name }: FieldRenderProps) {
  const headerText = field?.headerText || field?.label || name;
  const elementId = field?.elementId;
  const sectionId = field?.sectionId;
  // Parse field name to extract block information (for block headers)
  const parsed = parseFieldName(name);
  const blockType = field?.blockType || parsed.blockType || 'wwai_base_settings';
  const blockIndex = parsed.blockIndex;
  const boxRef = useRef<HTMLDivElement>(null);
  const { highlightElement, clearHighlights } = useHighlightSafe();
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    // Apply border-top to the parent's parent element
    if (boxRef.current?.parentElement?.parentElement) {
      const grandParent = boxRef.current.parentElement.parentElement;
      grandParent.style.borderTop = "1px solid #9E9E9E";
      grandParent.style.paddingTop = "16px";
      grandParent.style.paddingBottom = "8px";
      return () => {
        grandParent.style.borderTop = "";
        grandParent.style.paddingTop = "";
        grandParent.style.paddingBottom = "";
      };
    }
  }, []);

  const handleClick = () => {
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
      ref={boxRef}
      onClick={handleClick}
      onBlur={handleBlur}
      onMouseLeave={handleMouseLeave}
      tabIndex={0}
      sx={{ 
        width: "100%",
        cursor: elementId ? "pointer" : "default",
        "&:hover": elementId ? {
          backgroundColor: "rgba(0, 0, 0, 0.04)",
        } : {},
      }}
    >
      <Typography 
        variant="h6" 
        component="h2"
        sx={{ 
          fontWeight: 600,
          color: "#111827",
          fontSize: "0.875rem",
          textAlign: "center"
        }}
      >
        {headerText}
      </Typography>
    </Box>
  );
}

