import {
  Box,
  Button,
  IconButton,
  Link,
  Typography,
  alpha,
  styled,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { ReactNode, useState } from "react";

export const AuthFormCard = styled(Box)(({ theme }) => ({
  backgroundColor: "#ffffff",
  borderRadius: "24px",
  boxShadow: "0px 48px 100px 0px rgba(17, 12, 46, 0.15)",
  padding: theme.spacing(4.5),
  width: "100%",
  maxWidth: "500px",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2.5),
    borderRadius: "16px",
  },
  ...theme.applyStyles("dark", {
    backgroundColor: theme.palette.background.paper,
  }),
}));

export const AuthInput = styled(Box)(({ theme }) => ({
  backgroundColor: "#efefef",
  borderRadius: "12px",
  padding: "16px 20px",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  border: "none",
  "& input": {
    border: "none",
    outline: "none",
    backgroundColor: "transparent",
    flex: 1,
    fontFamily: "'General Sans', sans-serif",
    fontWeight: 500,
    fontSize: "16px",
    color: theme.palette.text.primary,
    padding: 0,
    margin: 0,
    "&::placeholder": {
      color: "#afafaf",
      fontFamily: "'General Sans', sans-serif",
      fontWeight: 500,
    },
  },
  ...theme.applyStyles("dark", {
    backgroundColor: alpha(theme.palette.background.default, 0.5),
  }),
}));

export const AuthPrimaryButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#434775",
  borderRadius: "12px",
  padding: "16px 24px",
  textTransform: "none",
  fontWeight: 600,
  fontSize: "16px",
  color: "#ffffff",
  width: "100%",
  "&:hover": {
    backgroundColor: "#353a5f",
  },
  "&:disabled": {
    backgroundColor: alpha("#434775", 0.5),
  },
}));

export const AuthGoogleButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#efefef",
  borderRadius: "12px",
  padding: "16px 24px",
  textTransform: "none",
  fontWeight: 500,
  fontSize: "16px",
  color: "#585858",
  width: "100%",
  marginTop: "15px",
  gap: "8px",
  "&:hover": {
    backgroundColor: "#e0e0e0",
  },
  ...theme.applyStyles("dark", {
    backgroundColor: alpha(theme.palette.background.default, 0.5),
    color: theme.palette.text.primary,
  }),
}));

export const GoogleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
}

export const PasswordInput = ({
  value,
  onChange,
  placeholder = "Password",
  required = false,
  error = false,
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthInput>
      <input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-invalid={error}
      />
      <IconButton
        onClick={() => setShowPassword(!showPassword)}
        edge="end"
        sx={{
          padding: 0,
          minWidth: "24px",
          width: "24px",
          height: "24px",
          color: "#afafaf",
          "&:hover": {
            backgroundColor: "transparent",
          },
        }}
      >
        {showPassword ? (
          <VisibilityOff sx={{ fontSize: "24px", width: "24px", height: "24px" }} />
        ) : (
          <Visibility sx={{ fontSize: "24px", width: "24px", height: "24px" }} />
        )}
      </IconButton>
    </AuthInput>
  );
};

interface AuthFormFieldProps {
  children: ReactNode;
  error?: string;
}

export const AuthFormField = ({ children, error }: AuthFormFieldProps) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {children}
      {error && (
        <Typography
          variant="caption"
          color="error"
          sx={{ fontSize: "12px", ml: 1 }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
};

interface AuthLinkProps {
  onClick: () => void;
  children: ReactNode;
  sx?: any;
}

export const AuthLink = ({ onClick, children, sx }: AuthLinkProps) => {
  return (
    <Link
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        color: "#757bc8",
        fontFamily: "'General Sans', sans-serif",
        fontWeight: 500,
        fontSize: "12px",
        textDecoration: "none",
        cursor: "pointer",
        border: "none",
        background: "none",
        padding: 0,
        ml: 0.5,
        lineHeight: 1.6,
        letterSpacing: "-0.24px",
        "&:hover": {
          textDecoration: "underline",
        },
        ...sx,
      }}
    >
      {children}
    </Link>
  );
};

interface AuthPageTitleProps {
  children: ReactNode;
}

export const AuthPageTitle = ({ children }: AuthPageTitleProps) => {
  return (
    <Typography
      sx={{
        fontFamily: "'General Sans', sans-serif",
        fontWeight: 600,
        fontSize: "20px",
        color: "#565656",
        letterSpacing: "-0.4px",
        textAlign: "center",
      }}
    >
      {children}
    </Typography>
  );
};

interface AuthHelperTextProps {
  children: ReactNode;
  linkText?: string;
  onLinkClick?: () => void;
}

export const AuthHelperText = ({ children, linkText, onLinkClick }: AuthHelperTextProps) => {
  return (
    <Typography
      component="span"
      sx={{
        fontFamily: "'General Sans', sans-serif",
        fontWeight: 500,
        fontSize: "12px",
        color: "#919191",
        textAlign: "center",
        lineHeight: 1.6,
        letterSpacing: "-0.24px",
        display: "block",
      }}
    >
      {children}
      {linkText && onLinkClick && (
        <>
          {" "}
          <AuthLink onClick={onLinkClick} sx={{ ml: 0 }}>
            {linkText}
          </AuthLink>
        </>
      )}
    </Typography>
  );
};

