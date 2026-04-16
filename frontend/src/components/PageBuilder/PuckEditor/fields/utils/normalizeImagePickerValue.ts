type ImagePickerMedia = {
  alt?: string;
  src?: string;
  [key: string]: any;
};

type ImagePickerValue = {
  resolved_url?: string;
  media?: ImagePickerMedia;
  [key: string]: any;
};

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

export function normalizeImagePickerValue(value: unknown): { sourceUrl: string; altText: string } {
  const v = tryParseJson(value) as ImagePickerValue | unknown;
  const obj = v && typeof v === "object" ? (v as ImagePickerValue) : undefined;

  const sourceUrl = (obj?.resolved_url ?? obj?.media?.src ?? "") as string;
  const altText = (obj?.media?.alt ?? "") as string;

  return { sourceUrl, altText };
}

