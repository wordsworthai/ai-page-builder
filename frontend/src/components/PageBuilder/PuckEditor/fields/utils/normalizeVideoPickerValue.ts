type VideoPickerMedia = {
  alt?: string;
  sources?: Array<{ url: string; mime_type?: string }>;
  video?: {
    sources?: Array<{ url: string; mime_type?: string }>;
    alt?: string;
  };
  [key: string]: any;
};

type VideoPickerValue = {
  resolved_url?: string;
  media?: VideoPickerMedia;
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

export function normalizeVideoPickerValue(value: unknown): { sourceUrl: string; altText: string } {
  const v = tryParseJson(value) as VideoPickerValue | unknown;
  const obj = v && typeof v === "object" ? (v as VideoPickerValue) : undefined;

  // Extract source URL from media.sources[0].url (video source), media.video.sources[0].url, or fallback to resolved_url (preview image)
  let sourceUrl = "";
  if (obj?.media?.sources && Array.isArray(obj.media.sources) && obj.media.sources.length > 0) {
    sourceUrl = obj.media.sources[0].url || "";
  } else if (obj?.media?.video?.sources && Array.isArray(obj.media.video.sources) && obj.media.video.sources.length > 0) {
    sourceUrl = obj.media.video.sources[0].url || "";
  } else if (obj?.resolved_url) {
    sourceUrl = obj.resolved_url;
  }

  // Extract alt text from media.alt or media.video.alt
  const altText = (obj?.media?.alt ?? obj?.media?.video?.alt ?? "") as string;

  return { sourceUrl, altText };
}
