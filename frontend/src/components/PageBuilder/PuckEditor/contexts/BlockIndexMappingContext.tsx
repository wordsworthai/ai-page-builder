import React, { createContext, useContext, ReactNode } from 'react';

/**
 * Context for storing block index mappings (per-type index → global index).
 * Used to convert Puck's per-type block indexes to Shopify's global block indexes
 * for highlighting elements in the preview.
 */

/**
 * Mapping structure:
 * - Outer key: sectionId
 * - Middle key: blockType
 * - Inner mapping: perTypeIndex → globalIndex
 */
export type BlockIndexMapping = Record<string, Record<string, Record<number, number>>>;

interface BlockIndexMappingContextType {
  mappings: BlockIndexMapping;
}

const BlockIndexMappingContext = createContext<BlockIndexMappingContextType | null>(null);

interface BlockIndexMappingProviderProps {
  children: ReactNode;
  mappings: BlockIndexMapping;
}

/**
 * Provider component for block index mappings.
 * Wrap components that need access to block index mappings.
 */
export const BlockIndexMappingProvider: React.FC<BlockIndexMappingProviderProps> = ({
  children,
  mappings,
}) => {
  const value = React.useMemo(() => ({ mappings }), [mappings]);

  return (
    <BlockIndexMappingContext.Provider value={value}>
      {children}
    </BlockIndexMappingContext.Provider>
  );
};

/**
 * Hook to access block index mappings.
 * Must be used within a BlockIndexMappingProvider.
 */
export const useBlockIndexMapping = (): BlockIndexMappingContextType => {
  const context = useContext(BlockIndexMappingContext);

  if (!context) {
    throw new Error('useBlockIndexMapping must be used within a BlockIndexMappingProvider');
  }

  return context;
};

/**
 * Safe version of useBlockIndexMapping that returns empty mappings if not within a provider.
 * Useful for components that may be rendered outside the provider during development.
 */
export const useBlockIndexMappingSafe = (): BlockIndexMappingContextType => {
  const context = useContext(BlockIndexMappingContext);

  if (!context) {
    return { mappings: {} };
  }

  return context;
};

export default BlockIndexMappingContext;

