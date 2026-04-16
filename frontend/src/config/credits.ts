/**
 * Credit config: maps UI action types to API cost keys only.
 * Cost values come from the backend (GET /api/credits/info); no default costs here.
 */

export type ActionType =
  | 'full_page'
  | 'color_theme'
  | 'content'
  | 'add_page'
  | 'create_site'
  | 'section_regeneration';

/** API cost keys returned by GET /api/credits/info (costs map). */
export type CreditCostKey =
  | 'create-site'
  | 'use-section-ids'
  | 'regenerate-color-theme'
  | 'regenerate-content'
  | 'section_regeneration';

export const ACTION_TYPE_TO_COST_KEY: Record<ActionType, CreditCostKey> = {
  full_page: 'create-site',
  color_theme: 'regenerate-color-theme',
  content: 'regenerate-content',
  add_page: 'use-section-ids',
  create_site: 'create-site',
  section_regeneration: 'section_regeneration',
};

/**
 * Get credit cost for an action from API costs. No fallback; backend is source of truth.
 */
export function getCreditCostForAction(
  actionType: ActionType,
  costsFromApi: Record<string, number> | undefined
): number | undefined {
  if (costsFromApi == null) return undefined;
  const key = ACTION_TYPE_TO_COST_KEY[actionType];
  const cost = costsFromApi[key];
  return typeof cost === 'number' ? cost : undefined;
}
