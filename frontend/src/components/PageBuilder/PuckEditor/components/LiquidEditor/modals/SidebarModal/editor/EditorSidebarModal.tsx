import React from 'react';
import { SidebarModal } from '../SidebarModal';
import { CustomiseContent } from './CustomiseContent';
import { AddContent } from './AddContent';
import { SectionTemplatesContent, SectionTemplatesLoading, SectionTemplatesError } from './SectionTemplatesContent';
import type { SidebarModalMode } from '../SidebarModal';
import type { CategoryResponse } from '@/hooks/api/PageBuilder/Editor/useCategories';
import type { CuratedPageOption } from '@/hooks/api/PageBuilder/Editor/useCuratedPages';
import type { SectionBrowserProps, SectionInsertionProps } from '../../../SectionAddition.types';

/**
 * EditorSidebarModal: Sidebar modal for editor view with customise/add modes
 */
export interface EditorSidebarModalProps {
  isOpen: boolean;
  mode: SidebarModalMode;
  onClose: () => void;
  onCategoryClick: (category: CategoryResponse) => void;
  onPageClick?: (page: CuratedPageOption) => void;
  selectedCategory?: CategoryResponse | null;
  /** Initial tab when opening add mode (e.g. headerFooter for Replace action) */
  initialAddTab?: 'page' | 'section' | 'headerFooter';
  /** Section browser state and handlers */
  sectionBrowser?: SectionBrowserProps;
  /** Section insertion (Add Section, Replace Header/Footer) */
  sectionInsertion?: SectionInsertionProps;
  /** Opens Browse templates modal (use-template). Only in ready state. */
  onOpenBrowseTemplates?: () => void;
  /** Current generation version ID (for highlighting its color palette in customise). */
  generationVersionId?: string;
  /** Save unsaved changes before generation (for CustomiseContent color theme, content regen) */
  onSaveBeforeGenerate?: () => Promise<void>;
  /** When true, hide Replace Header/Footer in Add Content (non-homepage pages) */
  isNonHomepage?: boolean;
}

export const EditorSidebarModal: React.FC<EditorSidebarModalProps> = ({
  isOpen,
  mode,
  onClose,
  onCategoryClick,
  onPageClick,
  selectedCategory,
  initialAddTab,
  sectionBrowser,
  sectionInsertion,
  onOpenBrowseTemplates,
  generationVersionId,
  onSaveBeforeGenerate,
  isNonHomepage = false,
}) => {
  // If a category is selected, show section templates content
  if (selectedCategory) {
    return (
      <SidebarModal
        isOpen={isOpen}
        onClose={onClose}
        mode="add"
        title={selectedCategory.name}
      >
        {sectionBrowser?.isLoading ? (
          <SectionTemplatesLoading />
        ) : sectionBrowser?.error ? (
          <SectionTemplatesError 
            categoryName={selectedCategory.name}
            onRetry={sectionBrowser?.onRetry}
          />
        ) : (
          <SectionTemplatesContent
            categoryName={selectedCategory.name}
            categoryKey={selectedCategory.key}
            sections={sectionBrowser?.availableSections || []}
            loadingSections={sectionBrowser?.loadingSections || new Set()}
            onSectionClick={sectionBrowser?.onSectionClick}
          />
        )}
      </SidebarModal>
    );
  }

  // Otherwise show normal content based on mode
  return (
    <SidebarModal
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
    >
      {mode === 'customise' ? (
        <CustomiseContent
          onOpenBrowseTemplates={onOpenBrowseTemplates}
          generationVersionId={generationVersionId}
          onSaveBeforeGenerate={onSaveBeforeGenerate}
        />
      ) : (
        <AddContent
          onCategoryClick={onCategoryClick}
          onPageClick={onPageClick}
          onReplaceHeader={sectionInsertion?.handlers?.onReplaceHeader}
          onReplaceFooter={sectionInsertion?.handlers?.onReplaceFooter}
          loadingSections={sectionBrowser?.loadingSections}
          isNonHomepage={isNonHomepage}
          initialTab={initialAddTab}
          generationVersionId={generationVersionId}
        />
      )}

    </SidebarModal>
  );
};
