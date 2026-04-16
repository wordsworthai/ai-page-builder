import { useState, useEffect, useCallback, useRef } from 'react';
import { useGenerationEventContext } from '../../contexts/GenerationEventContext';

/**
 * Iframe content types:
 * - 'generating': Show generation progress animation
 * - 'loading': Show loading screen while fetching partial template
 * - 'partial': Show partial template preview (when certain nodes complete)
 * - 'final': Show final template preview (when generation completes)
 */
export type IframeContentType = 'generating' | 'loading' | 'partial' | 'final';

interface UseIframeContentReturn {
  contentType: IframeContentType;
  setContentType: (type: IframeContentType) => void;
  /** True if we went directly to 'final' without going through 'generating' or 'partial' */
  isDirectLoad: boolean;
  /** Manual setter for isDirectLoad - allows programmatic control (e.g., when switching to preview mode) */
  setIsDirectLoad: (value: boolean) => void;
}

/**
 * Hook to manage iframe content type - completely decoupled from editor state.
 * 
 * Listens to generation events only:
 * - Sets to 'generating' on GENERATION_STARTED or UPDATE_STARTED
 * - Sets to 'loading' on PARTIAL_TEMPLATE_LOADING_STARTED
 * - Sets to 'partial' on PARTIAL_TEMPLATE_LOADED
 * - Sets to 'final' on FINAL_TEMPLATE_LOADED
 * 
 * This allows the iframe to transition independently based on events, not state.
 */
export function useIframeContent(): UseIframeContentReturn {
  const [contentType, setContentTypeState] = useState<IframeContentType>('generating');
  const { subscribe } = useGenerationEventContext();
  
  // Track if we've ever been in an active generation state (not just initial 'generating')
  // This is set to true when we receive GENERATION_STARTED or go through partial state
  const hasBeenInActiveGenerationRef = useRef(false);
  
  // Track if this is a direct load (final without active generation)
  const [isDirectLoad, setIsDirectLoad] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      switch (event.type) {
        case 'GENERATION_STARTED':
        case 'UPDATE_STARTED':
          // Mark that we're in active generation
          hasBeenInActiveGenerationRef.current = true;
          setContentTypeState('generating');
          break;

        case 'PARTIAL_TEMPLATE_LOADING_STARTED':
          hasBeenInActiveGenerationRef.current = true;
          setContentTypeState('loading');
          break;

        case 'PARTIAL_TEMPLATE_LOADED':
          hasBeenInActiveGenerationRef.current = true;
          setContentTypeState('partial');
          break;

        case 'FINAL_TEMPLATE_LOADED':
          // Direct load (no GENERATION_STARTED): isDirectLoad=true so we do not show crafting animation.
          // Active generation (navigate back during generation): isDirectLoad=false so blur+content moment shows.
          setIsDirectLoad(!hasBeenInActiveGenerationRef.current);
          setContentTypeState('final');
          break;

        case 'GENERATION_FAILED':
          // Revert to final so overlay fades out (e.g. partial regen failed, show parent template)
          setContentTypeState('final');
          break;

        // Don't change on other events
        default:
          break;
      }
    });

    return unsubscribe;
  }, [subscribe]);

  // Manual setter for edge cases or programmatic control
  const setContentType = useCallback((type: IframeContentType) => {
    setContentTypeState(type);
  }, []);

  // Manual setter for isDirectLoad - allows programmatic control
  // When a new generation starts (GENERATION_STARTED event), the state will be reset automatically
  const setIsDirectLoadManual = useCallback((value: boolean) => {
    setIsDirectLoad(value);
  }, []);

  return {
    contentType,
    setContentType,
    isDirectLoad,
    setIsDirectLoad: setIsDirectLoadManual,
  };
}
