import React, { createContext, useContext, useCallback, useRef, useMemo } from 'react';

/**
 * Generation events that can be emitted and listened to
 */
export type GenerationEvent =
  | { type: 'CLEAR_PUCK_SELECTION' }
  | { type: 'GENERATION_STARTED'; generationId: string }
  | { type: 'TEMPLATE_SELECTED_POPULATION_PENDING'; generationId: string }
  | { type: 'GENERATION_COMPLETED'; generationId: string }
  | { type: 'GENERATION_FAILED'; generationId: string; error: string }
  | { type: 'UPDATE_STARTED'; newGenerationId: string; currentGenerationId: string }
  | { type: 'UPDATE_COMPLETED'; newGenerationId: string }
  | { type: 'PARTIAL_TEMPLATE_LOADING_STARTED'; generationId: string }
  | { type: 'PARTIAL_TEMPLATE_LOADED'; generationId: string }
  | { type: 'FINAL_TEMPLATE_LOADED'; generationId: string };

interface GenerationEventContextValue {
  emit: (event: GenerationEvent) => void;
  subscribe: (callback: (event: GenerationEvent) => void) => () => void;
}

const GenerationEventContext = createContext<GenerationEventContextValue | null>(null);

/**
 * Provider for generation events
 * Allows components to emit and subscribe to generation-related events
 */
export function GenerationEventProvider({ children }: { children: React.ReactNode }) {
  const subscribersRef = useRef<Set<(event: GenerationEvent) => void>>(new Set());

  const emit = useCallback((event: GenerationEvent) => {
    // Broadcast to all subscribers
    subscribersRef.current.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in event subscriber:', error);
      }
    });
  }, []);

  const subscribe = useCallback((callback: (event: GenerationEvent) => void) => {
    subscribersRef.current.add(callback);
    
    // Return unsubscribe function
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value: GenerationEventContextValue = useMemo(
    () => ({
      emit,
      subscribe,
    }),
    [emit, subscribe]
  );

  return (
    <GenerationEventContext.Provider value={value}>
      {children}
    </GenerationEventContext.Provider>
  );
}

/**
 * Hook to access generation event context
 */
export function useGenerationEventContext(): GenerationEventContextValue {
  const context = useContext(GenerationEventContext);
  if (!context) {
    throw new Error('useGenerationEventContext must be used within GenerationEventProvider');
  }
  return context;
}
