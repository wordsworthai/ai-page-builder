import { useNavigate } from "react-router-dom";
import { Container } from "@mui/material";
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useForgotPassword } from "@/hooks/api/Shared/Auth/useForgotPassword";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  AuthFormCard,
  AuthInput,
  AuthPrimaryButton,
  AuthGoogleButton,
  AuthFormField,
  AuthPageTitle,
} from "@/components/Shared";
import {
  StyledAuthPageContainer,
  StyledAuthStack,
  StyledHeaderSection,
  StyledForm,
  StyledButtonContainer,
} from "./styles/shared.styles";
import { StyledInstructionsText } from "./styles/forgotPassword.styles";

const forgotPasswordSchema = yup.object({
  email: yup.string().email("Please enter a valid email address").required("Email is required"),
});

type ForgotPasswordForm = yup.InferType<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { createSnackBar } = useSnackBarContext();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<ForgotPasswordForm>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useForgotPassword();

  const onBack = () => {
    navigate("/login");
  };

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      await forgotPasswordMutation.mutateAsync({ email: data.email });
      createSnackBar({
        content: "Password reset instructions sent to your email",
        autoHide: true,
        severity: "success",
      });
      navigate("/check-email");
    } catch (error) {
      createSnackBar({
        content: "Error sending reset email. Please try again.",
        autoHide: true,
        severity: "error",
      });
    }
  };

  return (
    <StyledAuthPageContainer>
      <Container maxWidth="md" disableGutters>
        <AuthFormCard>
          <StyledAuthStack spacing={0}>
            {/* Header and Form Section */}
            <StyledHeaderSection>
              <AuthPageTitle>Forgot your password</AuthPageTitle>

              {/* Instructions */}
              <StyledInstructionsText>
                Please enter the email address you'd like your password reset information sent to
              </StyledInstructionsText>

              {/* Form */}
              <StyledForm onSubmit={handleSubmit(onSubmit)}>
                {/* Email Field */}
                <AuthFormField error={errors.email?.message as string}>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <AuthInput>
                        <input
                          {...field}
                          type="email"
                          placeholder="Email"
                          required
                        />
                      </AuthInput>
                    )}
                  />
                </AuthFormField>

                {/* Request Reset Link Button */}
                <StyledButtonContainer justifyContent="center">
                  <AuthPrimaryButton
                    type="submit"
                    disabled={isSubmitting || forgotPasswordMutation.isPending}
                    sx={{ width: "100%" }}
                  >
                    {isSubmitting || forgotPasswordMutation.isPending
                      ? "Sending..."
                      : "Request reset link"}
                  </AuthPrimaryButton>
                </StyledButtonContainer>

                {/* Back to Login Button */}
                <StyledButtonContainer justifyContent="center">
                  <AuthGoogleButton
                    onClick={onBack}
                    sx={{ marginTop: 0 }}
                  >
                    Back to Login
                  </AuthGoogleButton>
                </StyledButtonContainer>
              </StyledForm>
            </StyledHeaderSection>
          </StyledAuthStack>
        </AuthFormCard>
      </Container>
    </StyledAuthPageContainer>
  );
}
