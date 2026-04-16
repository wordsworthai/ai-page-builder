/**
 * Normalize color picker values to a consistent hex format.
 * Handles hex strings (with/without #), rgb/rgba(), "transparent", JSON strings, and edge cases.
 */

function tryParseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

/**
 * Normalize a hex color string to always include # prefix and lowercase.
 * @param color - Color string (with or without #)
 * @returns Normalized hex color string with # prefix, or empty string if invalid
 */
function normalizeHexColor(color: string): string {
  const trimmed = color.trim();
  if (!trimmed) return "";
  
  // Remove # if present
  const hex = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  
  // Validate hex format (3 or 6 characters, only hex digits)
  if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(hex)) {
    return "";
  }
  
  // Normalize to lowercase with # prefix
  return `#${hex.toLowerCase()}`;
}

const CLAMP = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

interface RgbParse {
  r: number;
  g: number;
  b: number;
  a?: number;
}

/**
 * Parse rgb(r,g,b) or rgba(r,g,b,a). Alpha 0-1 or 0-100 (treated as %).
 * @returns Parsed values or null if invalid
 */
function parseRgbRgba(s: string): RgbParse | null {
  const trimmed = s.trim();
  const rgbMatch = trimmed.match(
    /^rgb\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)$/i
  );
  if (rgbMatch) {
    const r = CLAMP(parseInt(rgbMatch[1], 10), 0, 255);
    const g = CLAMP(parseInt(rgbMatch[2], 10), 0, 255);
    const b = CLAMP(parseInt(rgbMatch[3], 10), 0, 255);
    return { r, g, b };
  }
  const rgbaMatch = trimmed.match(
    /^rgba\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*([\d.]+)%?\s*\)$/i
  );
  if (rgbaMatch) {
    const r = CLAMP(parseInt(rgbaMatch[1], 10), 0, 255);
    const g = CLAMP(parseInt(rgbaMatch[2], 10), 0, 255);
    const b = CLAMP(parseInt(rgbaMatch[3], 10), 0, 255);
    const aStr = rgbaMatch[4].replace(/%$/, "");
    let a = parseFloat(aStr);
    if (a > 1) a = a / 100;
    a = CLAMP(a, 0, 1);
    return { r, g, b, a };
  }
  return null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")
    .toLowerCase()}`;
}

/**
 * Convert rgb/rgba string to normalized hex or "transparent".
 * @returns Hex (e.g. "#ff0000"), "transparent", or empty string if invalid
 */
function normalizeRgbRgba(s: string): string {
  const parsed = parseRgbRgba(s);
  if (!parsed) return "";
  const { r, g, b, a } = parsed;
  if (a !== undefined && a === 0) return "transparent";
  return rgbToHex(r, g, b);
}

/**
 * Extract and normalize color value from various formats.
 * @param value - Color value (string, object, or JSON string)
 * @returns Normalized hex color string (e.g., "#ff0000") or empty string
 */
export function normalizeColorPickerValue(value: unknown): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return "";
  }

  // Try parsing JSON if it's a string
  const parsed = tryParseJson(value);
  
  // If it's already a string (not JSON object), treat as transparent, rgb/rgba, or hex
  if (typeof parsed === "string") {
    const trimmed = (parsed as string).trim();
    if (trimmed.toLowerCase() === "transparent") {
      return "transparent";
    }
    const rgbOut = normalizeRgbRgba(trimmed);
    if (rgbOut) return rgbOut;
    return normalizeHexColor(parsed as string);
  }
  
  // If it's an object, check for common color properties
  if (typeof parsed === "object" && parsed !== null) {
    const obj = parsed as Record<string, unknown>;
    
    // Check for hex property
    if (typeof obj.hex === "string") {
      return normalizeHexColor(obj.hex);
    }
    
    // Check for color property
    if (typeof obj.color === "string") {
      const c = (obj.color as string).trim();
      if (c.toLowerCase() === "transparent") return "transparent";
      const rgb = normalizeRgbRgba(c);
      if (rgb) return rgb;
      return normalizeHexColor(obj.color);
    }
    
    // Check for value property
    if (typeof obj.value === "string") {
      const v = (obj.value as string).trim();
      if (v.toLowerCase() === "transparent") return "transparent";
      const rgb = normalizeRgbRgba(v);
      if (rgb) return rgb;
      return normalizeHexColor(obj.value);
    }

    // Check for rgb/rgba object { r, g, b, a? }
    const r = typeof obj.r === "number" ? obj.r : null;
    const g = typeof obj.g === "number" ? obj.g : null;
    const b = typeof obj.b === "number" ? obj.b : null;
    if (r != null && g != null && b != null) {
      const ri = CLAMP(Math.round(r), 0, 255);
      const gi = CLAMP(Math.round(g), 0, 255);
      const bi = CLAMP(Math.round(b), 0, 255);
      const a = typeof obj.a === "number" ? CLAMP(obj.a > 1 ? obj.a / 100 : obj.a, 0, 1) : undefined;
      if (a !== undefined && a === 0) return "transparent";
      return rgbToHex(ri, gi, bi);
    }
  }
  
  // If we can't parse it, return empty string
  return "";
}
