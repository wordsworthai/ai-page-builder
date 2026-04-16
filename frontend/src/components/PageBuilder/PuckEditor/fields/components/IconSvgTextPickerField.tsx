import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Upload, Close, Delete, Image as ImageIcon } from "@mui/icons-material";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/react/dashboard";
import type { FieldRenderProps } from "../types";
import { useHighlightSafe } from "../../contexts";
import { parseFieldName } from "../utils/fieldNameParser";

// Size limit for SVG files (1MB should be plenty for icons)
const MAX_SVG_SIZE = 1 * 1024 * 1024;

/**
 * Extract only the <svg>...</svg> content from SVG file text.
 * Strips XML declarations, comments, and any content before/after the SVG element.
 */
function extractSvgElement(content: string): string {
  // Find the start of the <svg tag (case-insensitive)
  const svgStartMatch = content.match(/<svg[\s>]/i);
  if (!svgStartMatch || svgStartMatch.index === undefined) {
    throw new Error("No <svg> element found in file");
  }
  
  // Find the end of the </svg> tag (case-insensitive)
  const svgEndMatch = content.match(/<\/svg\s*>/i);
  if (!svgEndMatch || svgEndMatch.index === undefined) {
    throw new Error("No closing </svg> tag found in file");
  }
  
  const startIndex = svgStartMatch.index;
  const endIndex = svgEndMatch.index + svgEndMatch[0].length;
  
  return content.slice(startIndex, endIndex);
}

/**
 * Read SVG file content as text using FileReader.
 * Extracts only the <svg>...</svg> element, stripping XML declarations and comments.
 */
function readSvgFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === "string") {
        try {
          const svgElement = extractSvgElement(content);
          resolve(svgElement);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error("Failed to read file as text"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Convert SVG text to a safe data URL for preview.
 * This is safer than using dangerouslySetInnerHTML.
 */
function svgToDataUrl(svgText: string): string {
  const encoded = encodeURIComponent(svgText);
  return `data:image/svg+xml,${encoded}`;
}

/**
 * Liquid icon_svg_text_picker:
 * Allows users to upload an SVG file and stores the raw SVG text as the field value.
 * Uses Uppy for file selection and FileReader for client-side text extraction.
 */
export function IconSvgTextPickerField({ field, name, value, onChange }: FieldRenderProps) {
  const labelText = field?.label || name;
  const elementId = field?.elementId;
  const sectionId = field?.sectionId;

  // Parse field name to extract block information
  const parsed = parseFieldName(name);
  const blockType = field?.blockType || parsed.blockType || "wwai_base_settings";
  const blockIndex = parsed.blockIndex;

  const { highlightElement, clearHighlights } = useHighlightSafe();
  const [isFocused, setIsFocused] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [hasSelectedFiles, setHasSelectedFiles] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get current SVG text from value
  const svgText = typeof value === "string" ? value : "";

  // Create Uppy instance for SVG file selection only (no server upload)
  const uppy = useMemo(() => {
    const instance = new Uppy({
      restrictions: {
        maxNumberOfFiles: 1,
        allowedFileTypes: [".svg", "image/svg+xml"],
        maxFileSize: MAX_SVG_SIZE,
      },
      autoProceed: false,
      onBeforeFileAdded: (currentFile) => {
        const fileSize = currentFile.size || 0;
        if (fileSize > MAX_SVG_SIZE) {
          instance.info(
            `SVG "${currentFile.name}" exceeds the 1MB limit. Please choose a smaller file.`,
            "error",
            5000
          );
          return false;
        }
        return true;
      },
    });
    return instance;
  }, []);

  // Cleanup Uppy on unmount
  useEffect(() => {
    return () => {
      uppy.clear();
    };
  }, [uppy]);

  // Track file selection state
  useEffect(() => {
    const updateHasFiles = () => {
      setHasSelectedFiles(uppy.getFiles().length > 0);
    };
    uppy.on("file-added", updateHasFiles);
    uppy.on("file-removed", updateHasFiles);
    return () => {
      uppy.off("file-added", updateHasFiles);
      uppy.off("file-removed", updateHasFiles);
    };
  }, [uppy]);

  const handleOpenUploader = () => {
    setShowUploader(true);
  };

  const handleClose = () => {
    if (isProcessing) return;
    setShowUploader(false);
    uppy.cancelAll();
    uppy.resetProgress();
    setHasSelectedFiles(false);
  };

  const handleUseSvg = async () => {
    const files = uppy.getFiles();
    if (files.length === 0) return;

    const uppyFile = files[0];
    const file = uppyFile.data as File;

    setIsProcessing(true);
    try {
      const svgContent = await readSvgFileAsText(file);
      onChange(svgContent);
      handleClose();
    } catch (error) {
      console.error("Failed to read SVG file:", error);
      uppy.info("Failed to read SVG file. Please try again.", "error", 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Element highlighting handlers
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
      {/* Label */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <ImageIcon sx={{ fontSize: 18, color: "text.secondary" }} />
        <Typography component="span" variant="subtitle2">
          {labelText}
        </Typography>
      </Box>

      {/* SVG Preview */}
      {svgText && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              p: 0.5,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              backgroundColor: "background.paper",
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src={svgToDataUrl(svgText)}
              alt="SVG Preview"
              style={{
                width: 24,
                height: 24,
                objectFit: "contain",
              }}
            />
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Upload />}
            onClick={handleOpenUploader}
            sx={{
              width: "100%",
              "&:focus": { outline: "none" },
              "&:focus-visible": { outline: "none" },
            }}
          >
            {svgText ? "Change SVG" : "Upload SVG"}
          </Button>
        </Box>
      )}

      {/* Uppy Upload Dialog */}
      <Dialog open={showUploader} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <Upload color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Upload SVG Icon
              </Typography>
            </Box>
            <IconButton onClick={handleClose} size="small" disabled={isProcessing}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              "& .uppy-Dashboard-AddFiles-title": {
                marginTop: "35%",
              },
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Select an SVG file (max 1MB)
            </Typography>
            <Dashboard
              uppy={uppy}
              proudlyDisplayPoweredByUppy={false}
              height={300}
              hideUploadButton
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
          <Button onClick={handleClose} color="inherit" disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleUseSvg}
            variant="contained"
            color="primary"
            disabled={!hasSelectedFiles || isProcessing}
            startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <Upload />}
            sx={{
              "&:focus": { outline: "none" },
              "&:focus-visible": { outline: "none" },
            }}
          >
            {isProcessing ? "Processing..." : "Use SVG"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
