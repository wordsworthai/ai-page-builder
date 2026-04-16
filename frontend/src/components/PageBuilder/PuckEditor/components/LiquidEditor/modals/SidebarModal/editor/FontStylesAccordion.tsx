import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const FontStylesAccordion: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white hover:bg-gray-50 flex items-center justify-between transition-colors focus:outline-none focus:ring-0"
      >
        <span className="text-sm font-semibold text-gray-900">Font styles</span>
        {isOpen ? (
          <ChevronUp size={20} className="text-gray-600" />
        ) : (
          <ChevronDown size={20} className="text-gray-600" />
        )}
      </button>
      
      {isOpen && (
        <div className="bg-white border-t border-gray-200 px-4 py-3">
          <p className="text-sm text-gray-500">Coming Soon</p>
        </div>
      )}
    </div>
  );
};

export default FontStylesAccordion;

