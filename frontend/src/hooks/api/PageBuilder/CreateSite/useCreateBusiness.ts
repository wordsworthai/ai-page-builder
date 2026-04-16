/**
 * Custom hook to create a business for an authenticated user after OAuth signup.
 *
 * This hook utilizes the `useMutation` hook from `@tanstack/react-query` to handle
 * the mutation for creating a business with the data from the create site flow.
 *
 * @returns {UseMutationResult} The result of the mutation, including status and mutation functions.
 *
 * @example
 * const { mutateAsync: createBusiness, isPending } = useCreateBusiness();
 * await createBusiness({
 *   business_name: "My Business",
 *   google_maps_url: "...",
 *   ...
 * });
 */
import { AuthService } from "@/client";
import { useMutation } from "@tanstack/react-query";

export interface CreateBusinessRequest {
  business_name?: string;
  google_maps_url?: string;
  google_maps_data?: any;
  yelp_url?: string;
  intent?: string;
  tone?: string;
  color_palette_id?: string;
}

export const useCreateBusiness = () => {
  return useMutation({
    mutationFn: (data: CreateBusinessRequest) =>
      AuthService.createBusinessApiAuthBusinessCreatePost(data),
  });
};

