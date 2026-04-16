import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useHeaderSections } from '@/hooks/api/PageBuilder/Editor/useHeaderSections';
import { useFooterSections } from '@/hooks/api/PageBuilder/Editor/useFooterSections';
import { SectionTemplatesLoading, SectionTemplatesError } from './SectionTemplatesContent';
import type { SectionMetadata } from '../../../SectionAddition.types';

interface ReplaceHeaderFooterContentProps {
  onReplaceHeader?: (section: SectionMetadata) => void;
  onReplaceFooter?: (section: SectionMetadata) => void;
  loadingSections?: Set<string>;
}

/**
 * Content for Replace Header / Replace Footer flows.
 * Fetches header and footer sections from dedicated catalog endpoints.
 * Uses sticky Header/Footer tabs at top, with section list matching Add Section UI.
 */
export const ReplaceHeaderFooterContent: React.FC<ReplaceHeaderFooterContentProps> = ({
  onReplaceHeader,
  onReplaceFooter,
  loadingSections = new Set(),
}) => {
  const [activeTab, setActiveTab] = useState<'header' | 'footer'>('header');

  const { data: headerSections = [], isLoading: isLoadingHeader, error: headerError } = useHeaderSections();
  const { data: footerSections = [], isLoading: isLoadingFooter, error: footerError } = useFooterSections();

  const isLoading = isLoadingHeader || isLoadingFooter;
  const error = headerError || footerError;

  if (isLoading) {
    return <SectionTemplatesLoading />;
  }
  if (error) {
    return (
      <SectionTemplatesError
        categoryName="header and footer sections"
        onRetry={() => window.location.reload()}
      />
    );
  }

  const sections = activeTab === 'header' ? headerSections : footerSections;
  const sectionLabel = activeTab === 'header' ? 'header' : 'footer';
  const onSelect = activeTab === 'header' ? onReplaceHeader : onReplaceFooter;

  return (
    <div className="flex flex-col h-full">
      {/* Sticky tabs at top - matches Add Section style */}
      <div className="shrink-0 sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="flex">
          <button
            onClick={() => setActiveTab('header')}
            className={`flex-1 px-3 py-3 text-xs font-medium transition-colors focus:outline-none focus:ring-0 ${
              activeTab === 'header'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Header
          </button>
          <button
            onClick={() => setActiveTab('footer')}
            className={`flex-1 px-3 py-3 text-xs font-medium transition-colors focus:outline-none focus:ring-0 ${
              activeTab === 'footer'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Footer
          </button>
        </div>
      </div>

      {/* Scrollable content - matches Add Section layout */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900 capitalize">{sectionLabel}</h3>
          <p className="text-xs text-gray-500">
            {sections.length} section{sections.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {sections.length > 0 ? (
          <div className="flex flex-col gap-3">
            {sections.map((section) => (
              <SectionPreviewCard
                key={section.section_id}
                section={section}
                isLoading={loadingSections.has(section.section_id)}
                onClick={() => onSelect?.(section)}
                label={activeTab === 'header' ? 'Use as header' : 'Use as footer'}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">
            No {sectionLabel} sections available.
          </p>
        )}
      </div>
    </div>
  );
};

const SectionPreviewCard: React.FC<{
  section: SectionMetadata;
  isLoading?: boolean;
  onClick?: () => void;
  label?: string;
}> = ({ section, isLoading, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isLoading}
    className="relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-[#8E94F2] hover:shadow-md transition-all text-left w-full group disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <div className="w-full aspect-video bg-gray-100 overflow-hidden relative">
      {section.preview_image_url ? (
        <img
          src={section.preview_image_url}
          alt={section.display_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-12 h-12 bg-gray-200 rounded" />
        </div>
      )}
      {/* Hover overlay with add icon - matches Add Section style */}
      <div className="absolute inset-0 bg-[#8E94F2]/0 group-hover:bg-[#8E94F2]/20 transition-colors flex items-center justify-center">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100">
          <Plus size={20} className="text-[#8E94F2]" />
        </div>
      </div>
    </div>
    <div className="p-3">
      <h4 className="text-sm font-medium text-gray-900 mb-1 group-hover:text-[#8E94F2] transition-colors">
        {section.display_name}
      </h4>
      {section.description && (
        <p className="text-xs text-gray-500 line-clamp-2">{section.description}</p>
      )}
      {label && (
        <p className="text-xs text-[#8E94F2] font-medium mt-1">{label}</p>
      )}
    </div>
    {isLoading && (
      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#8E94F2] border-t-transparent rounded-full animate-spin" />
      </div>
    )}
  </button>
);
