/**
 * Normalize generation error messages for display.
 * Raw exception names (e.g. "AssertionError()") are replaced with a user-friendly message.
 */

const FRIENDLY_DEFAULT = 'Generation failed. Please try again or start over.';

/** Matches raw exception names like "AssertionError()", "ValueError(...)", "RuntimeError: msg" */
const RAW_EXCEPTION_PATTERN = /^[A-Za-z]+(Error|Exception)(\(\))?(\s*:.*)?$/;

/**
 * Returns a user-friendly error message for generation failures.
 * If the raw message looks like a Python/JS exception name, returns a default friendly message.
 */
export function getDisplayErrorMessage(raw: string | null | undefined): string {
  if (raw == null || String(raw).trim() === '') {
    return FRIENDLY_DEFAULT;
  }
  const s = String(raw).trim();
  if (RAW_EXCEPTION_PATTERN.test(s)) {
    return FRIENDLY_DEFAULT;
  }
  return s;
}

/**
 * Returns true if the raw message looks like a technical exception (so we can show "Details").
 */
export function isTechnicalErrorMessage(raw: string | null | undefined): boolean {
  if (raw == null || String(raw).trim() === '') return false;
  return RAW_EXCEPTION_PATTERN.test(String(raw).trim());
}
