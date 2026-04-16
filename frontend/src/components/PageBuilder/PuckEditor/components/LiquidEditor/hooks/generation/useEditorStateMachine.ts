import { useReducer, useEffect, useRef } from 'react';
import { useGenerationEventContext } from '../../contexts/GenerationEventContext';
import type { GenerationStatus } from '@/streaming/types/generation';

/**
 * Editor state machine states:
 * - 'checking': Initial state, checking if generation is complete
 * - 'generating': Generation in progress, show Puck with progress overlay in iframe
 * - 'loading': Generation complete, loading template data
 * - 'ready': Template loaded, show full editor
 * - 'error': Error state (invalid generation ID, network error, etc.)
 */
export type EditorState = 'checking' | 'generating' | 'loading' | 'ready' | 'error';

/**
 * Editor state machine actions.
 * 
 * These actions are dispatched internally by the state machine hook based on:
 * - Initial generation status check (INITIAL_CHECK_COMPLETE, SET_GENERATION_ID)
 * - Generation events from GenerationEventContext (START_GENERATION, COMPLETE_GENERATION, TEMPLATE_LOADED)
 * 
 * Action flow:
 * 1. SET_GENERATION_ID → Set when initial check completes (internal)
 * 2. INITIAL_CHECK_COMPLETE → Set when initial status check completes (internal)
 * 3. START_GENERATION → Dispatched when GENERATION_STARTED event received (from useGenerationEventEmitter)
 * 4. COMPLETE_GENERATION → Dispatched when GENERATION_COMPLETED event received (from useGenerationEventEmitter)
 * 5. TEMPLATE_LOADED → Dispatched when FINAL_TEMPLATE_LOADED event received (from useGenerationTemplateLoader)
 */
type EditorAction =
  | { 
      type: 'START_GENERATION'; 
      generationId: string;
      // Emitted by: State machine hook when GENERATION_STARTED event is received
      // Source: useGenerationEventEmitter emits GENERATION_STARTED when generation status becomes 'processing'
    }
  | { 
      type: 'COMPLETE_GENERATION'; 
      generationId: string;
      // Emitted by: State machine hook when GENERATION_COMPLETED event is received
      // Source: useGenerationEventEmitter emits GENERATION_COMPLETED when generation status becomes 'completed'
    }
  | { 
      type: 'TEMPLATE_LOADED'; 
      generationId: string;
      // Emitted by: State machine hook when FINAL_TEMPLATE_LOADED event is received
      // Source: useGenerationTemplateLoader emits FINAL_TEMPLATE_LOADED after successfully loading template
    }
  | { 
      type: 'INITIAL_CHECK_COMPLETE'; 
      status: 'completed' | 'processing' | 'failed' | 'error'; 
      generationId?: string;
      // Emitted by: State machine hook during initial status check (internal)
      // Source: Initial useEffect that checks generationStatus prop when component mounts
      // Purpose: Determines initial editor state based on current generation status
    }
  | { 
      type: 'SET_GENERATION_ID'; 
      generationId: string;
      // Emitted by: State machine hook during initial status check (internal)
      // Source: Initial useEffect that checks generationStatus prop when component mounts
      // Purpose: Sets the current generation ID before processing initial check
    };

interface EditorStateMachineState {
  editorState: EditorState;
  currentGenerationId: string | null;
  hasCheckedStatus: boolean;
}

