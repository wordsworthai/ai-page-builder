import React, { useMemo } from 'react';
import { createUsePuck } from '@measured/puck';
import { ROOT_ZONE_COMPOUNDS } from '../utils/components/createPuckRoot';

const usePuck = createUsePuck();

interface RestrictedFieldsOverrideProps {
  isNonHomepage: boolean;
  isLoading: boolean;
  itemSelector?: unknown;
  children: React.ReactNode;
}

/**
 * Fields override that shows a message instead of editable fields when
 * header or footer is selected on a subpage. Header and footer can only
 * be edited from the homepage.
 */
const RestrictedFieldsOverrideComponent: React.FC<RestrictedFieldsOverrideProps> = ({
  isNonHomepage,
  children,
}) => {
  const selectedItem = usePuck((s) => s.selectedItem);
  const getSelectorForId = usePuck((s) => s.getSelectorForId);
  const appState = usePuck((s) => s.appState);

  // Restrict field editing when header/footer is selected on a subpage (they are homepage-only).
  const shouldRestrict = useMemo(() => {
    if (!selectedItem?.props?.id) return false;
    const selector = getSelectorForId(selectedItem.props.id);
    if (!selector?.zone) return false;

    const isInHeaderOrFooter =
      selector.zone === ROOT_ZONE_COMPOUNDS.header ||
      selector.zone === ROOT_ZONE_COMPOUNDS.footer;
    if (!isInHeaderOrFooter) return false;

    // Subpage can come from route (isNonHomepage) or from template data (page_structure_info).
    const psi = (appState as any)?.data?.root?.props?.page_structure_info;
    const isSubpageFromPsi = psi?.page_type && psi.page_type !== 'homepage';
    return isNonHomepage || isSubpageFromPsi;
  }, [selectedItem, getSelectorForId, appState, isNonHomepage]);

  if (shouldRestrict) {
    return (
      <div
        style={{
          padding: 16,
          color: 'var(--puck-color-text-primary, #374151)',
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        Header and footer are inherited from the homepage. Switch to the
        homepage to edit them.
      </div>
    );
  }

  return <>{children}</>;
};

export const RestrictedFieldsOverride = React.memo(RestrictedFieldsOverrideComponent);
