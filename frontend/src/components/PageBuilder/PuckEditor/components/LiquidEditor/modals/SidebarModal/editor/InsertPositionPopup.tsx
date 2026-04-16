import React, { useState, useCallback } from 'react';
import { X, ChevronDown, Plus } from 'lucide-react';
import type { 
  CurrentSection, 
  InsertPositionPopupProps
} from '../../../SectionAddition.types';

/**
 * Calculate sidebar width based on viewport (matches SidebarModal)
 */
const getSidebarWidth = () => {
  const width = window.innerWidth;
  if (width >= 1598) return '320px';
  if (width >= 1398) return '290px';
  if (width >= 1198) return '274px';
  if (width >= 990) return '256px';
  if (width >= 638) return '250px';
  return '186px';
};

/**
 * InsertPositionPopup shows a modal for selecting where to insert a new section.
 * Displays current sections and allows inserting at top or after any existing section.
 */
export const InsertPositionPopup: React.FC<InsertPositionPopupProps> = ({
  isOpen,
  onClose,
  selectedSection,
  currentSections,
  onInsert,
  isInserting = false,
}) => {
  // Selected position: 0 = top, 1 = after section 0, 2 = after section 1, etc.
  const [selectedPosition, setSelectedPosition] = useState<number>(currentSections.length);

  // Handle insert button click
  const handleInsert = useCallback(() => {
    if (!selectedSection || isInserting) return;
    onInsert(selectedSection.section_id, selectedPosition);
  }, [selectedSection, selectedPosition, onInsert, isInserting]);

  // Removed backdrop click handler since popup fills entire sidebar

  if (!isOpen || !selectedSection) return null;

  return (
    <div 
      className="fixed left-0 z-[10000] flex flex-col bg-[var(--puck-color-grey-12,#f5f5f5)]"
      style={{
        width: getSidebarWidth(),
        top: '51px',
        height: 'calc(100vh - 51px)',
      }}
    >
      <div className="bg-white w-full h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-4 border-b border-gray-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Add Section
              </h3>
              <p className="text-sm text-gray-500 truncate" title={`Choose where to insert "${selectedSection.display_name}"`}>
                Choose where to insert "{selectedSection.display_name}"
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isInserting}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Position options - scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-2">
            {/* Insert at top option */}
            <PositionOption
              label="At the top"
              description="Before all sections"
              isSelected={selectedPosition === 0}
              onClick={() => setSelectedPosition(0)}
              disabled={isInserting}
            />

            {/* Insert after each section */}
            {currentSections.map((section, index) => (
              <PositionOption
                key={section.id}
                label={`After ${section.displayName}`}
                description={`Position ${index + 2}`}
                isSelected={selectedPosition === index + 1}
                onClick={() => setSelectedPosition(index + 1)}
                disabled={isInserting}
                sectionPreview={section}
              />
            ))}

            {/* If no sections, show empty state */}
            {currentSections.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No sections in template yet.</p>
                <p className="text-xs mt-1">This will be the first section.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 px-4 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isInserting}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            disabled={isInserting}
            className="px-5 py-2 text-sm font-medium text-white bg-[#8E94F2] hover:bg-[#7c82e6] rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isInserting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Add Section</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Individual position option in the list
 */
const PositionOption: React.FC<{
  label: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
  sectionPreview?: CurrentSection;
}> = ({ label, description, isSelected, onClick, disabled, sectionPreview }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
      isSelected
        ? 'border-[#8E94F2] bg-[#8E94F2]/5'
        : 'border-gray-200 hover:border-gray-300 bg-white'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <div className="flex items-center gap-3">
      {/* Radio indicator */}
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
        isSelected ? 'border-[#8E94F2]' : 'border-gray-300'
      }`}>
        {isSelected && (
          <div className="w-2.5 h-2.5 rounded-full bg-[#8E94F2]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className={`text-sm font-medium truncate ${
          isSelected ? 'text-[#8E94F2]' : 'text-gray-900'
        }`} title={label}>
          {label}
        </p>
        <p className="text-xs text-gray-500 truncate" title={description}>
          {description}
        </p>
      </div>

      {/* Arrow indicator */}
      <ChevronDown 
        size={16} 
        className={`flex-shrink-0 transform rotate-[-90deg] ${
          isSelected ? 'text-[#8E94F2]' : 'text-gray-400'
        }`} 
      />
    </div>
  </button>
);

export default InsertPositionPopup;
