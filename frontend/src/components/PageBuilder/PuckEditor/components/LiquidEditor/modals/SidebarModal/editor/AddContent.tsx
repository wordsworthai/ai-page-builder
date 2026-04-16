import React, { useState, useEffect } from 'react';
import { SectionCategoriesList } from './SectionCategoriesList';
import { useCategories, type CategoryResponse } from '@/hooks/api/PageBuilder/Editor/useCategories';
import { SectionTemplatesLoading, SectionTemplatesError } from './SectionTemplatesContent';
import { useCuratedPages, type CuratedPageOption } from '@/hooks/api/PageBuilder/Editor/useCuratedPages';
import { CuratedPagesList } from './CuratedPagesList';
import { CreditConfirmationModal } from './CreditConfirmationModal';
import { ReplaceHeaderFooterContent } from './ReplaceHeaderFooterContent';
import type { SectionMetadata } from '../../../SectionAddition.types';

interface AddContentProps {
  onCategoryClick?: (category: CategoryResponse) => void;
  onPageClick?: (page: CuratedPageOption) => void;
  onReplaceHeader?: (section: SectionMetadata) => void;
  onReplaceFooter?: (section: SectionMetadata) => void;
  loadingSections?: Set<string>;
  /** When true, hide Header & Footer tab (non-homepage pages) */
  isNonHomepage?: boolean;
  /** Initial tab when opening (e.g. headerFooter when Replace action opens sidebar) */
  initialTab?: 'page' | 'section' | 'headerFooter';
  /** Current generation version ID (for billing return origin) */
  generationVersionId?: string;
}

export const AddContent: React.FC<AddContentProps> = ({
  onCategoryClick,
  onPageClick,
  onReplaceHeader,
  onReplaceFooter,
  loadingSections = new Set(),
  isNonHomepage = false,
  initialTab = 'section',
  generationVersionId,
}) => {
  const [activeTab, setActiveTab] = useState<'page' | 'section' | 'headerFooter'>(initialTab);
  const [selectedPage, setSelectedPage] = useState<CuratedPageOption | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab ?? 'section');
  }, [initialTab]);

  useEffect(() => {
    if (isNonHomepage && activeTab === 'headerFooter') {
      setActiveTab('section');
    }
  }, [isNonHomepage, activeTab]);
  const { data: categories = [], isLoading: isLoadingCategories, error: categoriesError } = useCategories();
  const { data: curatedPagesData, isLoading: isLoadingPages, error: pagesError } = useCuratedPages();

  const handleCategoryClick = (category: CategoryResponse) => {
    if (onCategoryClick) {
      onCategoryClick(category);
    }
  };

  const handlePageClick = (page: CuratedPageOption) => {
    setSelectedPage(page);
    setShowCreditModal(true);
  };

  const handleCreditConfirm = () => {
    setShowCreditModal(false);
    if (selectedPage && onPageClick) {
      onPageClick(selectedPage);
    }
    setSelectedPage(null);
  };

  const handleCreditModalClose = () => {
    setShowCreditModal(false);
    setSelectedPage(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs - Section first (most common), Header & Footer, Page last. No "Add" prefix (modal title is "Add Components") */}
      <div className="shrink-0 border-b border-gray-200 bg-white">
        <div className="flex">
          <button
            onClick={() => setActiveTab('section')}
            className={`flex-1 px-3 py-3 text-xs font-medium transition-colors focus:outline-none focus:ring-0 ${activeTab === 'section'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Section
          </button>
          {!isNonHomepage && (
            <button
              onClick={() => setActiveTab('headerFooter')}
              className={`flex-1 px-3 py-3 text-xs font-medium transition-colors focus:outline-none focus:ring-0 ${activeTab === 'headerFooter'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Header & Footer
            </button>
          )}
          <button
            onClick={() => setActiveTab('page')}
            className={`flex-1 px-3 py-3 text-xs font-medium transition-colors focus:outline-none focus:ring-0 ${activeTab === 'page'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Page
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'headerFooter' && !isNonHomepage ? (
          <ReplaceHeaderFooterContent
            onReplaceHeader={onReplaceHeader}
            onReplaceFooter={onReplaceFooter}
            loadingSections={loadingSections}
          />
        ) : activeTab === 'section' ? (
          isLoadingCategories ? (
            <SectionTemplatesLoading />
          ) : categoriesError ? (
            <SectionTemplatesError
              categoryName="categories"
              onRetry={() => window.location.reload()}
            />
          ) : (
            <SectionCategoriesList
              categories={categories}
              onCategoryClick={handleCategoryClick}
            />
          )
        ) : (
          isLoadingPages ? (
            <SectionTemplatesLoading />
          ) : pagesError ? (
            <SectionTemplatesError
              categoryName="curated pages"
              onRetry={() => window.location.reload()}
            />
          ) : (
            <CuratedPagesList
              pages={curatedPagesData?.pages || []}
              onPageClick={handlePageClick}
            />
          )
        )}
      </div>
      <CreditConfirmationModal
        open={showCreditModal}
        onClose={handleCreditModalClose}
        actionType="add_page"
        onConfirm={handleCreditConfirm}
        returnOrigin={
          generationVersionId
            ? { path: `/editor/${generationVersionId}`, context: { action: 'add_page' } }
            : undefined
        }
      />
    </div>
  );
};

export default AddContent;

