import React, { useCallback } from 'react';
import type { SectionMetadata, SectionTemplatesContentProps } from '../../../SectionAddition.types';
import { Package, AlertCircle, Plus } from 'lucide-react';

/**
 * SectionTemplatesContent displays a grid of clickable section templates.
 * When a section is clicked, it triggers onSectionClick which opens 
 * the position selector popup.
 */
export const SectionTemplatesContent: React.FC<SectionTemplatesContentProps> = ({
  categoryName,
  categoryKey,
  sections = [],
  loadingSections = new Set(),
  onSectionClick,
}) => {
  // Filter sections by category if categoryKey is provided
  const displaySections = categoryKey
    ? sections.filter((section) => section.category_key === categoryKey)
    : sections;

  // Check if a section is currently loading
  const isLoading = useCallback((sectionId: string) => {
    return loadingSections.has(sectionId);
  }, [loadingSections]);

  // Handle section card click
  const handleSectionClick = useCallback((section: SectionMetadata) => {
    if (isLoading(section.section_id)) return;
    if (onSectionClick) {
      onSectionClick(section);
    } else {
      console.error('[SectionTemplatesContent] onSectionClick is undefined!');
    }
  }, [isLoading, onSectionClick]);

  return (
    <div className="p-4">
      {/* Category header with count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">
          {displaySections.length} section{displaySections.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Clickable section cards */}
      <div className="flex flex-col gap-3">
        {displaySections.map((section) => (
          <SectionPreviewCard
            key={section.section_id}
            section={section}
            isLoading={isLoading(section.section_id)}
            onClick={() => handleSectionClick(section)}
          />
        ))}
      </div>

      {/* Help text */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Tip:</strong> Click a section to add it to your page. 
          You'll be able to choose where to insert it.
        </p>
      </div>
    </div>
  );
};

/**
 * Section preview card with image and description - now clickable
 */
const SectionPreviewCard: React.FC<{
  section: SectionMetadata;
  isLoading?: boolean;
  onClick?: () => void;
}> = ({ section, isLoading, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isLoading}
    className="relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-[#8E94F2] hover:shadow-md transition-all text-left w-full group disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {/* Preview image */}
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
      
      {/* Hover overlay with add icon */}
      <div className="absolute inset-0 bg-[#8E94F2]/0 group-hover:bg-[#8E94F2]/20 transition-colors flex items-center justify-center">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100">
          <Plus size={20} className="text-[#8E94F2]" />
        </div>
      </div>
    </div>
    
    {/* Section info */}
    <div className="p-3">
      <h4 className="text-sm font-medium text-gray-900 mb-1 group-hover:text-[#8E94F2] transition-colors">
        {section.display_name}
      </h4>
      
      {/* Description */}
      {section.description && (
        <p className="text-xs text-gray-500 line-clamp-2">
          {section.description}
        </p>
      )}
    </div>
    
    {/* Loading overlay */}
    {isLoading && (
      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#8E94F2] border-t-transparent rounded-full animate-spin" />
      </div>
    )}
  </button>
);

/**
 * Empty state when no sections are available for a category
 */
const _EmptyState: React.FC<{ categoryName: string }> = ({ categoryName }) => (
  <div className="p-8 text-center">
    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
      <Package size={24} className="text-gray-400" />
    </div>
    <h3 className="text-sm font-medium text-gray-900 mb-1">
      No sections available
    </h3>
    <p className="text-xs text-gray-500 max-w-[200px] mx-auto">
      No {categoryName.toLowerCase()} sections are available in the current template.
    </p>
  </div>
);

/**
 * Error state when sections fail to load
 */
export const SectionTemplatesError: React.FC<{ 
  categoryName: string; 
  onRetry?: () => void;
}> = ({ categoryName, onRetry }) => (
  <div className="p-8 text-center">
    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
      <AlertCircle size={24} className="text-red-500" />
    </div>
    <h3 className="text-sm font-medium text-gray-900 mb-1">
      Failed to load sections
    </h3>
    <p className="text-xs text-gray-500 max-w-[200px] mx-auto mb-3">
      Unable to load {categoryName.toLowerCase()} sections. Please try again.
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="text-xs text-[#8E94F2] hover:text-[#7c82e6] font-medium"
      >
        Retry
      </button>
    )}
  </div>
);

/**
 * Loading state while sections are being fetched
 */
export const SectionTemplatesLoading: React.FC = () => (
  <div className="p-4">
    <div className="grid grid-cols-1 gap-3">
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse"
        >
          <div className="w-full aspect-video bg-gray-200" />
          <div className="p-3">
            <div className="w-3/4 h-4 bg-gray-200 rounded mb-2" />
            <div className="w-full h-3 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default SectionTemplatesContent;
