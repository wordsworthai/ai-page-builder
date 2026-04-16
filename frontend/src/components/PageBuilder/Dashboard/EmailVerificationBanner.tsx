import React from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useResendVerification } from "@/hooks/api/Shared/Auth/useResendVerification";

interface EmailVerificationBannerProps {
  email: string;
  verified: boolean;
  justVerified: boolean;
  hasPendingGeneration: boolean;
  onStartGeneration: () => void;
  isGenerating?: boolean;
}

const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({
  email,
  verified,
  justVerified,
  hasPendingGeneration,
  onStartGeneration,
  isGenerating = false,
}) => {
  const { mutateAsync: resendVerification, isPending: isResending } =
    useResendVerification();

  const handleResendEmail = async () => {
    if (isResending) return;
    await resendVerification({ email });
  };

  // Don't show banner if:
  // - No pending generation data
  // - User is verified and it's not a "just verified" scenario (auto-trigger will happen)
  if (!hasPendingGeneration) {
    return null;
  }

  if (verified && !justVerified) {
    // Auto-trigger scenario - don't show banner
    return null;
  }

  const linkStyle = {
    color: "primary.main",
    cursor: "pointer",
    textDecoration: "underline",
    fontWeight: 600,
    "&:hover": {
      textDecoration: "none",
    },
  };

  // State: Just verified - show success text with clickable "start building"
  if (verified && justVerified) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.primary">
          Email verified!{" "}
          {isGenerating ? (
            <Typography component="span" variant="body2" sx={{ fontWeight: 600 }}>
              Starting...{" "}
              <CircularProgress size={12} sx={{ ml: 0.5 }} />
            </Typography>
          ) : (
            <Typography
              component="span"
              variant="body2"
              onClick={onStartGeneration}
              sx={linkStyle}
            >
              Click here to start building your website
            </Typography>
          )}
        </Typography>
      </Box>
    );
  }

  // State: Unverified - show text with clickable "resend"
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" color="text.primary">
        Please verify your email ({email}) to start building.{" "}
        {isResending ? (
          <Typography component="span" variant="body2" sx={{ fontWeight: 600 }}>
            Sending...{" "}
            <CircularProgress size={12} sx={{ ml: 0.5 }} />
          </Typography>
        ) : (
          <Typography
            component="span"
            variant="body2"
            onClick={handleResendEmail}
            sx={linkStyle}
          >
            Resend verification email
          </Typography>
        )}
      </Typography>
    </Box>
  );
};

export default EmailVerificationBanner;