function editorReducer(
  state: EditorStateMachineState,
  action: EditorAction
): EditorStateMachineState {
  switch (action.type) {
    case 'INITIAL_CHECK_COMPLETE':
      if (state.hasCheckedStatus) return state; // Only process once
      
      if (action.status === 'completed') {
        // Note: currentGenerationId will be set by the component when it detects completed status
        return {
          ...state,
          editorState: 'loading',
          hasCheckedStatus: true,
        };
      } else if (action.status === 'failed') {
        console.log('❌ Generation failed, showing error in overlay');
        return {
          ...state,
          editorState: 'generating',
          hasCheckedStatus: true,
        };
      } else if (action.status === 'processing') {
        return {
          ...state,
          editorState: 'generating',
          hasCheckedStatus: true,
        };
      } else {
        // Error case (invalid generation ID, network error, etc.)
        console.error('❌ Error checking generation status - invalid generation ID or network error');
        return {
          ...state,
          editorState: 'error',
          hasCheckedStatus: true,
        };
      }

    case 'START_GENERATION':
      if (state.editorState === 'checking' || state.editorState === 'ready') {
        return {
          ...state,
          editorState: 'generating',
          currentGenerationId: action.generationId,
        };
      }
      return state;

    case 'COMPLETE_GENERATION':
      if (state.editorState === 'generating' && state.currentGenerationId === action.generationId) {
        return {
          ...state,
          editorState: 'loading',
        };
      }
      return state;

    case 'TEMPLATE_LOADED':
      // Allow transition to ready if we're in loading state, even if generationId doesn't match
      // (this handles the case where generation was already complete)
      if (state.editorState === 'loading') {
        return {
          ...state,
          editorState: 'ready',
        };
      }
      return state;

    case 'SET_GENERATION_ID':
      return {
        ...state,
        currentGenerationId: action.generationId,
      };

    default:
      return state;
  }
}

interface UseEditorStateMachineParams {
  generationStatus: GenerationStatus | undefined;
  isCheckingStatus: boolean;
  statusCheckError: boolean;
}

interface UseEditorStateMachineReturn {
  editorState: EditorState;
  hasCheckedStatus: boolean;
}

/**
 * Hook to manage editor state transitions using reducer pattern and events.
 * 
 * Listens to generation events and manages state transitions:
 * - checking → generating (on GENERATION_STARTED or initial check shows processing)
 * - checking → loading (on initial check shows completed)
 * - generating → loading (on GENERATION_COMPLETED)
 * - loading → ready (on TEMPLATE_LOADED event)
 */
export function useEditorStateMachine({
  generationStatus,
  isCheckingStatus,
  statusCheckError,
}: UseEditorStateMachineParams): UseEditorStateMachineReturn {
  const [state, dispatch] = useReducer(editorReducer, {
    editorState: 'checking',
    currentGenerationId: null,
    hasCheckedStatus: false,
  });

  const { subscribe } = useGenerationEventContext();
  const initialCheckDoneRef = useRef(false);

  // Handle initial status check (legacy support - will be replaced by events)
  useEffect(() => {
    if (!state.hasCheckedStatus && !isCheckingStatus && !initialCheckDoneRef.current) {
      initialCheckDoneRef.current = true;
      
      if (statusCheckError) {
        dispatch({ type: 'INITIAL_CHECK_COMPLETE', status: 'error' });
        return;
      }

      if (!generationStatus) {
        return;
      }

      const status = generationStatus.status;
      const generationId = generationStatus.generation_version_id;
      
      // Set generation ID first
      dispatch({ type: 'SET_GENERATION_ID', generationId });
      
      // Then dispatch initial check complete
      dispatch({
        type: 'INITIAL_CHECK_COMPLETE',
        status: status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'processing',
        generationId,
      });
    }
  }, [generationStatus, isCheckingStatus, statusCheckError, state.hasCheckedStatus]);

  // Subscribe to generation events
  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      switch (event.type) {
        case 'GENERATION_STARTED':
          dispatch({ type: 'START_GENERATION', generationId: event.generationId });
          break;

        case 'GENERATION_COMPLETED':
          dispatch({ type: 'COMPLETE_GENERATION', generationId: event.generationId });
          break;

        case 'FINAL_TEMPLATE_LOADED':
          dispatch({ type: 'TEMPLATE_LOADED', generationId: event.generationId });
          break;

        // Other events don't affect editor state machine
        default:
          break;
      }
    });

    return unsubscribe;
  }, [subscribe]);

  // Template loading is now handled entirely via events (FINAL_TEMPLATE_LOADED)
  // No need for prop-based checking - events are the single source of truth

  return {
    editorState: state.editorState,
    hasCheckedStatus: state.hasCheckedStatus,
  };
}
