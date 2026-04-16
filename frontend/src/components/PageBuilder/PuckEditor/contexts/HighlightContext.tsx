import { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { useBlockIndexMappingSafe } from './BlockIndexMappingContext';

/**
 * Context for highlighting elements in the Puck iframe preview.
 * Provides functions to highlight elements by their data-wwai-element-id attribute
 * and to clear all highlights.
 */

interface HighlightContextType {
  /**
   * Highlight an element in the iframe by its element ID.
   * @param elementId - The value of the data-wwai-element-id attribute to highlight
   * @param sectionId - Optional section ID used as a CSS class on the parent section wrapper
   * @param blockType - Optional block type (e.g., "features_block" or "wwai_base_settings" for section settings)
   * @param blockIndex - Optional block index (e.g., 0, 1, 2 for block instances)
   */
  highlightElement: (elementId: string, sectionId?: string, blockType?: string, blockIndex?: number) => void;
  
  /**
   * Clear all highlights from the iframe.
   */
  clearHighlights: () => void;
}

const HighlightContext = createContext<HighlightContextType | null>(null);

/**
 * Get the Puck preview iframe element.
 * Returns null if not found.
 */
function getPreviewIframe(): HTMLIFrameElement | null {
  return document.querySelector<HTMLIFrameElement>('#preview-frame');
}

/**
 * Send a postMessage to the iframe for highlighting.
 */
function sendHighlightMessage(type: 'WWAI_HIGHLIGHT_ADD' | 'WWAI_HIGHLIGHT_CLEAR_ALL', selector?: string) {
  const iframe = getPreviewIframe();
  const contentWindow = iframe?.contentWindow;
  
  if (!contentWindow) {
    console.warn('[HighlightContext] Preview iframe not found or not accessible');
    return;
  }
  
  if (type === 'WWAI_HIGHLIGHT_ADD' && selector) {
    contentWindow.postMessage({ type, selector }, '*');
  } else if (type === 'WWAI_HIGHLIGHT_CLEAR_ALL') {
    contentWindow.postMessage({ type }, '*');
  }
}

interface HighlightProviderProps {
  children: ReactNode;
}

/**
 * Provider component for the highlight context.
 * Wrap your Puck editor with this to enable element highlighting.
 */
export const HighlightProvider: React.FC<HighlightProviderProps> = ({ children }) => {
  const { mappings } = useBlockIndexMappingSafe();

  const highlightElement = useCallback((
    elementId: string, 
    sectionId?: string, 
    blockType?: string, 
    blockIndex?: number
  ) => {
    if (!elementId || elementId === '_ungrouped') {
      return;
    }
    
    // Clear existing highlights first
    sendHighlightMessage('WWAI_HIGHLIGHT_CLEAR_ALL');
    
    // Build base selector parts
    const sectionScope = sectionId ? `.section-${sectionId}` : '';
    const elementSelector = `[data-wwai-element-id^="${elementId}"]`;
    // Determine block type - default to "wwai_base_settings" for section settings
    // Only use provided blockType if blockIndex is also provided (indicating a block setting)
    const resolvedBlockType = (blockIndex !== undefined && blockType) 
      ? blockType 
      : 'wwai_base_settings';
    // Build block type selector
    const blockTypeSelector = `[data-wwai-block-type="${resolvedBlockType}"]`;
    // Convert per-type index to global index using mapping
    let globalBlockIndex: number | undefined = blockIndex;
    if (blockIndex !== undefined && blockType && sectionId && mappings[sectionId]?.[blockType]) {
      const mapping = mappings[sectionId][blockType];
      if (mapping[blockIndex] !== undefined) {
        globalBlockIndex = mapping[blockIndex];
      }
    }
    // Build block index selector (only for block settings)
    // Use global index if conversion succeeded, otherwise fall back to per-type index
    const blockIndexSelector = (globalBlockIndex !== undefined && blockType) 
      ? `[data-wwai-block-index="${globalBlockIndex}"]` 
      : '[data-wwai-block-index="-1"]';
    // Combine selectors
    const selector = sectionScope
      ? `${sectionScope} ${blockTypeSelector}${blockIndexSelector}${elementSelector}`
      : `${blockTypeSelector}${blockIndexSelector}${elementSelector}`;
    
    // Send highlight message
    sendHighlightMessage('WWAI_HIGHLIGHT_ADD', selector);
  }, [mappings]);
  
  const clearHighlights = useCallback(() => {
    sendHighlightMessage('WWAI_HIGHLIGHT_CLEAR_ALL');
  }, []);
  
  const value = useMemo(() => ({
    highlightElement,
    clearHighlights,
  }), [highlightElement, clearHighlights]);
  
  return (
    <HighlightContext.Provider value={value}>
      {children}
    </HighlightContext.Provider>
  );
};

/**
 * Hook to access the highlight context.
 * Must be used within a HighlightProvider.
 */
export const useHighlight = (): HighlightContextType => {
  const context = useContext(HighlightContext);
  
  if (!context) {
    throw new Error('useHighlight must be used within a HighlightProvider');
  }
  
  return context;
};

/**
 * Safe version of useHighlight that returns no-op functions if not within a provider.
 * Useful for field components that may be rendered outside the provider during development.
 */
export const useHighlightSafe = (): HighlightContextType => {
  const context = useContext(HighlightContext);
  
  if (!context) {
    return {
      highlightElement: (_elementId: string, _sectionId?: string, _blockType?: string, _blockIndex?: number) => {},
      clearHighlights: () => {},
    };
  }
  
  return context;
};

export default HighlightContext;

