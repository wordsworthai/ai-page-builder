/**
 * Hooks for generation performance metrics.
 * GET /api/generations/metrics (list) and GET /api/generations/{id}/metrics (single).
 */
import { useQuery } from '@tanstack/react-query';
import { OpenAPI } from '@/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import type { GenerationPerformanceMetrics } from '@/types/generationMetrics';

async function fetchList(limit: number): Promise<GenerationPerformanceMetrics[]> {
  const url = `${OpenAPI.BASE}/api/generations/metrics?limit=${limit}`;
  const res = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const err: any = new Error(res.statusText || 'Failed to fetch metrics list');
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function fetchOne(generationVersionId: string): Promise<GenerationPerformanceMetrics> {
  const url = `${OpenAPI.BASE}/api/generations/${generationVersionId}/metrics`;
  const res = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const err: any = new Error(res.statusText || 'Failed to fetch metrics');
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * List recent performance metrics for the current user's business.
 * Returns 404 when RECORD_PERFORMANCE_METRICS is disabled.
 */
export function useGenerationMetricsList(limit: number = 50, enabled: boolean = true) {
  const { handleApiError } = useErrorHandler();
  return useQuery({
    queryKey: ['generation-metrics-list', limit],
    queryFn: async () => {
      try {
        return await fetchList(limit);
      } catch (error: any) {
        handleApiError(error);
        throw error;
      }
    },
    enabled,
    staleTime: 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Get performance metrics for a single generation.
 * Enabled only when generationVersionId is non-empty. 404 if metrics disabled or not found.
 */
export function useGenerationMetrics(generationVersionId: string | null, enabled: boolean = true) {
  const { handleApiError } = useErrorHandler();
  const shouldRun = Boolean(enabled && generationVersionId);
  return useQuery({
    queryKey: ['generation-metrics', generationVersionId],
    queryFn: async () => {
      try {
        return await fetchOne(generationVersionId!);
      } catch (error: any) {
        handleApiError(error);
        throw error;
      }
    },
    enabled: shouldRun,
    staleTime: 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 2;
    },
  });
}
