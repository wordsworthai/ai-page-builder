import { useEffect } from 'react';
import { createUsePuck } from '@measured/puck';
import { useGenerationEventContext } from '../contexts/GenerationEventContext';

const usePuck = createUsePuck();

/**
 * Clears Puck selection (itemSelector) when generation starts.
 * Renders nothing; must be mounted inside Puck tree.
 */
export function ClearPuckSelectionOnGenerationStart() {
  const dispatch = usePuck((s) => s.dispatch);
  const { subscribe } = useGenerationEventContext();

  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      if (event.type === 'GENERATION_STARTED' || event.type === 'CLEAR_PUCK_SELECTION') {
        dispatch({ type: 'setUi', ui: { itemSelector: null } });
      }
    });
    return unsubscribe;
  }, [subscribe, dispatch]);

  return null;
}
