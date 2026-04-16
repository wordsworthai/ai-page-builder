import React from 'react';
import { ActionBar, createUsePuck } from '@measured/puck';
import { RefreshCw, Repeat, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { ROOT_ZONE_COMPOUNDS } from '../utils/components/createPuckRoot';
import { getBaseSectionIdForApi } from '../utils/dynamicPuckSectionConfig';

interface StructuralActionBarOverrideProps {
  children: React.ReactNode;
  label?: string;
  parentAction: React.ReactNode;
  onOpenAddPanel?: () => void;
  onRegenerate?: (sectionId: string, sectionIndex: number) => void;
  generationVersionId?: string;
  onReplaceHeader?: () => void;
  onReplaceFooter?: () => void;
  isNonHomepage?: boolean;
}

/**
 * Action bar override that adds Regenerate and Insert section (plus) for sections zone,
 * and Replace for header/footer. Header/footer do not show Delete (disabled via resolvePermissions).
 * Plus button opens the Add Components sidebar; user picks section then position.
 */
const usePuck = createUsePuck();
const StructuralActionBarOverrideComponent: React.FC<StructuralActionBarOverrideProps> = ({
  children,
  label,
  parentAction,
  onOpenAddPanel,
  onRegenerate,
  generationVersionId,
  onReplaceHeader,
  onReplaceFooter,
  isNonHomepage = false,
}) => {
  const selectedItem = usePuck((s) => s.selectedItem);
  const getSelectorForId = usePuck((s) => s.getSelectorForId);
  const dispatch = usePuck((s) => s.dispatch);
  const appState = usePuck((s) => s.appState);

  // Compute global section index (header | sections | footer) for API calls.
  // Backend template_unique_section_id_map uses global indices.
  const getGlobalSectionIndex = React.useCallback(
    (zone: string, zoneIndex: number): number => {
      const zones = appState?.data?.zones ?? {};
      const headerCount = (zones[ROOT_ZONE_COMPOUNDS.header] ?? []).length;
      const contentCount = (appState?.data?.content ?? []).length;
      if (zone === ROOT_ZONE_COMPOUNDS.header) return zoneIndex; // 0 for single header
      if (zone === ROOT_ZONE_COMPOUNDS.footer) return headerCount + contentCount + zoneIndex;
      // Body/sections: any zone that's not header or footer (root content).
      // Treat unknown zones as body - Puck may use different zone names for root content.
      return headerCount + zoneIndex;
    },
    [appState?.data]
  );

  // Derive zone context and move handlers from the currently selected item.
  const { isInSectionsZone, isInHeaderZone, isInFooterZone, canMoveUp, canMoveDown, onMoveUp, onMoveDown } = React.useMemo(() => {
    const base = { 
      isInSectionsZone: false, 
      isInHeaderZone: false, 
      isInFooterZone: false, 
      canMoveUp: false, 
      canMoveDown: false, 
      onMoveUp: undefined as (() => void) | undefined, 
      onMoveDown: undefined as (() => void) | undefined 
    };
    if (!selectedItem?.props?.id) return base;
    // Returns { zone, index } (e.g. { zone: "root:sections", index: 2 }) or undefined if not found.
    const selector = getSelectorForId(selectedItem.props.id);
    if (!selector) return base;

    // Determine which zone the selected item lives in (sections, header, or footer).
    const inSections = selector.zone === ROOT_ZONE_COMPOUNDS.sections;
    const inHeader = selector.zone === ROOT_ZONE_COMPOUNDS.header;
    const inFooter = selector.zone === ROOT_ZONE_COMPOUNDS.footer;

    let canMoveUp = false;
    let canMoveDown = false;
    let onMoveUp: (() => void) | undefined;
    let onMoveDown: (() => void) | undefined;

    // Move up/down only applies to sections zone; header/footer are single-item zones.
    if (inSections) {
      // Get the total number of sections in the sections zone.
      const totalCount = appState?.data?.zones?.[selector.zone]?.length ?? 0;
      canMoveUp = selector.index > 0;
      canMoveDown = selector.index < totalCount - 1;
      onMoveUp = canMoveUp
        ? () => dispatch({ type: 'reorder', sourceIndex: selector.index, destinationIndex: selector.index - 1, destinationZone: selector.zone, recordHistory: true })
        : undefined;
      onMoveDown = canMoveDown
        ? () => dispatch({ type: 'reorder', sourceIndex: selector.index, destinationIndex: selector.index + 1, destinationZone: selector.zone, recordHistory: true })
        : undefined;
    }

    return {
      isInSectionsZone: inSections,
      isInHeaderZone: inHeader,
      isInFooterZone: inFooter,
      canMoveUp,
      canMoveDown,
      onMoveUp,
      onMoveDown,
    };
  }, [selectedItem, getSelectorForId, dispatch, appState]);

  // Shared Regenerate button - same logic for sections, header, and footer zones.
  const regenerateButton = React.useMemo(() => {
    if (!onRegenerate || !generationVersionId) return null;
    const rawSectionId = selectedItem?.props?.liquid_section_id ?? selectedItem?.props?.id;
    const selector = selectedItem?.props?.id ? getSelectorForId(selectedItem.props.id) : null;
    const zoneIndex = selector?.index ?? 0;
    const sectionIndex = selector
      ? getGlobalSectionIndex(selector.zone, zoneIndex)
      : null;
    if (sectionIndex == null) return null;
    const sectionId = typeof rawSectionId === 'string' ? getBaseSectionIdForApi(rawSectionId) : null;
    if (typeof sectionId !== 'string') return null;
    return (
      <ActionBar.Action
        onClick={() => onRegenerate(sectionId, sectionIndex)}
        label="Regenerate content"
      >
        <RefreshCw size={16} />
      </ActionBar.Action>
    );
  }, [
    onRegenerate,
    generationVersionId,
    selectedItem?.props?.liquid_section_id,
    selectedItem?.props?.id,
    getSelectorForId,
    getGlobalSectionIndex,
  ]);

  return (
    <ActionBar>
      <ActionBar.Group>
        {parentAction}
        {label && <ActionBar.Label label={label} />}
      </ActionBar.Group>
      <ActionBar.Group>
        {isInSectionsZone && (
          <>
            {canMoveUp && onMoveUp && (
              <ActionBar.Action onClick={onMoveUp} label="Move up">
                <ChevronUp size={16} />
              </ActionBar.Action>
            )}
            {canMoveDown && onMoveDown && (
              <ActionBar.Action onClick={onMoveDown} label="Move down">
                <ChevronDown size={16} />
              </ActionBar.Action>
            )}
            {regenerateButton}
            {onOpenAddPanel && (
              <ActionBar.Action onClick={onOpenAddPanel} label="Insert section">
                <Plus size={16} />
              </ActionBar.Action>
            )}
          </>
        )}
        {!isNonHomepage && isInHeaderZone && (
          <>
            {regenerateButton}
            {onReplaceHeader && (
              <ActionBar.Action onClick={onReplaceHeader} label="Replace">
                <Repeat size={16} />
              </ActionBar.Action>
            )}
          </>
        )}
        {!isNonHomepage && isInFooterZone && (
          <>
            {regenerateButton}
            {onReplaceFooter && (
              <ActionBar.Action onClick={onReplaceFooter} label="Replace">
                <Repeat size={16} />
              </ActionBar.Action>
            )}
          </>
        )}
        {children}
      </ActionBar.Group>
    </ActionBar>
  );
};

export const StructuralActionBarOverride = React.memo(StructuralActionBarOverrideComponent);
