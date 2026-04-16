/**
 * One key implementation detail to preserve behavior:
 * Replacement/loading flows often produce mixed shapes over time.
 *
 * This helper normalizes:
 * - structured values (object/array/primitive)
 * - legacy serialized values (JSON string)
 * - null/undefined
 */

export type NormalizedViewerValue =
  | { kind: "empty"; parsed: null; raw: null; displayText: string }
  | { kind: "json"; parsed: unknown; raw: unknown; displayText: string }
  | { kind: "raw_string"; parsed: null; raw: string; displayText: string };

export function normalizeValueForViewer(value: unknown): NormalizedViewerValue {
  if (value === null || value === undefined) {
    return { kind: "empty", parsed: null, raw: null, displayText: "null" };
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return { kind: "raw_string", parsed: null, raw: value, displayText: "" };
    }

    try {
      const parsed = JSON.parse(trimmed);
      return {
        kind: "json",
        parsed,
        raw: value,
        displayText: JSON.stringify(parsed, null, 2),
      };
    } catch {
      return { kind: "raw_string", parsed: null, raw: value, displayText: value };
    }
  }

  // structured / primitive value
  try {
    return {
      kind: "json",
      parsed: value,
      raw: value,
      displayText: JSON.stringify(value, null, 2),
    };
  } catch {
    // Fallback if something isn't serializable
    return { kind: "raw_string", parsed: null, raw: String(value), displayText: String(value) };
  }
}

