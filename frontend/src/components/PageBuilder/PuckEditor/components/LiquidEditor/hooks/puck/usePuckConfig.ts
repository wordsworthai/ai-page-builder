import { useMemo } from 'react';
import { generatingConfig, generatingData } from '../../views/generatingConfig';

export type EditorState = 'checking' | 'loading' | 'generating' | 'ready' | 'error';

interface UsePuckConfigParams {
  templateConfig?: any;
  templateData?: any;
}

interface UsePuckConfigReturn {
  puckConfig: any;
  puckData: any;
}

/**
 * Hook to determine which Puck config and data to use.
 * 
 * SIMPLIFIED: Always use real config/data when available, regardless of editorState.
 * With Puck's data sync feature, data prop changes are automatically synced
 * to the store without needing a remount.
 * 
 * This prevents unnecessary config/data switching during state transitions,
 * which reduces flicker.
 */
export function usePuckConfig({
  templateConfig,
  templateData,
}: UsePuckConfigParams): UsePuckConfigReturn {
  // Always prefer real config when available
  const puckConfig = useMemo(() => {
    return templateConfig || generatingConfig;
  }, [templateConfig]);
  
  // Always prefer real data when available
  const puckData = useMemo(() => {
    return templateData || generatingData;
  }, [templateData]);

  return { puckConfig, puckData };
}
