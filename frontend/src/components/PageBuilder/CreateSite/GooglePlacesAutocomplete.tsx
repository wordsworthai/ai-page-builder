import React, { useEffect, useRef, useState, KeyboardEvent } from "react";
import { Box, InputAdornment, CircularProgress, ClickAwayListener, Paper, List, ListItem, ListItemText, ListItemButton } from "@mui/material";
import { GOOGLE_PLACES_API_KEY } from "@/config/smbConfig";
import type { GooglePlacesData } from "@/types/smbRecommendation";
import { StyledTextField } from "./BusinessInputForm";
import { Search } from "@mui/icons-material";

type Prediction = {
  description: string;
  place_id: string;
  structured_formatting?: { main_text?: string; secondary_text?: string };
};

type NormalizedPlace = GooglePlacesData;

const debounce = (fn: (...args: any[]) => void, wait = 200) => {
  let t: any = null;
  return (...args: any[]) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

let isScriptLoaded = false;
let scriptLoadPromise: Promise<void> | null = null;

const loadGoogleMapsScript = (): Promise<void> => {
  if (isScriptLoaded && (window as any).google?.maps?.importLibrary) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    (window as any).initGoogleMaps = () => {
      isScriptLoaded = true;
      delete (window as any).initGoogleMaps;
      resolve();
    };

    // If script is already present but init not called, still append callback param to ensure init runs
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing && (window as any).google?.maps) {
      isScriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places&callback=initGoogleMaps`;
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

interface Props {
  onPlaceSelected: (placeData: NormalizedPlace) => void;
  placeholder?: string;
  initialValue?: string;
  value?: string;
}

const GooglePlacesAutocomplete: React.FC<Props> = ({ onPlaceSelected, placeholder = "Find your business on Google", initialValue = "", value }) => {
  const [query, setQuery] = useState(initialValue);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const serviceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const previousValueRef = useRef<string | undefined>(value);
  const justSelectedRef = useRef(false);
  const suppressNextFetchRef = useRef(false);

  // init google libs
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        await loadGoogleMapsScript();
        if (!mounted) return;
        serviceRef.current = new (window as any).google.maps.places.AutocompleteService();
        // PlacesService needs an element; dummy div is fine
        const dummy = document.createElement("div");
        placesServiceRef.current = new (window as any).google.maps.places.PlacesService(dummy);
      } catch (err) {
        console.error("Google Maps load failed:", err);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  // debounce predictions
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
      serviceRef.current.getPlacePredictions({ input: text, types: ["establishment"] }, (preds: any[], status: any) => {
        setLoadingPredictions(false);
        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && preds?.length) {
          setPredictions(preds);
          setOpen(true);
          setActiveIndex(-1);
        } else {
          setPredictions([]);
          setOpen(false);
        }
      });
    }, 220)
  ).current;

  useEffect(() => {
    if (value !== undefined && value !== previousValueRef.current) {
      previousValueRef.current = value;
      if (justSelectedRef.current) {
        return;
      }
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    if (suppressNextFetchRef.current) {
      suppressNextFetchRef.current = false;
      return;
    }
    fetchPredictions(query);
  }, [query, fetchPredictions]);

  const fetchPlaceDetails = (placeId: string): Promise<NormalizedPlace> =>
    new Promise((resolve, reject) => {
      if (!placesServiceRef.current) return reject(new Error("PlacesService not initialized"));
      placesServiceRef.current.getDetails(
        {
          placeId,
          fields: [
            "place_id",
            "name",
            "formatted_address",
            "geometry",
            "website",
            "international_phone_number",
            "url",
            "business_status",
            "rating",
            "user_ratings_total",
            "reviews",
            "photos",
          ],
        },
        (place: any, status: any) => {
          const PLACES_STATUS = (window as any).google.maps.places.PlacesServiceStatus;
          if (status !== PLACES_STATUS.OK) {
            return reject(new Error("Failed to fetch place details: " + status));
          }
          const normalized: NormalizedPlace = {
            id: place.place_id,
            displayName: place.name || "",
            formattedAddress: place.formatted_address,
            location: place.geometry?.location ? { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() } : undefined,
            websiteURI: place.website,
            internationalPhoneNumber: place.international_phone_number,
            googleMapsURI: place.url,
            businessStatus: place.business_status,
            rating: place.rating,
            userRatingCount: place.user_ratings_total,
            reviews: place.reviews,
            photos: place.photos?.map((p: any, i: number) => ({ index: i, widthPx: p.width, heightPx: p.height, url: p.getUrl({ maxWidth: 400 }) })),
          };
          resolve(normalized);
        }
      );
    });

  const handleSelect = async (pred: Prediction) => {
    try {
      setOpen(false);
      setPredictions([]);
      justSelectedRef.current = true;
      suppressNextFetchRef.current = true;
      setQuery(pred.description);
      const details = await fetchPlaceDetails(pred.place_id);
      onPlaceSelected(details);
    } catch (err) {
      console.error("Failed to fetch details:", err);
      justSelectedRef.current = false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    justSelectedRef.current = false;
    setQuery(e.target.value);
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

  return (
    <ClickAwayListener onClickAway={() => { setOpen(false); setActiveIndex(-1); }}>
      <Box sx={{ position: "relative", width: "100%" }}>
        <StyledTextField
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          fullWidth
          onKeyDown={onKeyDown}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "#afafaf", fontSize: "20px" }} />
              </InputAdornment>
            ),
            endAdornment: loadingPredictions ? (
              <InputAdornment position="end">
                <CircularProgress size={18} />
              </InputAdornment>
            ) : undefined,
          }}
          inputProps={{
            "aria-autocomplete": "list",
            "aria-controls": open ? "gplaces-listbox" : undefined,
            "aria-activedescendant": activeIndex >= 0 ? `gplaces-option-${activeIndex}` : undefined,
          }}
        />

        {open && predictions.length > 0 && (
          <Paper
            elevation={4}
            sx={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              right: 0,
              zIndex: 1300,
              maxHeight: 320,
              overflow: "auto",
              borderRadius: "12px",
            }}
            role="listbox"
            id="gplaces-listbox"
          >
            <List disablePadding>
            {predictions.map((p, idx) => (
              <ListItem key={p.place_id} disablePadding>
                <ListItemButton
                  selected={idx === activeIndex}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(-1)}
                  onClick={() => handleSelect(p)}
                  id={`gplaces-option-${idx}`}
                  role="option"
                  aria-selected={idx === activeIndex}
                >
                  <ListItemText
                    primary={p.structured_formatting?.main_text || p.description}
                    secondary={p.structured_formatting?.secondary_text}
                  />
                </ListItemButton>
              </ListItem>
            ))}
            </List>
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
};

export default GooglePlacesAutocomplete;
