// frontend/src/config/smbConfig.ts

/**
 * Configuration for SMB Generator
 */

// Google Places API configuration
export const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';
export const GOOGLE_MAPS_LIBRARIES = ['places'] as const;

// LocalStorage keys (separate from login flow)
export const SMB_TEST_STORAGE_KEY = 'smb_test_data';

// SMB-specific progress steps (for ProgressSidebar)
export const SMB_PROGRESS_STEPS = [
  "Validating business information",
  "Fetching Google Places data",
  "Scraping Yelp reviews",
  "Synthesizing campaign brief",
  "Loading section repository",
  "Filtering section types",
  "Generating template structures",
  "Mapping sections to templates",
  "Enriching with screenshots",
  "Finalizing recommendations",
];

// Total nodes count (for progress calculation)
export const TOTAL_NODES_WITHOUT_REFLECTION = 9;
export const TOTAL_NODES_WITH_REFLECTION = 11;