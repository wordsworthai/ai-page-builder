import React, { useEffect } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Close, Warning } from "@mui/icons-material";
import { useCancelSubscription } from "@/hooks/api/Shared/Billing/usePayments";

interface CancelSubscriptionDialogProps {
  open: boolean;
  onClose: () => void;
  subscriptionEndDate?: string | Date | null;
  onSuccess?: () => void;
}

const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return "the end of your billing period";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const CancelSubscriptionDialog: React.FC<CancelSubscriptionDialogProps> = ({
  open,
  onClose,
  subscriptionEndDate,
  onSuccess,
}) => {
  const cancelSubscription = useCancelSubscription();
  const { isPending, isSuccess, isError, error, reset } = cancelSubscription;

  // Reset mutation state when dialog opens
  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  // Handle success
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    }
  }, [isSuccess, onSuccess, onClose]);

  const handleConfirmCancel = () => {
    cancelSubscription.mutate({
      immediately: false,
      reason: "User requested cancellation from billing page",
    });
  };

  const handleClose = () => {
    if (!isPending) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: "24px",
          boxShadow: "0px 48px 100px 0px rgba(17, 12, 46, 0.15)",
          maxHeight: "90vh",
          width: "100%",
          maxWidth: "480px",
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Warning sx={{ color: "#f57c00", fontSize: 24 }} />
          <Typography
            sx={{
              fontFamily: '"General Sans", sans-serif',
              fontWeight: 600,
              fontSize: "20px",
              color: "#565656",
            }}
          >
            Cancel Subscription
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          disabled={isPending}
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
          paddingTop: "24px !important",
          fontFamily: '"General Sans", sans-serif',
        }}
      >
        {isSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Your subscription has been cancelled. You will retain access until{" "}
            {formatDate(subscriptionEndDate)}.
          </Alert>
        )}

        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error instanceof Error
              ? error.message
              : "Failed to cancel subscription. Please try again."}
          </Alert>
        )}

        {!isSuccess && (
          <>
            <Typography
              sx={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: "15px",
                color: "#565656",
                lineHeight: 1.6,
                mb: 3,
              }}
            >
              Are you sure you want to cancel your Basic subscription?
            </Typography>

            <Box
              sx={{
                backgroundColor: "#fff8e1",
                border: "1px solid #ffe082",
                borderRadius: "12px",
                padding: "16px",
                mb: 3,
              }}
            >
              <Typography
                sx={{
                  fontFamily: '"General Sans", sans-serif',
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#f57c00",
                  mb: 1,
                }}
              >
                What happens when you cancel:
              </Typography>
              <Box component="ul" sx={{ margin: 0, paddingLeft: "20px" }}>
                <Typography
                  component="li"
                  sx={{
                    fontFamily: '"General Sans", sans-serif',
                    fontSize: "14px",
                    color: "#565656",
                    mb: 0.5,
                  }}
                >
                  Your subscription will remain active until{" "}
                  <strong>{formatDate(subscriptionEndDate)}</strong>
                </Typography>
                <Typography
                  component="li"
                  sx={{
                    fontFamily: '"General Sans", sans-serif',
                    fontSize: "14px",
                    color: "#565656",
                    mb: 0.5,
                  }}
                >
                  You can continue using your remaining credits until then
                </Typography>
                <Typography
                  component="li"
                  sx={{
                    fontFamily: '"General Sans", sans-serif',
                    fontSize: "14px",
                    color: "#565656",
                    mb: 0.5,
                  }}
                >
                  After the period ends, your account will be downgraded to the
                  Free plan
                </Typography>
                <Typography
                  component="li"
                  sx={{
                    fontFamily: '"General Sans", sans-serif',
                    fontSize: "14px",
                    color: "#565656",
                  }}
                >
                  You will lose access to publishing and analytics features
                </Typography>
              </Box>
            </Box>

            <Typography
              sx={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: "14px",
                color: "#9E9E9E",
                fontStyle: "italic",
              }}
            >
              You can resubscribe at any time to regain access to all features.
            </Typography>
          </>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          padding: "16px 24px 24px 24px",
          borderTop: "1px solid #E0E0E0",
          gap: 1,
          display: 'flex',
        }}
      >
        <Button
          onClick={handleClose}
          disabled={isPending}
          sx={{
            fontFamily: '"General Sans", sans-serif',
            fontWeight: 500,
            fontSize: "16px",
            padding: "10px 24px",
            borderRadius: "12px",
            textTransform: "none",
            color: "#565656",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.05)",
            },
          }}
        >
          {isSuccess ? "Close" : "Keep Subscription"}
        </Button>
        {!isSuccess && (
          <Button
            onClick={handleConfirmCancel}
            variant="contained"
            disabled={isPending}
            startIcon={isPending ? <CircularProgress size={20} /> : null}
            sx={{
              fontFamily: '"General Sans", sans-serif',
              fontWeight: 500,
              fontSize: "16px",
              padding: "10px 24px",
              borderRadius: "12px",
              textTransform: "none",
              backgroundColor: "#d32f2f",
              color: "white",
              "&:hover": {
                backgroundColor: "#b71c1c",
              },
              "&:disabled": {
                backgroundColor: "#E0E0E0",
                color: "#9E9E9E",
              },
            }}
          >
            {isPending ? "Cancelling..." : "Yes, Cancel"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CancelSubscriptionDialog;
