/**
 * Types for generation performance metrics (matches backend app/schemas/generation.py).
 * Used by GET /api/generations/metrics and GET /api/generations/{id}/metrics.
 */

export interface MinMaxSumCount {
  min?: number | null;
  max?: number | null;
  sum?: number | null;
  count: number;
}

export interface DurationStats {
  min?: number | null;
  max?: number | null;
  p50?: number | null;
  p95?: number | null;
  count: number;
}

export interface NodeDeliveryAttempt {
  node_name: string;
  status: string; // "success" | "failed"
  attempted_at?: string | null;
  duration_ms?: number | null;
  error_type?: string | null;
}

export interface NodeReceivedEntry {
  node_name: string;
  payload_bytes: number;
  redis_write_ms: number;
  received_at?: string | null;
}

export interface NodeUpdatesMetrics {
  attempted?: number | null;
  failed?: number | null;
  failed_reasons?: Record<string, number> | null;
  received: number;
  payload_bytes?: MinMaxSumCount | null;
  redis_write_duration_ms?: DurationStats | null;
  node_delivery_attempts?: NodeDeliveryAttempt[] | null;
  nodes_received?: NodeReceivedEntry[] | null;
}

export interface StatusPollsMetrics {
  count: number;
  response_bytes?: MinMaxSumCount | null;
  redis_read_duration_ms?: DurationStats | null;
  poll_timestamps?: string[] | null;
}

export interface GenerationPerformanceMetrics {
  generation_version_id: string;
  status: string;
  recorded_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  duration_seconds?: number | null;
  node_updates?: NodeUpdatesMetrics | null;
  status_polls?: StatusPollsMetrics | null;
  execution_log_length?: number | null;
  business_id?: string | null;
}
