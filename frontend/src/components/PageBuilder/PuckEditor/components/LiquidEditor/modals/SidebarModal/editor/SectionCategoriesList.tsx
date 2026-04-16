import React, { useState } from 'react';
import type { CategoryResponse } from '@/hooks/api/PageBuilder/Editor/useCategories';

interface SectionCategoriesListProps {
  categories: CategoryResponse[];
  onCategoryClick: (category: CategoryResponse) => void;
}

export const SectionCategoriesList: React.FC<SectionCategoriesListProps> = ({
  categories,
  onCategoryClick,
}) => {
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);

  const handleCategoryClick = (category: CategoryResponse) => {
    setSelectedCategoryKey(category.key);
    onCategoryClick(category);
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 gap-3">
        {categories.map((category) => {
          const isSelected = selectedCategoryKey === category.key;
          return (
            <button
              key={category.key}
              onClick={() => handleCategoryClick(category)}
              className={`w-full p-4 bg-white rounded-lg hover:shadow-sm transition-all text-left group focus:outline-none focus:ring-0 ${
                isSelected
                  ? 'border-2 border-[#8E94F2] ring-2 ring-[#8E94F2]'
                  : 'border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  {category.name}
                </h3>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {category.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SectionCategoriesList;

