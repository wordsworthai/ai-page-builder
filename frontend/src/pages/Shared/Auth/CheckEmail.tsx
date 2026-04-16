import { Container } from "@mui/material";
import { ArrowBack, Refresh } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  AuthFormCard,
  AuthPrimaryButton,
  AuthGoogleButton,
  AuthPageTitle,
  AuthHelperText,
} from "@/components/Shared";
import {
  StyledAuthPageContainer,
  StyledAuthStack,
  StyledHeaderSection,
  StyledActionButtonsContainer,
} from "./styles/shared.styles";
import {
  StyledInstructionsText,
  StyledInstructionsList,
  StyledInstructionItem,
  StyledHelpTextContainer,
} from "./styles/checkEmail.styles";

export default function CheckEmail() {
  const navigate = useNavigate();

  const onBackToLogin = () => {
    navigate("/login");
  };

  const onResendEmail = () => {
    navigate("/forgot-password");
  };

  return (
    <StyledAuthPageContainer>
      <Container maxWidth="md" disableGutters>
        <AuthFormCard>
          <StyledAuthStack spacing={0}>
            {/* Header and Content Section */}
            <StyledHeaderSection>
              <AuthPageTitle>Check Your Email</AuthPageTitle>

              {/* Instructions */}
              <StyledInstructionsText>
                We've sent password reset instructions to your email address. Please check your inbox and follow the link to reset your password.
              </StyledInstructionsText>

              {/* Simplified Instructions List */}
              <StyledInstructionsList>
                <StyledInstructionItem>
                  • Check your email inbox (and spam folder)
                </StyledInstructionItem>
                <StyledInstructionItem>
                  • Click the "Reset Password" button in the email
                </StyledInstructionItem>
                <StyledInstructionItem>
                  • Create a new, secure password
                </StyledInstructionItem>
                <StyledInstructionItem>
                  • Sign in with your new password
                </StyledInstructionItem>
              </StyledInstructionsList>

              {/* Action Buttons */}
              <StyledActionButtonsContainer>
                <AuthPrimaryButton
                  fullWidth
                  startIcon={<ArrowBack />}
                  onClick={onBackToLogin}
                >
                  Back to Login
                </AuthPrimaryButton>

                <AuthGoogleButton
                  fullWidth
                  startIcon={<Refresh />}
                  onClick={onResendEmail}
                  sx={{ marginTop: 0 }}
                >
                  Didn't receive the email? Resend
                </AuthGoogleButton>
              </StyledActionButtonsContainer>
            </StyledHeaderSection>

            {/* Help Text */}
            <StyledHelpTextContainer>
              <AuthHelperText>
                If you continue to have problems, please contact our support team.
              </AuthHelperText>
            </StyledHelpTextContainer>
          </StyledAuthStack>
        </AuthFormCard>
      </Container>
    </StyledAuthPageContainer>
  );
}
