/**
 * Hook for polling page generation status.
 * 
 * This is a convenience hook that uses the generic useStreamingStatus
 * with the page generation configuration.
 */
import { useStreamingStatus } from './useStreamingStatus';
import { pageGenerationConfig } from '../config/pageGeneration';
import type { GenerationStatus } from '../types/generation';

interface UsePageGenerationStatusOptions {
  generationId: string | null;
  enabled?: boolean;
}

/**
 * Hook to poll page generation status.
 * 
 * This is a wrapper around useStreamingStatus with page generation config.
 */
export const usePageGenerationStatus = ({
  generationId,
  enabled = true,
}: UsePageGenerationStatusOptions) => {
  return useStreamingStatus<GenerationStatus>({
    id: generationId,
    enabled,
    config: pageGenerationConfig,
  });
};

/**
 * Hook to get just the execution log from generation status.
 */
export const useExecutionLog = ({
  generationId,
  enabled = true,
}: UsePageGenerationStatusOptions) => {
  const { data, ...rest } = usePageGenerationStatus({ generationId, enabled });
  
  return {
    executionLog: data?.execution_log || [],
    currentNode: data?.current_node_display || data?.current_node || null,
    nodesCompleted: data?.nodes_completed || 0,
    elapsedSeconds: data?.elapsed_seconds || 0,
    status: data?.status || 'pending',
    ...rest
  };
};
