/**
 * Product Analytics Utility
 * 
 * Tracks user behavior within the Wordsworth AI platform.
 * Session-based tracking with localStorage persistence.
 */

import { getBackendUrl } from '@/config/api';

/**
 * Get or create session ID for analytics tracking.
 * Session ID persists indefinitely in localStorage.
 * 
 * @returns {string} UUID session identifier
 */
export const getOrCreateSessionId = (): string => {
  const SESSION_KEY = 'wwai_session_id';
  
  let sessionId = localStorage.getItem(SESSION_KEY);
  
  if (!sessionId) {
    // Generate new UUID v4
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  
  return sessionId;
};

/**
 * Track business info submission from create-site flow.
 * 
 * This fires when user clicks "Next" on the first step of onboarding,
 * regardless of whether they sign up or not.
 * 
 * @param data - Business information submitted by user
 */
export const trackOnboardingStep = async (data: {
  business_name?: string;
  google_maps_url?: string;
  yelp_url?: string;
  google_places_data?: any;
}): Promise<void> => {
  const sessionId = getOrCreateSessionId();
  
  try {
    await fetch(getBackendUrl('/api/product-analytics/onboarding-event'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        business_name: data.business_name || null,
        google_maps_url: data.google_maps_url || null,
        yelp_url: data.yelp_url || null,
        google_places_data: data.google_places_data || null,
      }),
    });
    
    // Success - event tracked
    console.debug('✅ Onboarding event tracked', { sessionId });
  } catch (error) {
    // Don't block user flow if analytics fails
    console.error('⚠️ Failed to track onboarding event:', error);
  }
};

/**
 * Clear session ID (useful after successful business creation).
 * Call this to start fresh session for next business creation.
 */
export const clearAnalyticsSession = (): void => {
  localStorage.removeItem('wwai_session_id');
};