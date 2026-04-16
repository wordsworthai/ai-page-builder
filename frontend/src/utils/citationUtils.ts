/**
 * Citation processing utilities for chat responses.
 *
 * Supports two source types:
 *  - "document" (RAGFlow): doc_id, filename, page_numbers, positions
 *  - "web" (search): url, title, favicon
 *
 * RAGFlow returns citation refs like [ID:0], [ID:1] in the answer text,
 * plus a citations array. This module replaces the refs with markdown-style
 * links that the custom AnswerSection renderer turns into CitationChip components.
 */

export type CitationSourceType = 'document' | 'web';

export interface CitationItem {
  id: number;
  /** Common fields */
  content: string;
  source_type?: CitationSourceType;

  /** Document source fields (RAGFlow) */
  doc_id?: string;
  filename?: string;
  page_numbers?: number[];
  positions?: number[][];

  /** Web source fields (search) */
  url?: string;
  title?: string;
}

/** Derive the display label for a citation item. */
export function getCitationLabel(c: CitationItem): string {
  if (c.source_type === 'web' && c.title) return c.title;
  if (c.filename) return c.filename;
  return `Source ${c.id + 1}`;
}

/** Derive the short badge label for inline display. */
export function getCitationBadgeLabel(c: CitationItem): string {
  if (c.source_type === 'web' && c.url) {
    try {
      const host = new URL(c.url).hostname.replace(/^www\./, '');
      // Just the domain name without TLD for compact display
      const parts = host.split('.');
      return parts.length > 1 ? parts[parts.length - 2] : host;
    } catch {
      return c.title?.slice(0, 16) || `source`;
    }
  }
  if (c.filename) {
    const stem = c.filename.replace(/\.[^.]+$/, '');
    return stem.length > 18 ? stem.slice(0, 16) + '...' : stem;
  }
  return `${c.id + 1}`;
}

/** Get hostname from URL, or empty string. */
export function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/**
 * Strip citation markers from the answer text (for copy action).
 * Removes both `[ID:N]` (legacy RAGFlow) and `[N]` (inline) formats.
 */
export function stripCitationMarkers(content: string): string {
  if (!content) return '';
  return content
    .replace(/\s*\[ID:\d+\]/g, '')    // legacy [ID:N] markers
    .replace(/\s*\[\d+\]/g, '')        // inline [N] markers
    .trim();
}

/**
 * Deduplicate per-chunk citations into per-document citations.
 * Multiple chunks from the same document are merged into a single entry
 * with combined positions and page_numbers. Used for chip row and SourcesPanel.
 *
 * This is a no-op when citations are already per-document (backward compatible).
 */
export function deduplicateCitationsByDoc(citations: CitationItem[]): CitationItem[] {
  if (!citations || citations.length === 0) return [];

  const docMap = new Map<string, CitationItem>();

  for (const c of citations) {
    // Web sources or citations without doc_id pass through as-is
    const key = c.doc_id || `__no_doc_${c.id}`;

    if (!docMap.has(key)) {
      docMap.set(key, {
        ...c,
        // Clone arrays so we don't mutate the original
        positions: c.positions ? [...c.positions] : [],
        page_numbers: c.page_numbers ? [...c.page_numbers] : [],
      });
    } else {
      const existing = docMap.get(key)!;
      // Merge positions
      if (c.positions) {
        for (const pos of c.positions) {
          existing.positions!.push(pos);
        }
      }
      // Merge page_numbers (deduplicated)
      if (c.page_numbers) {
        for (const p of c.page_numbers) {
          if (!existing.page_numbers!.includes(p)) {
            existing.page_numbers!.push(p);
          }
        }
      }
    }
  }

  // Sort page_numbers and re-index
  const result = Array.from(docMap.values());
  for (let i = 0; i < result.length; i++) {
    result[i].id = i;
    result[i].page_numbers?.sort((a, b) => a - b);
  }
  return result;
}
