import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  TextField,
  Typography,
  styled,
  InputAdornment,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { Search, Info } from "@mui/icons-material";
import { saveCreateSiteData, getCreateSiteData } from "@/utils/createSiteStorage";
import { NextButton } from "./FormButtons";
import googleIcon from "@/assets/ri_google-fill.png";
import yelpIcon from "@/assets/bi_yelp.png";
import type { GooglePlacesData } from "@/types/smbRecommendation";
import GooglePlacesAutocomplete from "./GooglePlacesAutocomplete";
import YelpUrlTooltip from "./YelpUrlTooltip";

/** Hidden until Yelp integration is wired; set to true to show the field again. */
const SHOW_YELP_FIELD = false;

export const BusinessInputFormCard = styled(Box)(({ theme }) => ({
  background: "white",
  borderRadius: "24px",
  boxShadow: "0px 48px 100px 0px rgba(17, 12, 46, 0.15)",
  padding: "36px",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
}));

export const BusinessInputFormContent = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "24px",
  flex: 1,
  justifyContent: "space-between",
  minHeight: "0",
});

export const FormSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  width: "100%",
});

export const Label = styled(Typography)({
  fontFamily: '"General Sans", sans-serif',
  fontWeight: 600,
  fontSize: "16px",
  lineHeight: 1,
  letterSpacing: "-0.32px",
  color: "#565656",
});

export const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#efefef",
    borderRadius: "12px",
    fontFamily: '"General Sans", sans-serif',
    fontWeight: 500,
    fontSize: "16px",
    "& fieldset": {
      border: "none",
    },
    "&:hover fieldset": {
      border: "none",
    },
    "&.Mui-focused fieldset": {
      border: "none",
    },
    "&.Mui-error": {
      backgroundColor: "#fee",
      "& fieldset": {
        border: "1px solid #d32f2f",
      },
    },
    "& input": {
      padding: "16px 20px",
      color: "#565656",
      fontFamily: '"General Sans", sans-serif',
      fontWeight: 500,
      fontSize: "16px",
      "&::placeholder": {
        color: "#afafaf",
        opacity: 1,
        fontFamily: '"General Sans", sans-serif',
        fontWeight: 500,
        fontSize: "16px",
      },
    },
    "& .MuiInputAdornment-root": {
      margin: 0,
      "&.MuiInputAdornment-positionStart": {
        marginRight: "8px",
      },
      "&.MuiInputAdornment-positionEnd": {
        marginLeft: "8px",
      },
    },
  },
}));

export const GoogleIcon = () => (
  <Box
    component="img"
    src={googleIcon}
    alt="Google"
    sx={{
      width: "20px",
      height: "20px",
      objectFit: "contain",
    }}
  />
);

export const YelpIcon = () => (
  <Box
    component="img"
    src={yelpIcon}
    alt="Yelp"
    sx={{
      width: "20px",
      height: "20px",
      objectFit: "contain",
    }}
  />
);

const ButtonContainer = styled(Box)({
  display: "flex",
  gap: "12px",
  alignItems: "center",
  justifyContent: "flex-end",
  width: "100%",
  marginTop: "65px",
});

interface BusinessInputFormProps {
  onNext?: (data: {
    businessName: string;
    googleUrl: string;
    yelpUrl: string;
    googlePlacesData?: GooglePlacesData;
  }) => void;
  onGooglePlacesSelect?: (data: GooglePlacesData) => void;
}

const YELP_URL_PATTERN = /^https?:\/\/(www\.)?yelp\.com\/biz\/[a-zA-Z0-9-]+/;

const cleanYelpUrl = (url: string): string => {
  if (!url.trim()) return url;
  try {
    const urlObj = new URL(url.trim());
    urlObj.search = '';
    return urlObj.toString();
  } catch (e) {
    const queryIndex = url.indexOf('?');
    if (queryIndex !== -1) {
      return url.substring(0, queryIndex);
    }
    return url.trim();
  }
};

