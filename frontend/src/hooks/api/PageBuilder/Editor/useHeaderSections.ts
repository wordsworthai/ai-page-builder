/**
 * Custom hook to fetch header sections for Replace Header.
 *
 * Fetches sections that can be used as the page header (e.g. Navigation Bar)
 * from the section catalog API.
 */
import { useQuery } from "@tanstack/react-query";
import { OpenAPI } from "@/client";
import type { SectionMetadata } from "@/components/PageBuilder/PuckEditor/components/LiquidEditor/SectionAddition.types";

const fetchHeaderSections = async (): Promise<SectionMetadata[]> => {
  const url = `${OpenAPI.BASE || ''}/api/templates/sections/catalog/header`;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch header sections: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const useHeaderSections = () => {
  return useQuery({
    queryKey: ["sections", "header"],
    queryFn: fetchHeaderSections,
    refetchOnWindowFocus: false,
    retry: false,
  });
};
