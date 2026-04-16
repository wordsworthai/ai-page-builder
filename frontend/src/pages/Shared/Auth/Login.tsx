import { useNavigate } from "react-router-dom";
import { Container } from "@mui/material";
import { getBackendUrl } from "@/config/api";
// import EmailLoginForm from "@/components/shared/auth/EmailLoginForm";
import {
  AuthFormCard,
  AuthGoogleButton,
  GoogleIcon,
  AuthPageTitle,
  AuthHelperText,
} from "@/components/Shared";
import {
  StyledAuthPageContainer,
  StyledAuthStack,
  StyledHeaderSection,
  StyledSocialButtonsContainer,
} from "./styles/shared.styles";

export default function Login() {
  const navigate = useNavigate();
  const onSignUp = () => {
    navigate("/signup");
  };
  return (
    <StyledAuthPageContainer>
      <Container maxWidth="md" disableGutters>
        <AuthFormCard>
          <StyledAuthStack spacing={0}>
            {/* Header and Form Section */}
            <StyledHeaderSection>
              <AuthPageTitle>Login</AuthPageTitle>

              {/* Email/Password Form - Commented out to use Google OAuth only */}
              {/* <EmailLoginForm /> */}

              {/* Signup Link */}
              <AuthHelperText linkText="Signup" onLinkClick={onSignUp}>
                Don't have an account?{" "}
              </AuthHelperText>
            </StyledHeaderSection>

            {/* Social Login Buttons */}
            <StyledSocialButtonsContainer>
              {/* Google Button */}
              <AuthGoogleButton
                href={getBackendUrl("/api/auth/google/authorize")}
                startIcon={<GoogleIcon />}
              >
                Login with Google
              </AuthGoogleButton>
            </StyledSocialButtonsContainer>
          </StyledAuthStack>
        </AuthFormCard>
      </Container>
    </StyledAuthPageContainer>
  );
}