import { useState, useCallback, useRef } from 'react';
import type {
  LoadedSectionData,
  SectionLoadState,
  UseDynamicSectionLoaderReturn,
  UseDynamicSectionLoaderParams,
} from '../../SectionAddition.types';

/**
 * Hook for managing dynamic section loading state.
 * 
 * Will use API endpoints to fetch sections.
 * 
 * Features:
 * - Tracks loading state per section_id
 * - Caches loaded sections to avoid re-fetching
 * - Provides error handling and retry capability
 * - Supports API-based section loading
 */
export function useDynamicSectionLoader({
  apiBaseUrl,
  fetchSectionData: customFetchFn,
}: UseDynamicSectionLoaderParams = {}): UseDynamicSectionLoaderReturn {
  // State for tracking load states per section
  const [loadStates, setLoadStates] = useState<Map<string, SectionLoadState>>(new Map());
  
  // Cache for loaded section data
  const loadedSectionsRef = useRef<Map<string, LoadedSectionData>>(new Map());
    
  // In-flight requests to prevent duplicate fetches
  const pendingRequestsRef = useRef<Map<string, Promise<LoadedSectionData | null>>>(new Map());

  /**
   * Register a section that's already been loaded (e.g., from template data)
   */
  const registerLoadedSection = useCallback((sectionId: string, data: LoadedSectionData) => {
    loadedSectionsRef.current.set(sectionId, data);
    setLoadStates((prev) => {
      const next = new Map(prev);
      next.set(sectionId, { state: 'loaded', data });
      return next;
    });
  }, []);

  /**
   * Load a section by ID
   */
  const loadSection = useCallback(async (sectionId: string): Promise<LoadedSectionData | null> => {
    // Check if already loaded
    const cached = loadedSectionsRef.current.get(sectionId);
    if (cached) {
      return cached;
    }
    
    // Check if request is already in flight
    const pending = pendingRequestsRef.current.get(sectionId);
    if (pending) {
      return pending;
    }
    
    // Mark as loading
    setLoadStates((prev) => {
      const next = new Map(prev);
      next.set(sectionId, { state: 'loading' });
      return next;
    });
    
    // Create the fetch promise
    const fetchPromise = (async (): Promise<LoadedSectionData | null> => {
      try {
        const data = await customFetchFn(sectionId);
        
        // Cache the loaded data
        loadedSectionsRef.current.set(sectionId, data);
        
        // Update state
        setLoadStates((prev) => {
          const next = new Map(prev);
          next.set(sectionId, { state: 'loaded', data });
          return next;
        });
        
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        setLoadStates((prev) => {
          const next = new Map(prev);
          next.set(sectionId, { state: 'error', error: errorMessage });
          return next;
        });
        
        console.error(`[useDynamicSectionLoader] Failed to load section ${sectionId}:`, error);
        return null;
      } finally {
        // Remove from pending requests
        pendingRequestsRef.current.delete(sectionId);
      }
    })();
    
    // Store the pending request
    pendingRequestsRef.current.set(sectionId, fetchPromise);
    
    return fetchPromise;
  }, [customFetchFn]);

  /**
   * Check if a section is currently loading
   */
  const isLoading = useCallback((sectionId: string): boolean => {
    return loadStates.get(sectionId)?.state === 'loading';
  }, [loadStates]);

  /**
   * Check if a section has been loaded
   */
  const isLoaded = useCallback((sectionId: string): boolean => {
    return loadStates.get(sectionId)?.state === 'loaded';
  }, [loadStates]);

  /**
   * Get the loaded section data
   */
  const getLoadedSection = useCallback((sectionId: string): LoadedSectionData | undefined => {
    return loadedSectionsRef.current.get(sectionId);
  }, []);

  /**
   * Get the loading state for a section
   */
  const getLoadState = useCallback((sectionId: string): SectionLoadState | undefined => {
    return loadStates.get(sectionId);
  }, [loadStates]);

  /**
   * Get all loaded sections
   */
  const getAllLoadedSections = useCallback((): Map<string, LoadedSectionData> => {
    return new Map(loadedSectionsRef.current);
  }, []);

  /**
   * Clear a section from the cache (for retry)
   */
  const clearSection = useCallback((sectionId: string) => {
    loadedSectionsRef.current.delete(sectionId);
    setLoadStates((prev) => {
      const next = new Map(prev);
      next.delete(sectionId);
      return next;
    });
  }, []);

  /**
   * Clear all cached sections
   */
  const clearAllSections = useCallback(() => {
    loadedSectionsRef.current.clear();
    setLoadStates(new Map());
  }, []);

  return {
    loadSection,
    isLoading,
    isLoaded,
    getLoadedSection,
    getLoadState,
    getAllLoadedSections,
    clearSection,
    clearAllSections,
    registerLoadedSection,
  };
}

export default useDynamicSectionLoader;
