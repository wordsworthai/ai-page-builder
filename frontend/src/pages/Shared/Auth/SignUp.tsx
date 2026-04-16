import { useNavigate } from "react-router-dom";
import { Container } from "@mui/material";
import { getBackendUrl } from "@/config/api";
// import EmailSignupForm from "@/components/shared/auth/EmailSignupForm";
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

export default function SignUp() {
  const navigate = useNavigate();

  const onLogin = () => {
    navigate("/login");
  };
  return (
    <StyledAuthPageContainer>
      <Container maxWidth="md" disableGutters>
        <AuthFormCard>
          <StyledAuthStack spacing={0}>
            {/* Header and Form Section */}
            <StyledHeaderSection>
              <AuthPageTitle>Signup</AuthPageTitle>

              {/* Email/Password Form - Commented out to use Google OAuth only */}
              {/* <EmailSignupForm /> */}
            {/* Login Link */}
              <AuthHelperText linkText="Login" onLinkClick={onLogin}>
                Already have an account?{" "}
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