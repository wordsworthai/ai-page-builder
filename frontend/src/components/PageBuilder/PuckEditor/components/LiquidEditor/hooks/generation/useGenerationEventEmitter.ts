import { useEffect, useRef } from 'react';
import { useGenerationEventContext } from '../../contexts/GenerationEventContext';
import type { GenerationStatus } from '@/streaming/types/generation';

// Node name constants
const AUTOPOP_START_NODE_NAME = 'autopop_start';

/**
 * Utility function to check if intermediate template should be loaded.
 * 
 * Returns true if:
 * - Generation status is 'processing'
 * - autopop_start node is completed
 * - Generation ID is not already in the processed set
 */
export function shouldLoadIntermediateTemplate(
  generationStatus: GenerationStatus | null | undefined,
  generationId: string,
  processedSet: Set<string>
): boolean {
  if (!generationStatus) return false;
  
  // Only check during active generation
  if (generationStatus.status !== 'processing') return false;
  
  // Need execution log to check node status
  if (!generationStatus.execution_log) return false;
  
  // Check if already processed
  if (processedSet.has(generationId)) return false;
  
  // Find autopop_start node that is completed
  const autopopStartNode = generationStatus.execution_log.find(
    (node) => node.node_name === AUTOPOP_START_NODE_NAME && node.status === 'completed'
  );
  
  return !!autopopStartNode;
}

/**
 * Utility function to check if final template should be loaded.
 * 
 * Returns true if:
 * - Generation status is 'completed'
 * - Generation ID is not already loaded
 */
export function shouldLoadFinalTemplate(
  generationStatus: GenerationStatus | null | undefined,
  generationId: string,
  loadedGenerationId: string | null
): boolean {
  if (!generationStatus) return false;
  
  // Only check if generation is completed
  if (generationStatus.status !== 'completed') return false;
  
  // Check if already loaded
  if (loadedGenerationId === generationId) return false;
  
  return true;
}

/**
 * Hook to convert generation status changes into discrete events
 * 
 * Watches generation status and emits events when changes occur:
 * - GENERATION_STARTED: When generation begins
 * - TEMPLATE_SELECTED_POPULATION_PENDING: When autopop_start node completes during active generation (triggers intermediate template load)
 * - GENERATION_COMPLETED: When generation finishes
 * - GENERATION_FAILED: When generation fails
 */
export function useGenerationEventEmitter(generationStatus: GenerationStatus | undefined) {
  const { emit } = useGenerationEventContext();
  const prevStatusRef = useRef<GenerationStatus | undefined>();
  const processedNodesRef = useRef<Set<string>>(new Set());
  const processedAutopopStartRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!generationStatus) return;

    const prevStatus = prevStatusRef.current;
    const generationId = generationStatus.generation_version_id;

    // Emit GENERATION_STARTED whenever we transition INTO processing.
    //
    // Important for retry: status can go failed -> processing, and the UI must
    // re-enter generating mode and resume progress updates.
    if (generationStatus.status === 'processing' && prevStatus?.status !== 'processing') {
      emit({ type: 'GENERATION_STARTED', generationId });
    }

    // Emit GENERATION_COMPLETED when status changes to completed
    // OR if this is the first time we see a completed status (already completed case)
    if (
      (prevStatus?.status !== 'completed' && generationStatus.status === 'completed') ||
      (!prevStatus && generationStatus.status === 'completed')
    ) {
      emit({ type: 'GENERATION_COMPLETED', generationId });
    }

    // Emit GENERATION_FAILED when status changes to failed
    if (prevStatus?.status !== 'failed' && generationStatus.status === 'failed') {
      emit({
        type: 'GENERATION_FAILED',
        generationId,
        error: generationStatus.error_message || 'Generation failed',
      });
    }

    // Emit TEMPLATE_SELECTED_POPULATION_PENDING when autopop_start node completes
    // Only emit if generation is still in progress (processing status)
    // Use utility function to check if intermediate template should be loaded
    // Convert processedAutopopStartRef to a Set of generationIds for the utility
    const processedGenerationIds = new Set<string>();
    processedAutopopStartRef.current.forEach((key) => {
      // Keys are in format: `${generationId}-${AUTOPOP_START_NODE_NAME}`
      const genId = key.replace(`-${AUTOPOP_START_NODE_NAME}`, '');
      processedGenerationIds.add(genId);
    });
    
    if (shouldLoadIntermediateTemplate(generationStatus, generationId, processedGenerationIds)) {
      const autopopKey = `${generationId}-${AUTOPOP_START_NODE_NAME}`;
      processedAutopopStartRef.current.add(autopopKey);
      
      // Also track in processedNodesRef for consistency
      const nodeKey = `${generationId}-${AUTOPOP_START_NODE_NAME}`;
      processedNodesRef.current.add(nodeKey);
      
      emit({
        type: 'TEMPLATE_SELECTED_POPULATION_PENDING',
        generationId,
      });
    }

    // Update previous status
    prevStatusRef.current = generationStatus;
  }, [generationStatus, emit]);
}
