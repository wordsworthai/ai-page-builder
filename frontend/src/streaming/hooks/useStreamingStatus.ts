/**
 * Generic hook for polling streaming status.
 * 
 * This hook abstracts the polling logic and can be used with any generation type
 * by providing a StreamingConfig.
 */
import { useQuery } from '@tanstack/react-query';
import type { StreamingStatus, StreamingConfig } from '../types';

interface UseStreamingStatusOptions {
  /** Unique identifier for the generation (e.g., generation_version_id) */
  id: string | null;
  /** Whether polling is enabled */
  enabled?: boolean;
  /** Configuration for this streaming type */
  config: StreamingConfig<StreamingStatus>;
}

/**
 * Generic hook to poll streaming status.
 * 
 * @param options - Configuration options including id, enabled flag, and streaming config
 * @returns React Query result with streaming status data
 */
export function useStreamingStatus<TStatus extends StreamingStatus>({
  id,
  enabled = true,
  config,
}: UseStreamingStatusOptions): ReturnType<typeof useQuery<TStatus>> {
  const {
    fetchStatus,
    transformResponse,
    pollingInterval = 2000,
    shouldStopPolling,
  } = config;

  return useQuery<TStatus>({
    queryKey: ['streaming-status', id],
    
    queryFn: async () => {
      if (!id) {
        throw new Error('Streaming ID is required');
      }
      
      const response = await fetchStatus(id);
      return transformResponse(response);
    },
    
    enabled: enabled && !!id,
    
    // Poll at configured interval
    refetchInterval: (query) => {
      // Stop polling if there's an error (e.g., invalid generation ID)
      if (query.state.error) {
        return false;
      }
      
      const data = query.state.data;
      if (!data) return pollingInterval;
      
      // Stop polling if shouldStopPolling returns true
      if (shouldStopPolling(data)) {
        return false;
      }
      
      return pollingInterval;
    },
    
    retry: false,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    
    staleTime: (query) => {
      const status = query.state.data?.status;
      // Cache completed/failed status longer
      if (status === 'completed' || status === 'failed') {
        return 60000;
      }
      return 0;
    }
  });
}
