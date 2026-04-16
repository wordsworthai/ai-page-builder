import React from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
} from "@mui/material";
import { Close } from "@mui/icons-material";

interface YelpUrlTooltipProps {
  open: boolean;
  onClose: () => void;
}

const YelpUrlTooltip: React.FC<YelpUrlTooltipProps> = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "24px",
          boxShadow: "0px 48px 100px 0px rgba(17, 12, 46, 0.15)",
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 24px 16px 24px",
          borderBottom: "1px solid #E0E0E0",
          fontFamily: '"General Sans", sans-serif',
        }}
      >
        <Typography
          sx={{
            fontFamily: '"General Sans", sans-serif',
            fontWeight: 600,
            fontSize: "20px",
            color: "#565656",
          }}
        >
          How to Get Your Yelp Business URL
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            color: "#9E9E9E",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.05)",
            },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          padding: "24px",
          fontFamily: '"General Sans", sans-serif',
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#F5F5F5",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#E0E0E0",
            borderRadius: "4px",
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Step 1 */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <Box
                sx={{
                  flexShrink: 0,
                  width: "32px",
                  height: "32px",
                  backgroundColor: "#434775",
                  color: "white",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: '"General Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: "16px",
                  marginTop: "12px",
                }}
              >
                1
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontFamily: '"General Sans", sans-serif',
                    fontWeight: 600,
                    fontSize: "16px",
                    color: "#565656",
                    marginBottom: "4px",
                    marginTop: "12px",
                  }}
                >
                  Find Your Business on Yelp
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"General Sans", sans-serif',
                    fontSize: "14px",
                    color: "#565656",
                    lineHeight: 1.5,
                  }}
                >
                  Go to Yelp.com and search for your business name and location. Click on your business listing to open the business page.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Step 2 */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <Box
                sx={{
                  flexShrink: 0,
                  width: "32px",
                  height: "32px",
                  backgroundColor: "#434775",
                  color: "white",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: '"General Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: "16px",
                }}
              >
                2
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontFamily: '"General Sans", sans-serif',
                    fontWeight: 600,
                    fontSize: "16px",
                    color: "#565656",
                    marginBottom: "4px",
                  }}
                >
                  Click the Share Button
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"General Sans", sans-serif',
                    fontSize: "14px",
                    color: "#565656",
                    lineHeight: 1.5,
                  }}
                >
                  Look for the "Share" button on your business page (usually near the top). Click it to reveal the sharing options.
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                marginLeft: "44px",
                backgroundColor: "#F5F5F5",
                borderRadius: "12px",
                padding: "12px",
                border: "1px solid #E0E0E0",
              }}
            >
              <Box
                sx={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  border: "1px solid #E0E0E0",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Box
                  component="svg"
                  sx={{ width: "20px", height: "20px", color: "#565656" }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </Box>
                <Typography
                  sx={{
                    fontFamily: '"General Sans", sans-serif',
                    fontWeight: 500,
                    fontSize: "14px",
                    color: "#565656",
                  }}
                >
                  Share
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Step 3 */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <Box
                sx={{
                  flexShrink: 0,
                  width: "32px",
                  height: "32px",
                  backgroundColor: "#434775",
                  color: "white",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: '"General Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: "16px",
                }}
              >
                3
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontFamily: '"General Sans", sans-serif',
                    fontWeight: 600,
                    fontSize: "16px",
                    color: "#565656",
                    marginBottom: "4px",
                  }}
                >
                  Copy the URL
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"General Sans", sans-serif',
                    fontSize: "14px",
                    color: "#565656",
                    lineHeight: 1.5,
                  }}
                >
                  The share modal will display your business URL. Simply copy the URL.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Tip */}
          <Box
            sx={{
              backgroundColor: "#E3E5FF",
              border: "1px solid #C8CCFF",
              borderRadius: "12px",
              padding: "16px"
            }}
          >
            <Box sx={{ display: "flex", gap: "12px" }}>
              <Box
                component="svg"
                sx={{
                  width: "20px",
                  height: "20px",
                  color: "#434775",
                  flexShrink: 0,
                  marginTop: "2px",
                }}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontFamily: '"General Sans", sans-serif',
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#434775",
                    marginBottom: "4px",
                  }}
                >
                  Tip
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"General Sans", sans-serif',
                    fontSize: "14px",
                    color: "#434775",
                    lineHeight: 1.5,
                  }}
                >
                  Your Yelp URL will look something like:{" "}
                  <Box
                    component="span"
                    sx={{
                      fontFamily: "monospace",
                      fontSize: "13px",
                      backgroundColor: "rgba(67, 71, 117, 0.1)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    yelp.com/biz/your-business-name-city
                  </Box>
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          padding: "16px 24px 24px 24px",
          borderTop: "1px solid #E0E0E0",
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            width: "100%",
            backgroundColor: "#434775",
            color: "white",
            fontFamily: '"General Sans", sans-serif',
            fontWeight: 500,
            fontSize: "16px",
            padding: "10px 24px",
            borderRadius: "12px",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#363A5F",
            },
          }}
        >
          Got it!
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default YelpUrlTooltip;
