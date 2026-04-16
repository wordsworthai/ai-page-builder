import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
import { AuthService, SignupForm } from "@/client";
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useSignUpForm } from "@/hooks";
import { useCreateBusiness } from "@/hooks/api/PageBuilder/CreateSite/useCreateBusiness";
import {
  AuthInput,
  AuthPrimaryButton,
  AuthFormField,
  AuthHelperText,
} from "@/components/Shared";
import {
  StyledForm,
  StyledButtonContainer,
  StyledIconButton,
  StyledVisibilityIcon,
  StyledVisibilityOffIcon,
} from "@/pages/Shared/Auth/styles/shared.styles";

export default function EmailSignupForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useSignUpForm();

  const createBusinessMutation = useCreateBusiness();

  const signUpMutation = useMutation({
    mutationFn: AuthService.signupApiAuthSignupPost,
    onSuccess: async (response) => {
      queryClient.setQueryData(["currentUser"], response.user);
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      await queryClient.refetchQueries({ queryKey: ["currentUser"] });

      if (!response.user.business_id) {
        try {
          await createBusinessMutation.mutateAsync({
            business_name: response.user.email,
          });
          await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
          await queryClient.refetchQueries({ queryKey: ["currentUser"] });
        } catch (error) {
          console.error("Failed to create business after signup:", error);
        }
      }

      createSnackBar({
        content: "Account created successfully! Please check your email to verify your account.",
        autoHide: true,
        severity: "success",
      });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      const errorMessage = error.body?.detail?.message || error.body?.detail || "Error creating account. Please try again.";
      createSnackBar({
        content: errorMessage,
        autoHide: true,
        severity: "error",
      });
    },
  });

  const onLogin = () => {
    navigate("/login");
  };

  const onSubmit = (data: SignupForm) => {
    const signupPayload: SignupForm = {
      email: data.email,
      password: data.password,
    };
    signUpMutation.mutateAsync(signupPayload);
  };

  return (
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

      {/* Password Field */}
      <AuthFormField error={errors.password?.message as string}>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <AuthInput>
              <input
                {...field}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
              />
              <StyledIconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? (
                  <StyledVisibilityOffIcon />
                ) : (
                  <StyledVisibilityIcon />
                )}
              </StyledIconButton>
            </AuthInput>
          )}
        />
      </AuthFormField>

      {/* Confirm Password Field */}
      <AuthFormField error={errors.verify_password?.message as string}>
        <Controller
          name="verify_password"
          control={control}
          render={({ field }) => (
            <AuthInput>
              <input
                {...field}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                required
              />
              <StyledIconButton
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                edge="end"
              >
                {showConfirmPassword ? (
                  <StyledVisibilityOffIcon />
                ) : (
                  <StyledVisibilityIcon />
                )}
              </StyledIconButton>
            </AuthInput>
          )}
        />
      </AuthFormField>

      {/* Signup Button */}
      <StyledButtonContainer justifyContent="flex-end">
        <AuthPrimaryButton
          type="submit"
          disabled={isSubmitting || signUpMutation.isPending}
          sx={{ width: "100%" }}
        >
          {isSubmitting || signUpMutation.isPending
            ? "Creating account..."
            : "Login"}
        </AuthPrimaryButton>
      </StyledButtonContainer>

      {/* Login Link */}
      <AuthHelperText linkText="Login" onLinkClick={onLogin}>
        Already have an account?{" "}
      </AuthHelperText>
    </StyledForm>
  );
}
