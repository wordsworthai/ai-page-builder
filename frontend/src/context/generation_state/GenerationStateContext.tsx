import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  GenerationState,
  getPersistedGenerationState,
  setPersistedGenerationState,
  clearPersistedGenerationState,
  isStateStale,
} from './generationStateStorage';

interface GenerationStateContextValue {
  state: GenerationState | null;
  setActiveGeneration: (config: {
    generationVersionId: string;
    type: GenerationState['generationType'];
    sourceGenerationVersionId?: string;
    fromCreateSite?: boolean;
    fromUseTemplate?: boolean;
    fromPartialAutopop?: boolean;
  }) => void;
  clearActiveGeneration: () => void;
  getActiveGenerationId: () => string | null;
  isActiveGeneration: (id: string) => boolean;
}

const GenerationStateContext = createContext<GenerationStateContextValue | undefined>(undefined);

interface GenerationStateProviderProps {
  children: React.ReactNode;
}

export const GenerationStateProvider: React.FC<GenerationStateProviderProps> = ({ children }) => {
  const [state, setState] = useState<GenerationState | null>(() => {
    // Initialize from localStorage on mount
    const persisted = getPersistedGenerationState();
    return persisted;
  });

  // Ref to track if we're updating from storage event (to prevent loops)
  const isUpdatingFromStorageRef = useRef(false);

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    if (state) {
      setPersistedGenerationState(state);
    } else {
      clearPersistedGenerationState();
    }
  }, [state]);

  // Listen to storage events for cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'generation_state' && e.newValue) {
        try {
          isUpdatingFromStorageRef.current = true;
          const newState: GenerationState = JSON.parse(e.newValue);
          // Only update if state is not stale
          if (!isStateStale(newState)) {
            setState(newState);
          } else {
            // Clear stale state from other tab
            clearPersistedGenerationState();
            setState(null);
          }
        } catch (error) {
          console.error('Failed to parse storage event:', error);
        } finally {
          isUpdatingFromStorageRef.current = false;
        }
      } else if (e.key === 'generation_state' && !e.newValue) {
        // State was cleared in another tab
        if (!isUpdatingFromStorageRef.current) {
          setState(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Listen to visibility change to refresh state when tab becomes visible
  // (useful when user switches tabs and state might have changed)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const persistedState = getPersistedGenerationState();
        if (persistedState) {
          // Only update if different to avoid unnecessary re-renders
          if (!state || persistedState.activeGenerationVersionId !== state.activeGenerationVersionId) {
            setState(persistedState);
          }
        } else if (state) {
          // State was cleared while tab was hidden
          setState(null);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state]);

  // Auto-cleanup stale state on mount and periodically
  useEffect(() => {
    if (state && isStateStale(state)) {
      clearPersistedGenerationState();
      setState(null);
    }
  }, [state]);

  const setActiveGeneration = useCallback((config: {
    generationVersionId: string;
    type: GenerationState['generationType'];
    sourceGenerationVersionId?: string;
    fromCreateSite?: boolean;
    fromUseTemplate?: boolean;
    fromPartialAutopop?: boolean;
  }) => {
    const newState: GenerationState = {
      activeGenerationVersionId: config.generationVersionId,
      generationType: config.type,
      sourceGenerationVersionId: config.sourceGenerationVersionId ?? null,
      fromCreateSite: config.fromCreateSite ?? false,
      fromUseTemplate: config.fromUseTemplate ?? false,
      fromPartialAutopop: config.fromPartialAutopop ?? false,
      timestamp: Date.now(),
    };
    setState(newState);
  }, []);

  const clearActiveGeneration = useCallback(() => {
    setState(null);
  }, []);

  const getActiveGenerationId = useCallback((): string | null => {
    return state?.activeGenerationVersionId ?? null;
  }, [state]);

  const isActiveGeneration = useCallback((id: string): boolean => {
    return state?.activeGenerationVersionId === id;
  }, [state]);

  const value: GenerationStateContextValue = {
    state,
    setActiveGeneration,
    clearActiveGeneration,
    getActiveGenerationId,
    isActiveGeneration,
  };

  return (
    <GenerationStateContext.Provider value={value}>
      {children}
    </GenerationStateContext.Provider>
  );
};

export function useGenerationState(): GenerationStateContextValue {
  const context = useContext(GenerationStateContext);
  if (context === undefined) {
    throw new Error('useGenerationState must be used within a GenerationStateProvider');
  }
  return context;
}
