/**
 * Custom hook to fetch section categories using react-query.
 *
 * This hook utilizes the `useQuery` hook from `@tanstack/react-query` to fetch
 * available section categories by calling the `/api/sections/categories` endpoint.
 *
 * @returns {object} The result of the `useQuery` hook, which includes the categories data,
 *                   loading state, error state, and other query-related information.
 */
import { useQuery } from "@tanstack/react-query";
import { OpenAPI } from "@/client";

export interface CategoryResponse {
  key: string;
  name: string;
  description: string;
}

const fetchCategories = async (): Promise<CategoryResponse[]> => {
  const url = `${OpenAPI.BASE || ''}/api/templates/sections/catalog/categories`;
  
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const useCategories = () => {
  const result = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    refetchOnWindowFocus: false,
    retry: false,
  });
  return result;
};
