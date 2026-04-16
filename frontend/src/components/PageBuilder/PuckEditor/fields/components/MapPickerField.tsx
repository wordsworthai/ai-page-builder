import React, { useState, useEffect, useRef, KeyboardEvent } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  ClickAwayListener,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
} from "@mui/material";
import { Place as PlaceIcon, Search, Close } from "@mui/icons-material";
import type { FieldRenderProps } from "../types";
import { useHighlightSafe } from "../../contexts";
import { parseFieldName } from "../utils/fieldNameParser";
import { GOOGLE_PLACES_API_KEY } from "@/config/smbConfig";

type Prediction = {
  description: string;
  place_id: string;
  structured_formatting?: { main_text?: string; secondary_text?: string };
};

type PlaceDetails = {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry?: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
};

const debounce = (fn: (...args: any[]) => void, wait = 200) => {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: any[]) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

let isScriptLoaded = false;
let scriptLoadPromise: Promise<void> | null = null;

const loadGoogleMapsScript = (): Promise<void> => {
  if (isScriptLoaded && (window as any).google?.maps?.places) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    (window as any).initGoogleMapsForMapPicker = () => {
      isScriptLoaded = true;
      delete (window as any).initGoogleMapsForMapPicker;
      resolve();
    };

    // If script is already present and loaded
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing && (window as any).google?.maps?.places) {
      isScriptLoaded = true;
      resolve();
      return;
    }

    // If script exists but not fully loaded, wait for it
    if (existing) {
      const checkLoaded = setInterval(() => {
        if ((window as any).google?.maps?.places) {
          clearInterval(checkLoaded);
          isScriptLoaded = true;
          resolve();
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places&callback=initGoogleMapsForMapPicker`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error("Failed to load Google Maps script"));
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
};

/**
 * Convert a Google Place to a Google Maps embed iframe HTML string.
 * Uses the maps.google.com/maps?q=...&output=embed format which doesn't require
 * the Maps Embed API to be enabled (unlike the /maps/embed/v1/ endpoint).
 */
function placeToIframeHtml(placeId: string, placeName: string, address?: string): string {
  // Use address for the query if available, otherwise use place name
  // The output=embed format works without requiring Maps Embed API
  const query = encodeURIComponent(address || placeName);
  const embedUrl = `https://maps.google.com/maps?q=${query}&t=m&z=15&output=embed&iwloc=near`;
  
  return `<iframe src="${embedUrl}" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="${placeName}" data-place-id="${placeId}"></iframe>`;
}

/**
 * Extract place name from iframe HTML if possible.
 */
function extractPlaceNameFromIframe(iframeHtml: string): string | null {
  if (!iframeHtml || typeof iframeHtml !== "string") return null;
  
  // Try to extract from title attribute
  const titleMatch = iframeHtml.match(/title="([^"]+)"/);
  if (titleMatch) return titleMatch[1];
  
  return null;
}

/**
 * Check if the value is a Google Maps embed iframe.
 * Supports both embed formats:
 * - Old: google.com/maps/embed/v1/...
 * - New: maps.google.com/maps?q=...&output=embed
 */
function isGoogleMapsIframe(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  return value.includes("google.com/maps");
}

/**
 * Liquid map_picker:
 * Shows a Google Places autocomplete search and converts selection to a Google Maps embed iframe.
 * The stored value is the iframe HTML string.
 */
export function MapPickerField({ field, name, value, onChange }: FieldRenderProps) {
  const labelText = field?.label || name;
  const elementId = field?.elementId;
  const sectionId = field?.sectionId;
  
  // Parse field name to extract block information
  const parsed = parseFieldName(name);
  const blockType = field?.blockType || parsed.blockType || "wwai_base_settings";
  const blockIndex = parsed.blockIndex;
  
  const { highlightElement, clearHighlights } = useHighlightSafe();
  const [isFocused, setIsFocused] = useState(false);
  
  // Search state
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isScriptReady, setIsScriptReady] = useState(false);
  // Show map preview while user is in the search box and has typed something
  const showMapPreview = isFocused && query.length > 0;

  // Current location display
  const stringValue = typeof value === "string" ? value : "";
  const currentPlaceName = extractPlaceNameFromIframe(stringValue);
  const hasMap = isGoogleMapsIframe(stringValue);
  
  const serviceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const justSelectedRef = useRef(false);
  const suppressNextFetchRef = useRef(false);

  // Initialize Google Maps script
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        await loadGoogleMapsScript();
        if (!mounted) return;
        serviceRef.current = new (window as any).google.maps.places.AutocompleteService();
        const dummy = document.createElement("div");
        placesServiceRef.current = new (window as any).google.maps.places.PlacesService(dummy);
        setIsScriptReady(true);
      } catch (err) {
        console.error("Google Maps load failed:", err);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  // Debounced predictions fetch
  const fetchPredictions = useRef(
    debounce((text: string) => {
      if (!serviceRef.current) {
        setPredictions([]);
        setLoadingPredictions(false);
        return;
      }
      if (!text) {
        setPredictions([]);
        setOpen(false);
        setLoadingPredictions(false);
        return;
      }
      setLoadingPredictions(true);
      serviceRef.current.getPlacePredictions(
        { input: text },
        (preds: any[], status: any) => {
          setLoadingPredictions(false);
          if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && preds?.length) {
            setPredictions(preds);
            setOpen(true);
            setActiveIndex(-1);
          } else {
            setPredictions([]);
            setOpen(false);
          }
        }
      );
    }, 220)
  ).current;

  useEffect(() => {
    // Skip fetch if we just selected a place (prevents dropdown from reopening)
    if (suppressNextFetchRef.current) {
      suppressNextFetchRef.current = false;
      return;
    }
    if (isScriptReady) {
      fetchPredictions(query);
    }
  }, [query, isScriptReady, fetchPredictions]);

  const handleSelect = async (pred: Prediction) => {
    try {
      setOpen(false);
      setPredictions([]);
      
      // Prevent dropdown from reopening after selection
      justSelectedRef.current = true;
      suppressNextFetchRef.current = true;
      
      const placeName = pred.structured_formatting?.main_text || pred.description;
      setQuery(placeName);
      
      // Use the full description (contains address) for accurate map positioning
      // pred.description typically contains: "Business Name, Full Address"
      const iframeHtml = placeToIframeHtml(
        pred.place_id,
        placeName,
        pred.description // Full address for the embed query
      );
      onChange(iframeHtml);
    } catch (err) {
      console.error("Failed to select place:", err);
      justSelectedRef.current = false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Reset selection flag when user starts typing again
    justSelectedRef.current = false;
    setQuery(e.target.value);
  };

  const handleClear = () => {
    setQuery("");
    onChange("");
    setPredictions([]);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, predictions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && predictions[activeIndex]) {
        handleSelect(predictions[activeIndex]);
      } else if (predictions.length === 1) {
        handleSelect(predictions[0]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
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
        <PlaceIcon sx={{ fontSize: 18, color: "text.secondary" }} />
        <Typography variant="subtitle2">{labelText}</Typography>
      </Box>

      <ClickAwayListener onClickAway={() => { setOpen(false); setActiveIndex(-1); }}>
        <Box sx={{ position: "relative", width: "100%" }}>
          <TextField
            fullWidth
            placeholder="Search for a location..."
            value={query}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            disabled={!isScriptReady}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ marginRight: "4px !important" }}>
                  <Search sx={{ color: "text.secondary", fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {loadingPredictions ? (
                    <CircularProgress size={18} />
                  ) : query ? (
                    <IconButton size="small" onClick={handleClear}>
                      <Close sx={{ fontSize: 18 }} />
                    </IconButton>
                  ) : null}
                </InputAdornment>
              ),
            }}
            inputProps={{
              "aria-autocomplete": "list",
              "aria-controls": open ? "map-places-listbox" : undefined,
              "aria-activedescendant": activeIndex >= 0 ? `map-place-option-${activeIndex}` : undefined,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "background.paper",
              },
            }}
          />

          {open && predictions.length > 0 && (
            <Paper
              elevation={4}
              sx={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                zIndex: 1300,
                maxHeight: 280,
                overflow: "auto",
                borderRadius: 1,
              }}
              role="listbox"
              id="map-places-listbox"
            >
              <List disablePadding>
                {predictions.map((p, idx) => (
                  <ListItem key={p.place_id} disablePadding>
                    <ListItemButton
                      selected={idx === activeIndex}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onMouseLeave={() => setActiveIndex(-1)}
                      onClick={() => handleSelect(p)}
                      id={`map-place-option-${idx}`}
                      role="option"
                      aria-selected={idx === activeIndex}
                    >
                      <ListItemText
                        primary={p.structured_formatting?.main_text || p.description}
                        secondary={p.structured_formatting?.secondary_text}
                        primaryTypographyProps={{ variant: "body2" }}
                        secondaryTypographyProps={{ variant: "caption" }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      </ClickAwayListener>

      {/* Current location display + map preview (preview shows while focused and typing in search) */}
      {hasMap && (
        <Box sx={{ mt: 1.5 }}>
          {currentPlaceName && (
            <Typography variant="caption" color="text.secondary">
              Current location: <strong>{currentPlaceName}</strong>
            </Typography>
          )}
          {showMapPreview && (
            <Box
              sx={{
                mt: 1.5,
                borderRadius: 1,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
                "& iframe": {
                  display: "block",
                },
              }}
              dangerouslySetInnerHTML={{ __html: stringValue }}
            />
          )}
        </Box>
      )}

      {!isScriptReady && (
        <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={14} />
          <Typography variant="caption" color="text.secondary">
            Loading Google Maps...
          </Typography>
        </Box>
      )}
    </Box>
  );
}
