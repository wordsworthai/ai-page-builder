/**
 * Custom hook to fetch available sections using react-query.
 *
 * This hook utilizes the `useQuery` hook from `@tanstack/react-query` to fetch
 * available sections by calling the `/api/sections` endpoint.
 *
 * @returns {object} The result of the `useQuery` hook, which includes the sections data,
 *                   loading state, error state, and other query-related information.
 */
import { useQuery } from "@tanstack/react-query";
import { OpenAPI } from "@/client";
import type { SectionMetadata } from "@/components/PageBuilder/PuckEditor/components/LiquidEditor/SectionAddition.types";

const fetchSections = async (categoryKey?: string): Promise<SectionMetadata[]> => {
  const baseUrl = `${OpenAPI.BASE || ''}/api/templates/sections/catalog`;
  const url = categoryKey
    ? `${baseUrl}?category_key=${encodeURIComponent(categoryKey)}`
    : baseUrl;
  
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sections: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const useSections = (categoryKey?: string) => {
  const result = useQuery({
    queryKey: ["sections", categoryKey ?? "all"],
    queryFn: () => fetchSections(categoryKey),
    enabled: true, // Fetch with or without category filter
    refetchOnWindowFocus: false,
    retry: false,
  });
  return result;
};
