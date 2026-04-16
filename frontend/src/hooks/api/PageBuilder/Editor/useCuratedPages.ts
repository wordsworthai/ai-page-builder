/**
 * Custom hook to fetch curated pages using react-query.
 */
import { useQuery } from "@tanstack/react-query";
import { OpenAPI } from "@/client";

export interface CuratedPageOption {
  page_path: string;
  page_title: string;
  section_ids: string[];
  section_desktop_urls: string[];
}

export interface CuratedPagesResponse {
  pages: CuratedPageOption[];
}

const fetchCuratedPages = async (): Promise<CuratedPagesResponse> => {
  const url = `${OpenAPI.BASE || ''}/api/templates/curated-pages`;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch curated pages: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const useCuratedPages = () => {
  return useQuery({
    queryKey: ["curated-pages"],
    queryFn: fetchCuratedPages,
    refetchOnWindowFocus: false,
    retry: false,
  });
};
