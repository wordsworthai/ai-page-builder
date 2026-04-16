/**
 * Template Save Utilities
 *
 * Utility functions for saving template changes in the Puck editor.
 * Handles section updates, order changes, and deletions.
 * Supports structural model: header | sections | footer.
 */

import type { SaveTemplateRequest } from '@/client/models/SaveTemplateRequest';
import type { SectionUpdate } from '@/client/models/SectionUpdate';
import { ROOT_ZONE_COMPOUNDS } from '../../utils/components/createPuckRoot';

export interface SectionChange {
  orderChanged: boolean;
  deletedSectionIds: string[];
  currentSectionIds: string[];
}

/**
 * Extract section IDs from Puck data in structural order: header, content, footer
 */
export function extractSectionIds(content: any[]): string[] {
  return content
    .map((item: any) => item.props?.liquid_section_id)
    .filter(Boolean) as string[];
}

/**
 * Extract all section IDs from Puck data in structural order (header | sections | footer)
 */
export function extractAllSectionIdsFromStructuralData(puckData: any): string[] {
  const zones = puckData?.zones ?? {};
  const headerItems = zones[ROOT_ZONE_COMPOUNDS.header] ?? [];
  const contentItems = puckData?.content ?? [];
  const footerItems = zones[ROOT_ZONE_COMPOUNDS.footer] ?? [];
  return [
    ...extractSectionIds(headerItems),
    ...extractSectionIds(contentItems),
    ...extractSectionIds(footerItems),
  ];
}

/**
 * Collect all section items from Puck data (for updates extraction)
 */
export function collectAllSectionItems(puckData: any): any[] {
  const zones = puckData?.zones ?? {};
  const headerItems = zones[ROOT_ZONE_COMPOUNDS.header] ?? [];
  const contentItems = puckData?.content ?? [];
  const footerItems = zones[ROOT_ZONE_COMPOUNDS.footer] ?? [];
  return [...headerItems, ...contentItems, ...footerItems];
}

/**
 * Detect changes in section order and deletions
 */
export function detectSectionChanges(
  currentSectionIds: string[],
  originalSectionIds: string[]
): SectionChange {
  const orderChanged =
    originalSectionIds.length !== currentSectionIds.length ||
    originalSectionIds.some((id, index) => id !== currentSectionIds[index]);

  const deletedSectionIds = originalSectionIds.filter(
    (id) => !currentSectionIds.includes(id)
  );

  return {
    orderChanged,
    deletedSectionIds,
    currentSectionIds,
  };
}

/**
 * Extract template JSON updates for each section from Puck data
 */
export function extractSectionUpdates(
  content: any[]
): Record<string, SectionUpdate> {
  const sectionUpdates: Record<string, SectionUpdate> = {};

  for (const item of content) {
    const sectionId = item.props?.liquid_section_id;
    if (!sectionId) {
      console.warn('Section missing liquid_section_id:', item);
      continue;
    }

    try {
      // Parse the compiler dependencies to get template_json_for_compiler
      const compilerDepsStr = item.props?.liquid_section_compiler_dependencies;
      if (!compilerDepsStr) {
        console.warn(`No compiler dependencies found for section ${sectionId}`);
        continue;
      }

      const compilerDeps = JSON.parse(compilerDepsStr);
      const templateJson = compilerDeps?.template_json_for_compiler;

      if (templateJson) {
        sectionUpdates[sectionId] = {
          template_json_for_compiler: templateJson,
        };
      } else {
        console.warn(`No template_json_for_compiler found for section ${sectionId}`);
      }
    } catch (error) {
      console.error(`Error parsing template JSON for section ${sectionId}:`, error);
    }
  }

  return sectionUpdates;
}

/**
 * Get inherited section IDs (header/footer from parent) for subpages.
 * These sections are not stored in the subpage's doc and must be excluded from save.
 */
function getInheritedSectionIds(puckData: any): Set<string> {
  const psi = puckData?.root?.props?.page_structure_info;
  if (!psi || psi.page_type === 'homepage') {
    return new Set();
  }
  const headerIds = psi.header_unique_ids ?? [];
  const footerIds = psi.footer_unique_ids ?? [];
  return new Set([...headerIds, ...footerIds]);
}

