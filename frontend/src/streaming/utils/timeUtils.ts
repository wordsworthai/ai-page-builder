/**
 * Time formatting utilities for streaming status.
 */

/**
 * Format elapsed time as human-readable string.
 */
export function formatElapsedTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format duration in milliseconds to human-readable string.
 */
export function formatDuration(ms: number | null): string {
  if (ms === null) return '';
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}
