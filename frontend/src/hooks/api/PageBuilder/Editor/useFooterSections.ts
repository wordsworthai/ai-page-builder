/**
 * Custom hook to fetch footer sections for Replace Footer.
 *
 * Fetches sections that can be used as the page footer
 * from the section catalog API.
 */
import { useQuery } from "@tanstack/react-query";
import { OpenAPI } from "@/client";
import type { SectionMetadata } from "@/components/PageBuilder/PuckEditor/components/LiquidEditor/SectionAddition.types";

const fetchFooterSections = async (): Promise<SectionMetadata[]> => {
  const url = `${OpenAPI.BASE || ''}/api/templates/sections/catalog/footer`;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch footer sections: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const useFooterSections = () => {
  return useQuery({
    queryKey: ["sections", "footer"],
    queryFn: fetchFooterSections,
    refetchOnWindowFocus: false,
    retry: false,
  });
};
