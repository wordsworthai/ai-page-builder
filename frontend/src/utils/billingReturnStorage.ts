/**
 * Utility for storing return origin when navigating to billing from credit-check modals.
 * After payment success, Billing reads this and redirects the user back.
 */

const STORAGE_KEY = "billingReturnOrigin";
const EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export interface BillingReturnOrigin {
  path: string;
  context?: Record<string, unknown>;
  createdAt: number;
}

/**
 * Set the return origin before navigating to billing.
 * Called when user clicks "Buy Credits" in a credit-check modal.
 */
export const setBillingReturnOrigin = (
  path: string,
  context?: Record<string, unknown>
): void => {
  const state: BillingReturnOrigin = {
    path,
    context,
    createdAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

/**
 * Get the stored return origin, or null if expired/missing.
 */
export const getBillingReturnOrigin = (): {
  path: string;
  context?: Record<string, unknown>;
} | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as BillingReturnOrigin;
    if (!parsed.path || typeof parsed.path !== "string") return null;

    const age = Date.now() - (parsed.createdAt ?? 0);
    if (age > EXPIRY_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      path: parsed.path,
      context: parsed.context,
    };
  } catch {
    return null;
  }
};

/**
 * Clear the stored return origin after redirecting.
 */
export const clearBillingReturnOrigin = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Check if a valid return origin exists.
 */
export const hasBillingReturnOrigin = (): boolean => {
  return getBillingReturnOrigin() !== null;
};