/**
 * Filter out inherited sections from save payload for subpages.
 * Subpages inherit header/footer from homepage; those sections live in the parent doc
 * and are not in the subpage's MongoDB sections. Sending them causes validation failure.
 */
function filterInheritedSections<T extends string>(
  ids: T[],
  inheritedIds: Set<string>
): T[] {
  if (inheritedIds.size === 0) return ids;
  return ids.filter((id) => !inheritedIds.has(id)) as T[];
}

/**
 * Build the request body for saving template changes
 */
export function buildSaveRequestBody(
  sectionUpdates: Record<string, SectionUpdate>,
  changes: SectionChange,
  inheritedSectionIds?: Set<string>
): SaveTemplateRequest {
  let filteredUpdates = sectionUpdates;
  let filteredOrder = changes.currentSectionIds;
  let filteredDeleted = changes.deletedSectionIds;

  if (inheritedSectionIds && inheritedSectionIds.size > 0) {
    filteredUpdates = Object.fromEntries(
      Object.entries(sectionUpdates).filter(
        ([id]) => !inheritedSectionIds.has(id)
      )
    );
    filteredOrder = filterInheritedSections(
      changes.currentSectionIds,
      inheritedSectionIds
    );
    filteredDeleted = filterInheritedSections(
      changes.deletedSectionIds,
      inheritedSectionIds
    );
  }

  const requestBody: SaveTemplateRequest = {
    section_updates: filteredUpdates, // Always required by API
  };

  // Include section_order if order changed or if we have sections
  if (changes.orderChanged || filteredOrder.length > 0) {
    requestBody.section_order = filteredOrder;
  }

  // Include deleted_sections if any sections were deleted
  if (filteredDeleted.length > 0) {
    requestBody.deleted_sections = filteredDeleted;
  }

  return requestBody;
}

/**
 * Validate that there are changes to save
 */
export function validateSaveChanges(
  sectionUpdates: Record<string, SectionUpdate>,
  changes: SectionChange
): boolean {
  return (
    Object.keys(sectionUpdates).length > 0 ||
    changes.orderChanged ||
    changes.deletedSectionIds.length > 0
  );
}

/**
 * Build success message from save results
 */
export function buildSuccessMessage(
  sectionUpdates: Record<string, SectionUpdate>,
  changes: SectionChange
): string {
  const messages: string[] = [];

  if (Object.keys(sectionUpdates).length > 0) {
    messages.push(`${Object.keys(sectionUpdates).length} sections updated`);
  }

  if (changes.orderChanged) {
    messages.push('section order updated');
  }

  if (changes.deletedSectionIds.length > 0) {
    messages.push(`${changes.deletedSectionIds.length} section(s) deleted`);
  }

  return messages.join(', ');
}

/**
 * Prepare save data from Puck data and current data
 * Supports structural model: header | sections | footer
 */
export function prepareSaveData(
  puckData: any,
  currentData: any
): {
  requestBody: SaveTemplateRequest;
  changes: SectionChange;
  sectionUpdates: Record<string, SectionUpdate>;
} | null {
  // Validate: need at least content array (can be empty)
  if (!puckData || !Array.isArray(puckData.content)) {
    return null;
  }

  const allSectionItems = collectAllSectionItems(puckData);
  if (allSectionItems.length === 0) {
    return null;
  }

  const currentSectionIds = extractAllSectionIdsFromStructuralData(puckData);
  const originalSectionIds = extractAllSectionIdsFromStructuralData(currentData ?? {});

  const changes = detectSectionChanges(currentSectionIds, originalSectionIds);
  const sectionUpdates = extractSectionUpdates(allSectionItems);
  const inheritedSectionIds = getInheritedSectionIds(puckData);
  const requestBody = buildSaveRequestBody(
    sectionUpdates,
    changes,
    inheritedSectionIds
  );

  return {
    requestBody,
    changes,
    sectionUpdates,
  };
}
