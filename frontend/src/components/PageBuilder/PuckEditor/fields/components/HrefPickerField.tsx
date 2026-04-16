import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography, TextField, Tabs, Tab, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { Link as LinkIcon } from "@mui/icons-material";
import { createUsePuck } from "@measured/puck";
import { useParams } from "react-router-dom";
import type { FieldRenderProps } from "../types";
import { useHighlightSafe } from "../../contexts";
import { parseFieldName } from "../utils/fieldNameParser";
import { useWebsitePages } from "@/hooks/api/PageBuilder/Websites/useWebsitePages";

const usePuck = createUsePuck();

type SectionOption = {
  label: string;
  value: string;
};

/**
 * Safely extracts section name from item props.
 * Handles placeholder sections that don't have liquid_section prop.
 * Falls back to liquid_section_name or display_name when liquid_section is unavailable.
 */
function getSectionName(item: any): string | null {
  // First, try to parse liquid_section if it exists
  if (item.props?.liquid_section && typeof item.props.liquid_section === 'string') {
    try {
      const parsed = JSON.parse(item.props.liquid_section);
      if (parsed?.definition?.section_name) {
        return parsed.definition.section_name;
      }
    } catch (error) {
      // Invalid JSON, fall through to fallback options
      console.warn('[HrefPickerField] Failed to parse liquid_section:', error);
    }
  }

  // Fallback to liquid_section_name prop
  if (item.props?.liquid_section_name && typeof item.props.liquid_section_name === 'string') {
    return item.props.liquid_section_name;
  }

  // Fallback to display_name prop
  if (item.props?.display_name && typeof item.props.display_name === 'string') {
    return item.props.display_name;
  }

  // No valid section name found
  return null;
}

/**
 * Liquid href_picker:
 * Value may be a hash link (e.g., "#section-id") for same page links or a full URL for external links.
 * Renders a tabbed interface with:
 * - Same Page tab: Dropdown of available sections from Puck's component tree
 * - External URL tab: Text input for external URLs
 * Clicking on the field highlights the corresponding element in the preview iframe.
 */
