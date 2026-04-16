/**
 * Custom hook to resend email verification using the AuthService.
 *
 * This hook utilizes the `useMutation` hook from `@tanstack/react-query` to handle
 * the mutation for resending email verification.
 *
 * @returns {UseMutationResult} The result of the mutation, including status and mutation functions.
 *
 * @example
 * const { mutateAsync: resendVerification, isPending } = useResendVerification();
 * await resendVerification({ email: "user@example.com" });
 */
import { AuthService } from "@/client";
import { useMutation } from "@tanstack/react-query";
import { useSnackBarContext } from "@/context/SnackBarContext";

export const useResendVerification = () => {
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: AuthService.resendVerificationApiAuthResendVerificationPost,
    onSuccess: () => {
      createSnackBar({
        content: "Verification email sent! Check your inbox.",
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      const message =
        error?.body?.detail || "Failed to send verification email";
      createSnackBar({
        content: message,
        severity: "error",
        autoHide: true,
      });
    },
  });
};
