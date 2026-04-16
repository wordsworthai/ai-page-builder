import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
import { AuthService, LoginForm } from "@/client";
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useLoginForm } from "@/hooks";
import {
  AuthInput,
  AuthPrimaryButton,
  AuthFormField,
  AuthLink,
  AuthHelperText,
} from "@/components/Shared";
import {
  StyledForm,
  StyledButtonContainer,
  StyledIconButton,
  StyledVisibilityIcon,
  StyledVisibilityOffIcon,
} from "@/pages/Shared/Auth/styles/shared.styles";
import { StyledForgotPasswordLinkContainer } from "@/pages/Shared/Auth/styles/login.styles";

export default function EmailLoginForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useLoginForm();

  const loginMutation = useMutation({
    mutationFn: AuthService.loginApiAuthLoginPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      createSnackBar({
        content: "Welcome back! Login successful",
        autoHide: true,
        severity: "success",
      });
      navigate("/dashboard");
    },
    onError: () => {
      createSnackBar({
        content: "Invalid credentials. Please try again.",
        autoHide: true,
        severity: "error",
      });
    },
  });

  const onForgotPassword = () => {
    navigate("/forgot-password");
  };

  const onSignUp = () => {
    navigate("/signup");
  };

  const onSubmit = async (data: LoginForm) => {
    await loginMutation.mutateAsync(data);
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

        {/* Forgot Password Link */}
        <StyledForgotPasswordLinkContainer>
          <AuthLink
            onClick={onForgotPassword}
            sx={{ ml: 0 }}
          >
            Forgot password?
          </AuthLink>
        </StyledForgotPasswordLinkContainer>
      </AuthFormField>

      {/* Login Button */}
      <StyledButtonContainer justifyContent="flex-end">
        <AuthPrimaryButton
          type="submit"
          disabled={isSubmitting || loginMutation.isPending}
          sx={{ width: "100%" }}
        >
          {isSubmitting || loginMutation.isPending
            ? "Logging in..."
            : "Login"}
        </AuthPrimaryButton>
      </StyledButtonContainer>

      {/* Signup Link */}
      <AuthHelperText linkText="Signup" onLinkClick={onSignUp}>
        Don't have an account?{" "}
      </AuthHelperText>
    </StyledForm>
  );
}
