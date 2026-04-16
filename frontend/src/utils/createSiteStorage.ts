/**
 * Utility functions for managing create site data in localStorage
 */

const STORAGE_KEY = "createSiteData";

import type { GooglePlacesData } from "@/types/smbRecommendation";

export interface CreateSiteData {
  businessName: string;
  googleUrl?: string;
  yelpUrl?: string;
  purpose?: string;
  tone?: string;
  colorPalette?: string;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  googlePlacesData?: GooglePlacesData;
}

/**
 * Save create site data to localStorage
 */
export const saveCreateSiteData = (data: Partial<CreateSiteData>): void => {
  const existing = getCreateSiteData();
  const updated = { ...existing, ...data };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

/**
 * Get create site data from localStorage
 */
export const getCreateSiteData = (): CreateSiteData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { businessName: "", googleUrl: "", yelpUrl: "" };
  } catch (error) {
    console.error("Error reading create site data from localStorage:", error);
    return { businessName: "", googleUrl: "", yelpUrl: "" };
  }
};

/**
 * Clear create site data from localStorage
 */
export const clearCreateSiteData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

const PENDING_BUSINESS_DATA_CREATION_FLAG_KEY = "createSitePendingBusinessDataCreation";

/**
 * Mark that there's pending business data to be created after authentication
 */
export const setPendingBusinessDataCreation = (): void => {
  localStorage.setItem(PENDING_BUSINESS_DATA_CREATION_FLAG_KEY, "true");
};

/**
 * Check if there's pending business data creation
 */
export const hasPendingBusinessDataCreation = (): boolean => {
  return localStorage.getItem(PENDING_BUSINESS_DATA_CREATION_FLAG_KEY) === "true";
};

/**
 * Clear the pending business data creation flag
 */
export const clearPendingBusinessDataCreation = (): void => {
  localStorage.removeItem(PENDING_BUSINESS_DATA_CREATION_FLAG_KEY);
};

const PENDING_GENERATION_KEY = "pendingGenerationAfterVerification";

/**
 * Mark that generation is pending email verification.
 * Used to persist the "just verified" state across page refreshes.
 */
export const setPendingGenerationAfterVerification = (): void => {
  localStorage.setItem(PENDING_GENERATION_KEY, "true");
};

/**
 * Check if generation is pending email verification
 */
export const hasPendingGenerationAfterVerification = (): boolean => {
  return localStorage.getItem(PENDING_GENERATION_KEY) === "true";
};

/**
 * Clear the pending generation after verification flag
 */
export const clearPendingGenerationAfterVerification = (): void => {
  localStorage.removeItem(PENDING_GENERATION_KEY);
};

// =============================================================================
// Pending Create Site State (for credits-blocked flow)
// =============================================================================

const PENDING_CREATE_SITE_KEY = "pendingCreateSiteState";

export type PendingCreateSiteReason = "credits";
export type PendingCreateSiteStatus = "blocked" | "resume";

export interface PendingCreateSiteState {
  reason: PendingCreateSiteReason;
  status: PendingCreateSiteStatus;
  createdAt: number;
}

/**
 * Set pending create-site state to credits-blocked.
 * Called when generation fails with 403 insufficient credits.
 */
export const setPendingCreateSiteCreditsBlocked = (): void => {
  const state: PendingCreateSiteState = {
    reason: "credits",
    status: "blocked",
    createdAt: Date.now(),
  };
  localStorage.setItem(PENDING_CREATE_SITE_KEY, JSON.stringify(state));
};

/**
 * Set pending create-site state to credits-resume.
 * Called when user successfully upgrades and we want to resume generation.
 */
export const setPendingCreateSiteCreditsResume = (): void => {
  const state: PendingCreateSiteState = {
    reason: "credits",
    status: "resume",
    createdAt: Date.now(),
  };
  localStorage.setItem(PENDING_CREATE_SITE_KEY, JSON.stringify(state));
};

/**
 * Get the current pending create-site state
 */
export const getPendingCreateSiteState = (): PendingCreateSiteState | null => {
  try {
    const stored = localStorage.getItem(PENDING_CREATE_SITE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * Check if pending create-site is in credits-blocked state
 */
export const isPendingCreateSiteCreditsBlocked = (): boolean => {
  const state = getPendingCreateSiteState();
  return state?.reason === "credits" && state?.status === "blocked";
};

/**
 * Check if pending create-site is in credits-resume state
 */
export const isPendingCreateSiteCreditsResume = (): boolean => {
  const state = getPendingCreateSiteState();
  return state?.reason === "credits" && state?.status === "resume";
};

/**
 * Clear the pending create-site state
 */
export const clearPendingCreateSiteState = (): void => {
  localStorage.removeItem(PENDING_CREATE_SITE_KEY);
};

