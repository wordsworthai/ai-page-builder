import type { BlockIndexMapping } from '../../../../contexts/BlockIndexMappingContext';

/**
 * Extracts block index mappings from Puck editor data.
 *
 * Block index mappings map section IDs to their __block_index_mapping__ prop,
 * which converts Puck's per-type block indexes to Shopify's global block indexes.
 * Used for highlighting elements in the preview iframe.
 * in puck , each block has its own array and all elements inside that array are pure of given block type
 * in shopify, we have a single array of all blocks and all elements inside that array are of all block types
 * for example, if we have a section with 3 blocks of type "text" and 2 blocks of type "image",
 * in puck data, we will have 2 arrays, one for "text" blocks and one for "image" blocks.
 * in shopify data, we will have a single array of all blocks. containing both "text" and "image" blocks.
 * so we need to convert the puck data to shopify data and then extract the block index mappings.
 * @param data - Puck Data (content + zones)
 * @returns BlockIndexMapping keyed by liquid_section_id
 */
export function extractBlockIndexMappingsFromPuckData(data: any): BlockIndexMapping {
  const mappings: BlockIndexMapping = {};

  /**
   * Walks an array of Puck items (blocks) and collects __block_index_mapping__
   * from each item that has a liquid_section_id. Mutates the outer `mappings` object.
   */
  const collectFromItems = (items: any[]) => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      const sectionId = item.props?.liquid_section_id;
      if (!sectionId) continue;
      const blockIndexMapping = item.props?.__block_index_mapping__;
      if (blockIndexMapping && typeof blockIndexMapping === 'object') {
        mappings[sectionId] = blockIndexMapping;
      }
    }
  };

  collectFromItems(data?.content ?? []);
  const zones = data?.zones ?? {};
  for (const zoneContent of Object.values(zones)) {
    collectFromItems(zoneContent as any[]);
  }

  return mappings;
}
