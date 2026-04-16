/**
 * Persistence utilities for Generation State Context.
 * Handles localStorage read/write with staleness checks and error handling.
 */

export interface GenerationState {
  // Active generation being tracked
  activeGenerationVersionId: string;
  
  // Generation metadata
  generationType: 'fresh' | 'partial-color' | 'partial-content' | 'partial-section' | 'from-template';
  
  // For partial generations: source generation ID
  sourceGenerationVersionId: string | null;
  
  // Navigation context flags
  fromCreateSite: boolean;
  fromUseTemplate: boolean;
  fromPartialAutopop: boolean;
  
  // Timestamp for cleanup/staleness checks
  timestamp: number;
}

const STORAGE_KEY = 'generation_state';
const MAX_STALE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Read generation state from localStorage
 */
export function getPersistedGenerationState(): GenerationState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const state: GenerationState = JSON.parse(stored);
    
    // Check if state is stale
    if (isStateStale(state)) {
      clearPersistedGenerationState();
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('Failed to read persisted generation state:', error);
    // Clear corrupted data
    clearPersistedGenerationState();
    return null;
  }
}

/**
 * Write generation state to localStorage
 */
export function setPersistedGenerationState(state: GenerationState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to persist generation state:', error);
  }
}

/**
 * Clear generation state from localStorage
 */
export function clearPersistedGenerationState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear persisted generation state:', error);
  }
}

/**
 * Check if state is stale (older than max age)
 */
export function isStateStale(state: GenerationState, maxAgeMs: number = MAX_STALE_AGE_MS): boolean {
  const age = Date.now() - state.timestamp;
  return age > maxAgeMs;
}
