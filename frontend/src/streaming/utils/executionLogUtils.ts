/**
 * Utilities for processing execution log entries.
 * 
 * Handles deduplication, plain text extraction, and HTML output processing.
 */

import type { NodeExecutionEntry } from '../types';

/**
 * Deduped execution entry - combines parallel node instances.
 */
export interface DedupedExecutionEntry {
  node_name: string;
  display_name: string;
  status: string;
  output_summary: string | null;
  output_type: 'text' | 'html';
  completed_at: string | null;
  duration_ms: number | null;
  /** Number of parallel instances combined (1 for non-parallel) */
  instance_count: number;
}

/**
 * Deduplicate execution log entries.
 * 
 * Parallel nodes (e.g., section_retriever_smb with instance_id) are grouped together.
 * For parallel nodes, we combine their outputs.
 */
export function dedupeExecutionLog(log: NodeExecutionEntry[]): DedupedExecutionEntry[] {
  const deduped = new Map<string, DedupedExecutionEntry>();
  
  for (const entry of log) {
    // Extract base node name (strip instance_id suffix like "node:Template1")
    const colonIndex = entry.node_name.indexOf(':');
    const baseNodeName = colonIndex > 0 
      ? entry.node_name.substring(0, colonIndex) 
      : entry.node_name;
    
    const existing = deduped.get(baseNodeName);
    
    if (existing) {
      // Combine parallel instances
      existing.instance_count += 1;
      
      // Combine outputs if both have content
      if (entry.output_summary) {
        if (existing.output_summary) {
          // Append with separator for HTML, newline for text
          const separator = existing.output_type === 'html' ? '<hr style="margin: 12px 0; border: none; border-top: 1px solid #e5e7eb;" />' : '\n\n';
          existing.output_summary += separator + entry.output_summary;
        } else {
          existing.output_summary = entry.output_summary;
        }
      }
      
      // Use latest timestamp
      if (entry.completed_at && (!existing.completed_at || entry.completed_at > existing.completed_at)) {
        existing.completed_at = entry.completed_at;
      }
      
      // Sum durations
      if (entry.duration_ms) {
        existing.duration_ms = (existing.duration_ms || 0) + entry.duration_ms;
      }
    } else {
      // First instance of this node
      deduped.set(baseNodeName, {
        node_name: baseNodeName,
        display_name: entry.display_name.replace(/: .+$/, ''), // Remove instance suffix from display name
        status: entry.status,
        output_summary: entry.output_summary,
        output_type: (entry.output_type as 'text' | 'html') || 'text',
        completed_at: entry.completed_at,
        duration_ms: entry.duration_ms,
        instance_count: 1,
      });
    }
  }
  
  return Array.from(deduped.values());
}

/**
 * Get count of unique (deduped) nodes completed.
 */
export function getDedupedNodeCount(log: NodeExecutionEntry[]): number {
  return dedupeExecutionLog(log).length;
}

/**
 * True when output_summary is a raw backend state dict (e.g. ui_execution_log) not meant for display.
 */
export function isRawExecutionLogOutput(text: string | null | undefined): boolean {
  if (text == null || typeof text !== 'string') return false;
  const s = text.trim();
  return s.length > 0 && s.includes('ui_execution_log') && s.includes('node_name');
}

/**
 * Extract plain text from an execution entry's output.
 * 
 * Strips HTML tags for preview display.
 * Treats raw ui_execution_log dict strings as empty (no display).
 */
export function getPlainTextSummary(entry: DedupedExecutionEntry): string {
  if (!entry.output_summary) return '';
  if (isRawExecutionLogOutput(entry.output_summary)) return '';

  // For text type, return as-is
  if (entry.output_type === 'text') {
    return entry.output_summary.trim();
  }
  
  // For HTML type, strip tags
  const temp = document.createElement('div');
  temp.innerHTML = entry.output_summary;
  
  // Get text content and clean up whitespace
  let text = temp.textContent || temp.innerText || '';
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * Get the latest HTML output from the execution log.
 * 
 * Used by GeneratingIframeOverride (now removed, but kept for reference).
 */
export function getLatestHtmlOutput(log: DedupedExecutionEntry[]): string | null {
  // Find last entry with HTML output
  for (let i = log.length - 1; i >= 0; i--) {
    const entry = log[i];
    if (entry.output_summary && entry.output_type === 'html') {
      return entry.output_summary;
    }
  }
  return null;
}

/**
 * Check if an entry has displayable output.
 */
export function hasDisplayableOutput(entry: DedupedExecutionEntry): boolean {
  if (!entry.output_summary) return false;
  if (isRawExecutionLogOutput(entry.output_summary)) return false;
  const plainText = getPlainTextSummary(entry);
  return plainText.length > 0;
}
