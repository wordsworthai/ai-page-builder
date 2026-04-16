/**
 * Generation-specific types for page generation.
 * 
 * These types extend the base streaming types with generation-specific fields.
 */

import type { StreamingStatus, NodeExecutionEntry } from './index';

/**
 * Generation status response from backend (page generation specific).
 */
export interface GenerationStatus extends StreamingStatus {
  generation_version_id: string;
  
  // Result
  preview_link: string | null;
  
  // Legacy fields
  progress: number;
  dev_task_id: string | null;
  query_hash: string | null;
  created_at: string | null;
  completed_at: string | null;
}

// Re-export NodeExecutionEntry for convenience
export type { NodeExecutionEntry };

// ============================================================================
// UI STATE TYPES
// ============================================================================

export type CompilationStatus =
  | 'idle'
  | 'creating_spec'
  | 'fetching_template'
  | 'building_html'
  | 'uploading'
  | 'completed'
  | 'error';

export type WebsiteComponentState =
  | 'idle'
  | 'checking'
  | 'generating'
  | 'compiling'
  | 'ready'
  | 'error'
  | 'empty';

export interface DashboardNavigationState {
  generation_version_id?: string;
  fromCreateSite?: boolean;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export interface GenerationError {
  code: string;
  message: string;
  node?: string;
  retryable: boolean;
}

export const ERROR_CODES = {
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  GENERATION_FAILED: 'GENERATION_FAILED',
  COMPILATION_FAILED: 'COMPILATION_FAILED',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  // Legacy alias for backwards compatibility
  QUOTA_EXCEEDED: 'INSUFFICIENT_CREDITS',
} as const;

export function createGenerationError(
  error: any,
  defaultMessage: string = 'An error occurred'
): GenerationError {
  if (error.status === 403) {
    // Check if error message mentions credits
    const detail = error.body?.detail || '';
    const isCreditsError = typeof detail === 'string' && 
      (detail.toLowerCase().includes('credit') || detail.toLowerCase().includes('insufficient'));
    
    return {
      code: ERROR_CODES.INSUFFICIENT_CREDITS,
      message: isCreditsError 
        ? detail 
        : 'Insufficient credits. Please purchase more credits or upgrade your plan.',
      retryable: false
    };
  }
  
  if (error.status === 400) {
    return {
      code: ERROR_CODES.VALIDATION_ERROR,
      message: error.body?.detail || 'Invalid request.',
      retryable: false
    };
  }
  
  if (error.status >= 500) {
    return {
      code: ERROR_CODES.NETWORK_ERROR,
      message: 'Server error. Please try again.',
      retryable: true
    };
  }
  
  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: error.message || defaultMessage,
    retryable: true
  };
}
