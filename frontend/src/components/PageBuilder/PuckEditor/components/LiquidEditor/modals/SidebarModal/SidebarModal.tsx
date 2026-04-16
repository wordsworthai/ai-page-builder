import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export type SidebarModalMode = 'customise' | 'add' | 'generating';

export type SidebarModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  mode?: SidebarModalMode;
  /** Hide close button (useful for generating mode) */
  hideClose?: boolean;
};

export const SidebarModal: React.FC<SidebarModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  mode = 'customise',
  hideClose = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape key (but not during generation)
  useEffect(() => {
    if (!isOpen || mode === 'generating') return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, mode]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Calculate sidebar width based on viewport
  const getSidebarWidth = () => {
    const width = window.innerWidth;
    if (width >= 1598) return '320px';
    if (width >= 1398) return '290px';
    if (width >= 1198) return '274px';
    if (width >= 990) return '256px';
    if (width >= 638) return 'minmax(186px, 250px)';
    return '186px';
  };

  // Get default title based on mode
  const getDefaultTitle = () => {
    switch (mode) {
      case 'generating':
        return 'Building Your Website';
      case 'add':
        return 'Add Components';
      case 'customise':
      default:
        return 'Customise Your Page';
    }
  };

  return (
    <>
      {/* Sidebar Modal */}
      <div
        ref={modalRef}
        className="fixed bottom-0 left-0 bg-[var(--puck-color-grey-12,#f5f5f5)] border-r border-[var(--puck-color-grey-09,#e0e0e0)] z-[9999] flex flex-col overflow-hidden shadow-2xl transition-transform duration-300 ease-out"
        style={{
          width: getSidebarWidth(),
          top: '51px',
          bottom: '0',
          height: 'calc(100vh - 51px)',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          pointerEvents: isOpen ? 'auto' : 'none',
          backgroundColor: 'var(--puck-color-grey-12, #f5f5f5)',
          borderRight: '1px solid var(--puck-color-grey-09, #e0e0e0)',
          border: '1px solid var(--puck-color-grey-09, #e0e0e0)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--puck-color-grey-09,#e0e0e0)] bg-white flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 m-0">
            {title || getDefaultTitle()}
          </h2>
          {!hideClose && mode !== 'generating' && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Close"
            >
              <X size={16} className="text-gray-600" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
};