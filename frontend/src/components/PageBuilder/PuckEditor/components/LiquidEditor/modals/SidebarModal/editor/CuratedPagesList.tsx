import React from 'react';
import type { CuratedPageOption } from '@/hooks/api/PageBuilder/Editor/useCuratedPages';

interface CuratedPagesListProps {
  pages: CuratedPageOption[];
  onPageClick: (page: CuratedPageOption) => void;
}

const STACK_PREVIEW_WIDTH = 200;

export const CuratedPagesList: React.FC<CuratedPagesListProps> = ({
  pages,
  onPageClick,
}) => {
  return (
    <div className="p-4 overflow-y-auto h-full">
      <div className="grid grid-cols-1 gap-4">
        {pages.map((page) => {
          // Show the first desktop screenshot as a preview if available
          const previewUrl = page.section_desktop_urls?.[0];

          return (
            <button
              key={page.page_path}
              onClick={() => onPageClick(page)}
              className="w-full flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md hover:bg-gray-50/50 text-left group transition-colors focus:outline-none focus:ring-0"
            >
              <div className="flex justify-center w-full">
                {previewUrl ? (
                  <div className="w-full h-32 rounded-lg border border-gray-100 overflow-hidden bg-gray-50">
                    <img
                      src={previewUrl}
                      alt={page.page_title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center">
                    <span className="text-gray-400 text-xs text-center px-2">
                      {page.section_ids.length} sections
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-0.5 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                  {page.page_title}
                </h3>
                <p className="text-[10px] text-gray-500 font-mono truncate">
                  {page.page_path}
                </p>
              </div>

              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                  {page.section_ids.length} Sections
                </span>
                <span className="text-indigo-600 text-xs font-semibold group-hover:translate-x-0.5 transition-transform">
                  Add Page →
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {pages.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-gray-500">No curated pages found.</p>
        </div>
      )}
    </div>
  );
};

export default CuratedPagesList;
