/**
 * Custom hook to delete user account using the AuthService.
 *
 * This hook utilizes the `useMutation` hook from `@tanstack/react-query` to handle
 * the mutation for soft-deleting a user account with 30-day retention.
 *
 * @returns {UseMutationResult} The result of the mutation, including status and mutation functions.
 *
 * @example
 * const { mutateAsync: deleteAccount, isPending } = useDeleteAccount();
 * await deleteAccount({ confirmation: "DELETE", password: "mypassword", reason: "optional reason" });
 */
import { AuthService, DeleteAccountRequest } from "@/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (requestBody: DeleteAccountRequest) =>
      AuthService.deleteAccountApiAuthAccountDelete(requestBody),
    onSuccess: () => {
      // Clear all cached queries since user is logged out
      queryClient.clear();
    },
  });
};
