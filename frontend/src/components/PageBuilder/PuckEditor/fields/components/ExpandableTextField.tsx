import React, { useState, useRef, useEffect } from "react";
import { Box, Typography, TextField } from "@mui/material";
import type { FieldRenderProps } from "../types";
import { useHighlightSafe } from "../../contexts";
import { parseFieldName } from "../utils/fieldNameParser";

/**
 * Expandable text field that displays as a single line by default,
 * but expands to multi-line when focused/clicked.
 * 
 * Use this for fields where users might enter short or long text,
 * keeping the UI compact while allowing for expanded editing.
 */
export function ExpandableTextField({ field, name, value, onChange }: FieldRenderProps) {
  const labelText = field?.label || name;
  const elementId = field?.elementId;
  const sectionId = field?.sectionId;
  const parsed = parseFieldName(name);
  const blockType = field?.blockType || parsed.blockType || 'wwai_base_settings';
  const blockIndex = parsed.blockIndex;
  
  const { highlightElement, clearHighlights } = useHighlightSafe();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value ?? "");
  const textFieldRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local value when external value changes (e.g., undo/redo)
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value ?? "");
    }
  }, [value, isFocused]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    setIsExpanded(true);
    const len = (localValue ?? "").length;
    textFieldRef.current?.setSelectionRange(len, len);
    if (elementId) {
      highlightElement(elementId, sectionId, blockType, blockIndex);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setIsExpanded(false);
    clearHighlights();
  };

  const handleMouseLeave = () => {
    if (!isFocused) {
      clearHighlights();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onChange(newValue);
    }, 500);
  };

  return (
    <Box
      sx={{ width: "100%" }}
      onMouseLeave={handleMouseLeave}
    >
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {labelText}
      </Typography>
      <TextField
        inputRef={textFieldRef}
        fullWidth
        multiline={true}
        minRows={isExpanded ? 3 : 1}
        maxRows={isExpanded ? 8 : 1}
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        size="medium"
        sx={{
          "& .MuiOutlinedInput-root": {
            backgroundColor: "background.paper",
            transition: "all 0.2s ease",
          },
          // When collapsed, truncate overflow with ellipsis
          ...(!isExpanded && {
            "& .MuiInputBase-input": {
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            },
          }),
        }}
      />
    </Box>
  );
}
