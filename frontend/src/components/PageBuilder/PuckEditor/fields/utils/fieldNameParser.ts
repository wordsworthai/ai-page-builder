/**
 * Utility functions for parsing field names to extract block information.
 * 
 * Field name patterns:
 * - Section settings: `setting_name` (e.g., `hero_title`)
 * - Block settings: `blockType[index].setting_name` (e.g., `features_block[0].title`)
 */
export interface ParsedFieldName {
  blockType: string | undefined;  // "features_block" or undefined for section settings
  blockIndex: number | undefined; // 0, 1, 2 or undefined for section settings
  settingName: string;            // The actual setting name
  isBlockField: boolean;           // true if this is a block field
}

/**
 * Parse a field name to extract block type, block index, and setting name.
 * 
 * @param fieldName - The field name to parse (e.g., "features_block[0].title" or "hero_title")
 * @returns Parsed field name information
 * 
 * @example
 * parseFieldName("features_block[0].title")
 * // Returns: { blockType: "features_block", blockIndex: 0, settingName: "title", isBlockField: true }
 * 
 * @example
 * parseFieldName("hero_title")
 * // Returns: { blockType: undefined, blockIndex: undefined, settingName: "hero_title", isBlockField: false }
 */
export function parseFieldName(fieldName: string): ParsedFieldName {
  // Pattern: blockType[index].settingName
  // Example: "features_block[0].title" -> { blockType: "features_block", blockIndex: 0, settingName: "title" }
  // Example: "hero_title" -> { blockType: undefined, blockIndex: undefined, settingName: "hero_title" }
  
  const blockPattern = /^([^[]+)\[(\d+)\]\.(.+)$/;
  const match = fieldName.match(blockPattern);
  
  if (match) {
    const result = {
      blockType: match[1],
      blockIndex: parseInt(match[2], 10),
      settingName: match[3],
      isBlockField: true
    };
    return result;
  }
  
  const result = {
    blockType: undefined,
    blockIndex: undefined,
    settingName: fieldName,
    isBlockField: false
  };
  return result;
}