const BusinessInputForm: React.FC<BusinessInputFormProps> = ({ onNext, onGooglePlacesSelect }) => {
  const [businessName, setBusinessName] = useState("");
  const [googleUrl, setGoogleUrl] = useState("");
  const [yelpUrl, setYelpUrl] = useState("");
  const [yelpUrlError, setYelpUrlError] = useState("");
  const [googlePlacesData, setGooglePlacesData] = useState<GooglePlacesData | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isYelpTooltipOpen, setIsYelpTooltipOpen] = useState(false);
  const isInitialLoad = useRef(true);
  const isFromGooglePlaces = useRef(false);

  useEffect(() => {
    const saved = getCreateSiteData();
    if (saved.businessName) setBusinessName(saved.businessName);
    if (saved.googleUrl) setGoogleUrl(saved.googleUrl);
    if (saved.yelpUrl) setYelpUrl(saved.yelpUrl);
    if (!SHOW_YELP_FIELD) setYelpUrlError("");
    setIsLoading(false);
    setTimeout(() => {
      isInitialLoad.current = false;
    }, 100);
  }, []);

  const validateYelpUrl = (url: string): boolean => {
    if (!url.trim()) {
      setYelpUrlError("");
      return true;
    }
    const cleanedUrl = cleanYelpUrl(url);
    const isValid = YELP_URL_PATTERN.test(cleanedUrl);
    if (!isValid) {
      setYelpUrlError("Please enter a valid Yelp business URL (e.g., https://www.yelp.com/biz/business-name)");
    } else {
      setYelpUrlError("");
    }
    return isValid;
  };

  const handlePlaceSelected = (place: GooglePlacesData) => {
    setGooglePlacesData(place);
    isFromGooglePlaces.current = true;
    setBusinessName(place.displayName || "");
    setGoogleUrl(place.googleMapsURI || "");
    if (onGooglePlacesSelect) onGooglePlacesSelect(place);
  };

  const handleNext = () => {
    const isYelpOk = SHOW_YELP_FIELD ? validateYelpUrl(yelpUrl) : true;
    if (businessName.trim() && googleUrl.trim() && isYelpOk) {
      const cleanedYelpUrl =
        SHOW_YELP_FIELD && yelpUrl.trim() ? cleanYelpUrl(yelpUrl) : "";
      saveCreateSiteData({
        businessName: businessName.trim(),
        googleUrl: googleUrl.trim(),
        yelpUrl: cleanedYelpUrl,
        googlePlacesData,
      });
      if (onNext) {
        onNext({
          businessName: businessName.trim(),
          googleUrl: googleUrl.trim(),
          yelpUrl: cleanedYelpUrl,
          googlePlacesData,
        });
      }
    }
  };

  const isFormValid =
    businessName.trim() !== "" &&
    googleUrl.trim() !== "" &&
    (SHOW_YELP_FIELD ? !yelpUrlError : true);

  return (
    <BusinessInputFormCard>
      <BusinessInputFormContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
          <FormSection>
            <Label>Name of your business*</Label>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Works best for local service businesses such as HVAC, plumbing, and electrical.
            </Typography>
            <StyledTextField
              placeholder="ABC Industries Ltd."
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              fullWidth
            />
          </FormSection>

          <FormSection>
            <Label>Find your business on Google*</Label>
            {isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" 
                   sx={{ minHeight: "60px", backgroundColor: "#efefef", borderRadius: "12px" }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <GooglePlacesAutocomplete 
                onPlaceSelected={handlePlaceSelected} 
                placeholder="Search for your business on Google" 
                initialValue={googleUrl || ""}
                value={businessName}
              />
            )}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Or enter Google URL manually:
            </Typography>
            <StyledTextField
              placeholder="https://maps.google.com/..."
              value={googleUrl}
              onChange={(e) => setGoogleUrl(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "#afafaf", fontSize: "20px" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <GoogleIcon />
                  </InputAdornment>
                ),
              }}
            />
          </FormSection>

          {SHOW_YELP_FIELD && (
            <FormSection>
              <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Label>Enter your Yelp URL</Label>
                <IconButton
                  onClick={() => setIsYelpTooltipOpen(true)}
                  size="small"
                  sx={{
                    color: "#434775",
                    "&:hover": {
                      backgroundColor: "rgba(68, 138, 255, 0.1)",
                    },
                    "&:focus": {
                      outline: "none",
                    },
                    "&:focus-visible": {
                      outline: "none",
                    },
                  }}
                >
                  <Info sx={{ fontSize: "12px" }} />
                </IconButton>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5, mb: 0.5 }}>
                Having this, improves the generation results
              </Typography>
              <StyledTextField
                placeholder="Paste your yelp url here"
                value={yelpUrl}
                onChange={(e) => {
                  setYelpUrl(e.target.value);
                  if (yelpUrlError) {
                    validateYelpUrl(e.target.value);
                  }
                }}
                onBlur={() => {
                  if (yelpUrl.trim()) {
                    const cleaned = cleanYelpUrl(yelpUrl);
                    setYelpUrl(cleaned);
                    validateYelpUrl(cleaned);
                  } else {
                    validateYelpUrl(yelpUrl);
                  }
                }}
                error={!!yelpUrlError}
                helperText={yelpUrlError}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "#afafaf", fontSize: "20px" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <YelpIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </FormSection>
          )}
        </Box>

        <ButtonContainer>
          <NextButton onClick={handleNext} disabled={!isFormValid}>
            Next
          </NextButton>
        </ButtonContainer>
      </BusinessInputFormContent>

      {SHOW_YELP_FIELD && (
        <YelpUrlTooltip
          open={isYelpTooltipOpen}
          onClose={() => setIsYelpTooltipOpen(false)}
        />
      )}
    </BusinessInputFormCard>
  );
};

export default BusinessInputForm;