/**
 * Configuration for page generation streaming.
 */

import { PageGenerationService } from '@/client';
import type { GenerationStatus } from '../types/generation';
import type { StreamingConfig } from '../types';
import type { GenerationStatusResponse } from '@/client/models/GenerationStatusResponse';
import type { NodeExecutionEntry } from '../types';

/**
 * Transform API response to GenerationStatus.
 */
function transformResponse(response: GenerationStatusResponse): GenerationStatus {
  return {
    id: response.generation_version_id,
    generation_version_id: response.generation_version_id,
    status: response.status,
    
    // Timing
    started_at: response.started_at || null,
    elapsed_seconds: response.elapsed_seconds || 0,
    
    // Current state
    current_node: response.current_node || null,
    current_node_display: response.current_node_display || null,
    nodes_completed: response.nodes_completed || 0,
    
    // Execution log
    execution_log: Array.isArray(response.execution_log) 
      ? response.execution_log.map((entry: any): NodeExecutionEntry => ({
          node_name: entry.node_name || '',
          display_name: entry.display_name || entry.node_name || '',
          status: entry.status || 'completed',
          output_summary: entry.output_summary || null,
          output_type: entry.output_type || 'text',
          started_at: entry.started_at || null,
          completed_at: entry.completed_at || null,
          duration_ms: entry.duration_ms || null,
        }))
      : [],
    
    // Result
    preview_link: response.preview_link || null,
    error_message: response.error_message || null,
    
    // Legacy fields
    progress: response.progress || 0,
    dev_task_id: response.dev_task_id || null,
    query_hash: response.query_hash || null,
    created_at: response.created_at || null,
    completed_at: response.completed_at || null,
  };
}

/**
 * Page generation streaming configuration.
 */
export const pageGenerationConfig: StreamingConfig<GenerationStatus, GenerationStatusResponse> = {
  fetchStatus: (id: string) => 
    PageGenerationService.getGenerationStatusApiGenerationsGenerationVersionIdStatusGet(id),
  
  transformResponse,
  
  pollingInterval: 2000,
  
  shouldStopPolling: (status: GenerationStatus) => 
    status.status === 'completed' || status.status === 'failed',
};