export function HrefPickerField({ field, name, value, onChange }: FieldRenderProps) {
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

  // Determine initial tab based on value
  // Tab 0 = Same Page (#...), Tab 1 = Same Website (/...), Tab 2 = External URL
  const isSamePageLink = stringValue.startsWith("#");
  const isSameWebsiteLink = stringValue.startsWith("/");
  const initialTab = isSamePageLink ? 0 : isSameWebsiteLink ? 1 : 2;
  const [activeTab, setActiveTab] = useState<number>(initialTab);

  // State for external URL input
  const [externalUrl, setExternalUrl] = useState<string>(
    isSamePageLink || isSameWebsiteLink ? "https://example.com" : stringValue
  );
  // State for same page section selection (default to "#" for None)
  const [selectedSection, setSelectedSection] = useState<string>(isSamePageLink ? stringValue : "#");
  // State for same website page selection (default to "/" for None)
  const [selectedPage, setSelectedPage] = useState<string>(isSameWebsiteLink ? stringValue : "/");
  // Fetch website pages for "Same Website" tab
  const { generationVersionId } = useParams<{ generationVersionId: string }>();
  const { data: allPages = [] } = useWebsitePages();

  // Build page options, excluding the current page
  const pageOptions = useMemo<SectionOption[]>(() => {
    const filtered = allPages.filter((page) => {
      // Only include pages with a generation (i.e., pages that have been created)
      if (!page.current_generation_id) return false;
      // Exclude the current page being edited
      if (page.current_generation_id === generationVersionId) return false;
      return true;
    });

    // Sort: homepage first, then alphabetically by path
    filtered.sort((a, b) => {
      if (a.page_path === '/') return -1;
      if (b.page_path === '/') return 1;
      return a.page_path.localeCompare(b.page_path);
    });
    return filtered.map((page) => ({
      label: `${page.page_title || page.page_path} (${page.page_path})`,
      value: page.page_path,
    }));
  }, [allPages, generationVersionId]);

  // Access Puck data and config
  const content = usePuck((s) => s.appState.data.content);
  const config = usePuck((s) => s.config);

  // Extract sections from Puck's content
  const sections = useMemo<SectionOption[]>(() => {
    if (!content || !Array.isArray(content)) {
      return [];
    }

    const sectionMap = new Map<string, SectionOption>();

    content.forEach((item, index) => {
      if (!item || !item.type) return;

      // Skip items that don't have liquid_section_id (e.g., placeholder sections)
      // This is required for creating the section value
      const sectionId = item.props?.liquid_section_id;
      if (!sectionId || typeof sectionId !== 'string') {
        return; // Skip placeholder sections or items without valid section ID
      }

      const sectionValue = `#shopify-section-${sectionId}`;

      // Safely extract section name with fallbacks
      const sectionName = getSectionName(item);
      if (!sectionName) {
        // Skip items that don't have any valid section name
        return;
      }

      const sectionLabel = `${index + 1}. ${sectionName}`;

      // Only add if not already in map (avoid duplicates)
      if (!sectionMap.has(sectionValue)) {
        sectionMap.set(sectionValue, {
          label: sectionLabel,
          value: sectionValue,
        });
      }
    });

    return Array.from(sectionMap.values());
  }, [content, config]);

  // Update local state when value changes externally
  useEffect(() => {
    const stringVal = typeof value === "string" ? value : "";
    const isHashLink = stringVal.startsWith("#");
    const isPageLink = stringVal.startsWith("/");
    if (isHashLink) {
      setSelectedSection(stringVal);
      setSelectedPage("/");
      setExternalUrl("https://example.com");
      setActiveTab(0);
    } else if (isPageLink) {
      setSelectedPage(stringVal);
      setSelectedSection("#");
      setExternalUrl("https://example.com");
      setActiveTab(1);
    } else if (stringVal) {
      setExternalUrl(stringVal);
      setSelectedSection("#");
      setSelectedPage("/");
      setActiveTab(2);
    } else {
      setSelectedSection("#");
      setSelectedPage("/");
      setExternalUrl("https://example.com");
    }
  }, [value]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);

    if (newValue === 0) {
      // Switching to Same Page tab
      onChange(selectedSection && selectedSection !== "#" ? selectedSection : "#");
    } else if (newValue === 1) {
      // Switching to Same Website tab
      onChange(selectedPage && selectedPage !== "/" ? selectedPage : "/");
    } else {
      // Switching to External URL tab
      onChange(externalUrl && externalUrl.trim() !== "" ? externalUrl : "#");
    }
  };

  const handleSectionChange = (event: { target: { value: unknown } }) => {
    const newValue = event.target.value as string;
    setSelectedSection(newValue);
    onChange(newValue);
  };

  const handlePageChange = (event: { target: { value: unknown } }) => {
    const newValue = event.target.value as string;
    setSelectedPage(newValue);
    onChange(newValue);
  };

  const handleExternalUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setExternalUrl(newValue);
    // If empty, fall back to "#" to prevent empty links
    onChange(newValue.trim() === "" ? "#" : newValue);
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
        <LinkIcon sx={{ fontSize: 18, color: "text.secondary" }} />
        <Typography variant="subtitle2">
          {labelText}
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="href picker tabs">
          <Tab 
            label="Same Page" 
            sx={{
              "&:focus": {
                outline: "none",
              },
              "&:focus-visible": {
                outline: "none",
              },
            }}
          />
          <Tab
            label="Same Website"
            sx={{
              "&:focus": {
                outline: "none",
              },
              "&:focus-visible": {
                outline: "none",
              },
            }}
          />
          <Tab
            label="External"
            sx={{
              "&:focus": {
                outline: "none",
              },
              "&:focus-visible": {
                outline: "none",
              },
            }}
          />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box>
          <FormControl fullWidth size="small">
            <Select
              labelId="section-select-label"
              value={selectedSection}
              onChange={handleSectionChange}
              displayEmpty
            >
              <MenuItem value="#">
                <em>None</em>
              </MenuItem>
              {sections.map((section) => (
                <MenuItem key={section.value} value={section.value}>
                  {section.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {sections.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              No sections available. Add components to the page to create section links.
            </Typography>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <FormControl fullWidth size="small">
            <Select
              labelId="page-select-label"
              value={selectedPage}
              onChange={handlePageChange}
              displayEmpty
            >
              <MenuItem value="/">
                <em>None</em>
              </MenuItem>
              {pageOptions.map((page) => (
                <MenuItem key={page.value} value={page.value}>
                  {page.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {pageOptions.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              No additional pages available. Create new pages from the dashboard.
            </Typography>
          )}
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <TextField
            fullWidth
            value={externalUrl}
            onChange={handleExternalUrlChange}
            placeholder="https://example.com"
            size="medium"
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "background.paper",
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}

