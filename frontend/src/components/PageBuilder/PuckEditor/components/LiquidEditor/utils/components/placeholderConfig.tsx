import type { ComponentConfig } from '@measured/puck';
import { PlaceholderRenderer } from './PlaceholderRenderer';
import { ROOT_ZONE_COMPOUNDS } from './createPuckRoot';
import type { 
  PlaceholderConfigOptions,
} from '../../SectionAddition.types';

// Module-level storage for placeholder options
// This allows PlaceholderRenderer to access these callbacks
let _placeholderOptions: PlaceholderConfigOptions = {};

/**
 * Set the placeholder options for dynamic section loading.
 * Call this once during editor initialization to provide the callbacks.
 * 
 * @param options - The placeholder configuration options
 */
export function setPlaceholderOptions(options: PlaceholderConfigOptions): void {
  _placeholderOptions = options;
}

/**
 * Get the current placeholder options
 */
export function getPlaceholderOptions(): PlaceholderConfigOptions {
  return _placeholderOptions;
}

/**
 * Generates a lightweight Puck component config for a placeholder section.
 * 
 * The placeholder component shows a loading state while the actual section data
 * is being fetched. Once loaded, this placeholder is replaced with the real
 * section component.
 * 
 * IMPORTANT: PlaceholderRenderer uses usePuck() internally, which means it must
 * be rendered inside the Puck component tree. This is satisfied because this
 * config is registered in Puck's components.
 * 
 * @param sectionId - The unique identifier for the section to load
 * @param displayName - Human-readable name for display in the loading state
 * @param categoryKey - The category key for skeleton layout styling
 * @param options - Optional callbacks for fetching and registering components
 * @returns ComponentConfig for Puck registration
 */
export function generatePlaceholderConfig(
  sectionId: string,
  displayName: string,
  categoryKey: string,
  options?: PlaceholderConfigOptions
): ComponentConfig {
  // Merge provided options with module-level options
  const mergedOptions = { ..._placeholderOptions, ...options };
  
  return {
    label: `${displayName} (Loading...)`,
    fields: {
      section_id: { 
        type: "custom",
        render: () => null, // Hidden field
      },
      display_name: { 
        type: "custom",
        render: () => null, // Hidden field
      },
      category_key: { 
        type: "custom",
        render: () => null, // Hidden field
      },
      is_placeholder: { 
        type: "custom",
        render: () => null, // Hidden field
      },
    },
    defaultProps: {
      section_id: sectionId,
      display_name: displayName,
      category_key: categoryKey,
      is_placeholder: true,
    },
    resolvePermissions: (data, { permissions, appState }) => {
      // Header/footer: restrict actions. Permissions: duplicate (copy), drag (reorder), delete (remove).
      // Always: duplicate=false, drag=false (single-slot zones), delete=false (use Replace to swap, not delete).
      const indexes = (appState as any)?.indexes;
      if (!indexes?.nodes || !data?.props?.id) return permissions;
      const node = indexes.nodes[data.props.id];
      if (!node) return permissions;
      const zoneCompound = `${node.parentId}:${node.zone}`;
      if (zoneCompound === ROOT_ZONE_COMPOUNDS.header || zoneCompound === ROOT_ZONE_COMPOUNDS.footer) {
        return { ...permissions, duplicate: false, drag: false, delete: false };
      }
      return permissions;
    },
    render: ({ section_id, display_name, category_key, id }) => {
      // Get latest options at render time (in case they've been updated)
      const currentOptions = getPlaceholderOptions();
      const finalOptions = { ...currentOptions, ...mergedOptions };
      
      return (
        <PlaceholderRenderer
          section_id={section_id}
          display_name={display_name}
          category_key={category_key}
          id={id}
          is_placeholder={true}
          fetchSectionData={finalOptions.fetchSectionData}
          onRegisterComponent={finalOptions.onRegisterComponent}
        />
      );
    },
  };
}

/**
 * Generates a component key for a placeholder component.
 * Used to register placeholder components in Puck config.
 * 
 * @param sectionId - The section ID
 * @returns The placeholder component key (e.g., "PLACEHOLDER__section_123")
 */
export function getPlaceholderComponentKey(sectionId: string): string {
  return `PLACEHOLDER__${sectionId}`;
}
