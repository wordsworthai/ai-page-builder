import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGenerationEventContext } from '../../contexts/GenerationEventContext';
import { useEditorDataProvider } from '../../utils/hooks/editorDataProvider';
import { useSnackBarContext } from '@/context/SnackBarContext';
import type { EditorState } from './useEditorStateMachine';
import type { GenerationStatus } from '@/streaming/types/generation';
import {
  shouldLoadIntermediateTemplate,
  shouldLoadFinalTemplate,
} from './useGenerationEventEmitter';

// Template loading configuration constants
const DEFAULT_STORE_URL = 'https://www.shopify.com';
const DEFAULT_TEMPLATE_JSON_TYPE = 'real_population';

const INTERMEDIATE_TEMPLATE_JSON_TYPE = 'ipsum_lorem';

interface UseGenerationTemplateLoaderParams {
  editorState: EditorState;
  generationVersionId: string;
  updateTemplateData: (updates: { config: any; currentData: any }, source?: string) => void;
  generationStatus?: GenerationStatus | null;
  /** Pending generation ID (in case of generation on top of existing template)
  * Skip loading templates for this ID */
  updateTemplateGenerationVersionId?: string | null;
}

/**
 * Hook to load templates based on generation events.
 * 
 * Listens to generation events and loads templates accordingly:
 * - Loads final template when GENERATION_COMPLETED event fires
 * - Loads intermediate template when TEMPLATE_SELECTED_POPULATION_PENDING event fires (only during active generation)
 * - Emits template loaded events (FINAL_TEMPLATE_LOADED, PARTIAL_TEMPLATE_LOADED)
 * - Handles errors with snackbar notifications
 * 
 * This hook is event-driven and decouples template loading from state management.
 */
