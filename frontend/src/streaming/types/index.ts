/**
 * Core streaming types for AI generation features.
 * 
 * Generic types that can be used across different generation types.
 */

/**
 * Status of a streaming generation process
 */
export type StreamingStatusType = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Single node execution entry from the backend execution log.
 */
export interface NodeExecutionEntry {
  /** Internal node identifier (e.g., 'campaign_intent_synthesizer') */
  node_name: string;
  /** Human-readable name (e.g., 'Understanding your business') */
  display_name: string;
  /** Node status: 'completed' | 'failed' */
  status: string;
  /** Formatted output for UI display (if show_output=true) */
  output_summary: string | null;
  /** Output format: 'text' or 'html' */
  output_type?: 'text' | 'html';
  /** ISO timestamp when node started */
  started_at: string | null;
  /** ISO timestamp when node completed */
  completed_at: string | null;
  /** Node execution duration in milliseconds */
  duration_ms: number | null;
}

/**
 * Generic streaming status interface.
 * 
 * This is the base interface that all generation types should implement.
 */
export interface StreamingStatus {
  /** Unique identifier for this generation */
  id: string;
  /** Current status of the generation */
  status: StreamingStatusType;
  
  // Timing
  started_at: string | null;
  elapsed_seconds: number;
  
  // Current state
  current_node: string | null;
  current_node_display: string | null;
  nodes_completed: number;
  
  // Execution log (flat list of completed nodes)
  execution_log: NodeExecutionEntry[];
  
  // Result
  error_message: string | null;
}

/**
 * Configuration for streaming status polling.
 * 
 * This allows different generation types to configure their own
 * API fetch and transform functions.
 */
export interface StreamingConfig<TStatus extends StreamingStatus, TApiResponse = any> {
  /** Function to fetch status from API */
  fetchStatus: (id: string) => Promise<TApiResponse>;
  
  /** Function to transform API response to StreamingStatus */
  transformResponse: (response: TApiResponse) => TStatus;
  
  /** Polling interval in milliseconds (default: 2000) */
  pollingInterval?: number;
  
  /** Function to determine if polling should stop */
  shouldStopPolling: (status: TStatus) => boolean;
}
