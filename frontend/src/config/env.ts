/**
 * Environment Variables Configuration
 * Centralized access to Vite environment variables
 */

/**
 * API Base URL for v1 endpoints
 * Defaults to http://localhost:8000/api/v1 in development
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * API Base URL for v1 endpoints
 * Defaults to http://localhost:8020 in development
 */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8020';

/**
 * Agentic API Base URL for v2 endpoints
 * Defaults to http://localhost:8000/api/v2 in development
 */
export const AGENTIC_BASE_URL = import.meta.env.VITE_AGENTIC_BASE_URL || 'http://localhost:8000/api/v2';

/**
 * SaaS API URL
 * Defaults to http://localhost:5001 in development
 */
export const API_SAAS_URL = import.meta.env.VITE_API_SAAS_URL || 'http://localhost:5001';

/**
 * Section API URL
 * Defaults to VITE_API_SECTION_URL env var, falls back to localhost in development
 */
export const API_SECTION_URL = import.meta.env.VITE_API_SECTION_URL || 'http://localhost:8030/api';

/**
 * Publishing domain for generated websites
 * Defaults to example.com in development
 */
export const PUBLISHING_DOMAIN = import.meta.env.VITE_PUBLISHING_DOMAIN || 'example.com';

// Debug info (removed in production builds)
if (import.meta.env.DEV) {
  console.log('🔧 Environment Configuration:', {
    mode: import.meta.env.MODE,
    apiBaseUrl: API_BASE_URL,
    agenticBaseUrl: AGENTIC_BASE_URL,
    apiSaasUrl: API_SAAS_URL,
    apiSectionUrl: API_SECTION_URL
  });
}



