import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Close, CloudUpload } from "@mui/icons-material";
import { CurrentUserResponse } from "@/client";
import { useContactSupport } from "@/hooks/api/Shared/Support/useContactSupport";

interface ContactDialogProps {
  open: boolean;
  onClose: () => void;
  currentUser?: CurrentUserResponse;
  initialCategory?: string;
  initialSubject?: string;
}

const CATEGORIES = [
  "Technical Support",
  "Billing Question",
  "Feature Request",
  "Bug Report",
  "General Inquiry",
  "Custom Plan",
];

const ContactDialog: React.FC<ContactDialogProps> = ({ 
  open, 
  onClose, 
  currentUser,
  initialCategory,
  initialSubject,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate: submitContact, isPending, isSuccess, isError, error } = useContactSupport();

  // Auto-fill user data if logged in
  useEffect(() => {
    if (currentUser && open) {
      setName(currentUser.full_name || "");
      setEmail(currentUser.email || "");
    }
  }, [currentUser, open]);

  // Set initial category and subject when dialog opens
  useEffect(() => {
    if (open) {
      if (initialCategory) {
        setCategory(initialCategory);
      }
      if (initialSubject) {
        setSubject(initialSubject);
      }
    }
  }, [open, initialCategory, initialSubject]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setName("");
      setEmail("");
      setCategory("");
      setSubject("");
      setMessage("");
      setScreenshot(null);
      setScreenshotPreview(null);
      setErrors({});
    }
  }, [open]);

  // Close dialog on success
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  }, [isSuccess, onClose]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!message.trim()) {
      newErrors.message = "Message is required";
    } else if (message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleScreenshotChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors({ ...errors, screenshot: "Please select an image file" });
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ ...errors, screenshot: "File size must be less than 10MB" });
        return;
      }

      setScreenshot(file);
      setErrors({ ...errors, screenshot: "" });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    // Auto-capture metadata
    const currentPage = window.location.pathname;
    const currentUrl = window.location.href;
    const userAgent = navigator.userAgent;

    submitContact({
      name,
      email,
      category: category || undefined,
      subject: subject || undefined,
      message,
      currentPage,
      currentUrl,
      userAgent,
      screenshot: screenshot || undefined,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: "24px",
          boxShadow: "0px 48px 100px 0px rgba(17, 12, 46, 0.15)",
          maxHeight: "90vh",
          width: "100%",
          maxWidth: "500px",
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
          Contact Support
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
          paddingTop: "32px",
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "20px" }}>
          {isSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Thank you! Your message has been submitted successfully. We'll get back to you soon.
            </Alert>
          )}

          {isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error instanceof Error ? error.message : "Failed to submit. Please try again."}
            </Alert>
          )}

          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            error={!!errors.name}
            helperText={errors.name}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
              },
            }}
          />

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            error={!!errors.email}
            helperText={errors.email}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
              },
            }}
          />

          <FormControl fullWidth>
            <InputLabel>Category (Optional)</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              label="Category (Optional)"
              sx={{
                borderRadius: "12px",
              }}
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Subject (Optional)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
              },
            }}
          />

          <TextField
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            fullWidth
            multiline
            rows={6}
            error={!!errors.message}
            helperText={errors.message}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
              },
            }}
          />

          <Box>
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="screenshot-upload"
              type="file"
              onChange={handleScreenshotChange}
            />
            <label htmlFor="screenshot-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
                sx={{
                  borderRadius: "12px",
                  textTransform: "none",
                  borderColor: "#E0E0E0",
                  color: "#565656",
                  "&:hover": {
                    borderColor: "#434775",
                    backgroundColor: "rgba(67, 71, 117, 0.05)",
                  },
                }}
              >
                {screenshot ? "Change Screenshot" : "Attach Screenshot (Optional)"}
              </Button>
            </label>
            {errors.screenshot && (
              <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
                {errors.screenshot}
              </Typography>
            )}
            {screenshotPreview && (
              <Box sx={{ mt: 2 }}>
                <img
                  src={screenshotPreview}
                  alt="Screenshot preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "200px",
                    borderRadius: "8px",
                    border: "1px solid #E0E0E0",
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  {screenshot?.name}
                </Typography>
              </Box>
            )}
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
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isPending || isSuccess}
          startIcon={isPending ? <CircularProgress size={20} /> : null}
          sx={{
            fontFamily: '"General Sans", sans-serif',
            fontWeight: 500,
            fontSize: "16px",
            padding: "10px 24px",
            borderRadius: "12px",
            textTransform: "none",
            backgroundColor: "#434775",
            color: "white",
            "&:hover": {
              backgroundColor: "#363A5F",
            },
            "&:disabled": {
              backgroundColor: "#E0E0E0",
              color: "#9E9E9E",
            },
          }}
        >
          {isPending ? "Submitting..." : isSuccess ? "Submitted!" : "Send Message"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContactDialog;