export function useGenerationTemplateLoader({
  editorState,
  generationVersionId,
  updateTemplateData,
  generationStatus,
  updateTemplateGenerationVersionId,
}: UseGenerationTemplateLoaderParams) {
  const { subscribe, emit } = useGenerationEventContext();
  const { fetchTemplateData } = useEditorDataProvider();
  const { createSnackBar } = useSnackBarContext();
  const queryClient = useQueryClient();

  const loadFinalTemplate = useCallback(
    async (generationId: string) => {
      try {
        const { config, data } = await fetchTemplateData(
          generationId,
          DEFAULT_STORE_URL,
          DEFAULT_TEMPLATE_JSON_TYPE
        );

        updateTemplateData({ config, currentData: data }, 'loadFinalTemplate');

        // Emit event that template is loaded
        emit({ type: 'FINAL_TEMPLATE_LOADED', generationId });
        queryClient.invalidateQueries({ queryKey: ['website-pages'] });
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to load final template');
        console.error('Error loading final template:', err);
        const msg = (err.message || '').toLowerCase();
        const anyErr = error as { status?: number; body?: { status?: number } };
        const isNotReady =
          /status:\s*(404|500)/i.test(err.message || '') ||
          msg.includes('500') ||
          msg.includes('404') ||
          msg.includes('internal server error') ||
          anyErr?.status === 404 ||
          anyErr?.status === 500 ||
          anyErr?.body?.status === 404 ||
          anyErr?.body?.status === 500;
        if (!isNotReady) {
          createSnackBar({
            content: 'Failed to load template. It may still be generating.',
            severity: 'error',
            autoHide: true,
          });
        }
        throw err;
      }
    },
    [fetchTemplateData, updateTemplateData, emit, createSnackBar, queryClient]
  );

  const loadIntermediateTemplate = useCallback(
    async (generationId: string) => {
      // Emit loading event immediately when API call starts
      // emit({ type: 'PARTIAL_TEMPLATE_LOADING_STARTED', generationId });
      
      try {
        console.log(`📦 Loading intermediate template (ipsum_lorem) for generation ${generationId}`);
        const { config, data } = await fetchTemplateData(
          generationId,
          DEFAULT_STORE_URL,
          INTERMEDIATE_TEMPLATE_JSON_TYPE
        );

        updateTemplateData({ config, currentData: data }, 'loadIntermediateTemplate');

        // Emit event that intermediate/partial template is loaded
        emit({ type: 'PARTIAL_TEMPLATE_LOADED', generationId });
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to load intermediate template');
        console.error('Error loading intermediate template:', err);
        // Don't block on intermediate template errors, just log
        console.warn('Intermediate template load failed, continuing...');
      }
    },
    [fetchTemplateData, updateTemplateData, emit]
  );

  // Track if we've already loaded the template for this generation
  const loadedGenerationIdRef = useRef<string | null>(null);

  // Track processed intermediate template loads (TEMPLATE_SELECTED_POPULATION_PENDING events) to avoid duplicate loads
  const processedIntermediateTemplateLoadRef = useRef<Set<string>>(new Set());
  
  // Store latest callbacks in refs to avoid re-subscribing when they change
  const loadFinalTemplateRef = useRef(loadFinalTemplate);
  const loadIntermediateTemplateRef = useRef(loadIntermediateTemplate);
  const editorStateRef = useRef(editorState);
  const updateTemplateGenerationVersionIdRef = useRef(updateTemplateGenerationVersionId);
  
  // Update refs when callbacks change
  useEffect(() => {
    loadFinalTemplateRef.current = loadFinalTemplate;
    loadIntermediateTemplateRef.current = loadIntermediateTemplate;
    editorStateRef.current = editorState;
    updateTemplateGenerationVersionIdRef.current = updateTemplateGenerationVersionId;
  }, [loadFinalTemplate, loadIntermediateTemplate, editorState, updateTemplateGenerationVersionId]);

  // State-first check: On mount/status change, check state directly using utilities
  // This handles race conditions where events fire before subscription
  useEffect(() => {
    // Skip template loading ONLY if we're viewing the partial generation ID itself
    // If we're viewing the base generation ID (while partial generation is running),
    // we should still load the base generation's template
    if (updateTemplateGenerationVersionId && updateTemplateGenerationVersionId === generationVersionId) {
      return;
    }
    
    if (!generationStatus || !generationVersionId) return;
    
    // Never attempt to load templates if generation has failed
    if (generationStatus.status === 'failed') {
      return;
    }
    
    // Check if intermediate template should be loaded (state-first)
    if (
      editorState === 'generating' &&
      shouldLoadIntermediateTemplate(
        generationStatus,
        generationVersionId,
        processedIntermediateTemplateLoadRef.current
      )
    ) {
      processedIntermediateTemplateLoadRef.current.add(generationVersionId);
      loadIntermediateTemplateRef.current(generationVersionId).catch((error) => {
        console.error('Failed to load intermediate template (state-first):', error);
        // Remove from processed set on error so we can retry
        processedIntermediateTemplateLoadRef.current.delete(generationVersionId);
      });
    }
    
    // Check if final template should be loaded (state-first)
    if (
      (editorState === 'generating' || editorState === 'loading') &&
      shouldLoadFinalTemplate(
        generationStatus,
        generationVersionId,
        loadedGenerationIdRef.current
      )
    ) {
      loadedGenerationIdRef.current = generationVersionId;
      loadFinalTemplateRef.current(generationVersionId).catch((error) => {
        console.error('Failed to load final template (state-first):', error);
        // Reset on error so we can retry
        if (loadedGenerationIdRef.current === generationVersionId) {
          loadedGenerationIdRef.current = null;
        }
      });
    }
  }, [generationStatus, generationVersionId, editorState, updateTemplateGenerationVersionId]);


  // Event subscription: Handle real-time updates (secondary to state checks)
  // By this time, the component has already loaded, so events handle everything.
  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      // Skip template loading ONLY if the event is for the partial generation ID we're viewing
      // If we're viewing the base generation ID, we should still load its template
      // Extract generation ID based on event type (UPDATE_STARTED uses newGenerationId)
      const eventGenerationId = 
        event.type === 'UPDATE_STARTED' ? event.newGenerationId :
        'generationId' in event ? event.generationId : null;
      
      if (updateTemplateGenerationVersionIdRef.current && 
          eventGenerationId === updateTemplateGenerationVersionIdRef.current) {
        return;
      }
      
      switch (event.type) {
        case 'GENERATION_COMPLETED':
          // Load final template when generation completes (real-time update)
          // Only load if we haven't already loaded it for this generation
          // Skip if generation status is failed (defensive check)
          if (
            (editorStateRef.current === 'generating' || editorStateRef.current === 'loading') &&
            loadedGenerationIdRef.current !== event.generationId &&
            generationStatus?.status !== 'failed'
          ) {
            loadedGenerationIdRef.current = event.generationId;
            loadFinalTemplateRef.current(event.generationId).catch((error) => {
              console.error('Failed to load template (event-driven):', error);
              // Reset on error so we can retry
              if (loadedGenerationIdRef.current === event.generationId) {
                loadedGenerationIdRef.current = null;
              }
            });
          }
          break;

        case 'TEMPLATE_SELECTED_POPULATION_PENDING':
          // Load intermediate template when event fires (real-time update)
          // Only load if we haven't already processed it
          if (!processedIntermediateTemplateLoadRef.current.has(event.generationId)) {
            processedIntermediateTemplateLoadRef.current.add(event.generationId);
            loadIntermediateTemplateRef.current(event.generationId).catch((error) => {
              console.error('Failed to load intermediate template (event-driven):', error);
              // Remove from processed set on error so we can retry
              processedIntermediateTemplateLoadRef.current.delete(event.generationId);
            });
          }
          break;

        // UPDATE_COMPLETED will be handled in future phases
        default:
          break;
      }
    });

    return unsubscribe;
  }, [subscribe]);

  return {
    loadFinalTemplate,
    loadIntermediateTemplate,
  };
}