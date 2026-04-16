import React, { useEffect, useRef, useState } from 'react';
import { SidebarModal } from '../SidebarModal';
import { StreamingPanel } from '@/streaming/components/StreamingPanel';
import { Sparkles, X } from 'lucide-react';

/**
 * GeneratingSidebarModal: Sidebar modal for generation progress view
 * Can work as standalone modal or as overlay on top of sidebar
 */
export interface GeneratingSidebarModalProps {
  isOpen: boolean;
  generationStatus: any;
  isOverlay?: boolean; // If true, renders as overlay layer on top of sidebar
  onOpenModal?: () => void; // Function to open the modal (for the button)
  onCloseModal?: () => void; // Function to close the modal (for the close button)
  isManuallyOpened?: boolean; // If true, modal was opened via button click (show close button, don't auto-close)
}

/**
 * Magic/Sparkle AI button to reopen generation modal - shown at bottom left
 * Uses brand colors with reduced opacity
 */
const GenerationModalButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center group relative overflow-hidden"
      title="View Generation Progress"
      style={{
        width: '56px',
        height: '56px',
        bottom: '16px',
        left: '16px',
        zIndex: 9998, // Lower than sidebar modal (9999) and CheckingStatusOverlay (9999)
        position: 'fixed',
        backgroundColor: '#434775', // Primary brand color, no gradient
        opacity: 0.75, // Reduced opacity
        boxShadow: '0 4px 12px rgba(67, 71, 117, 0.3)',
        pointerEvents: 'auto',
      }}
    >
      {/* Sparkle icon */}
      <Sparkles 
        size={24} 
        className="relative z-10 group-hover:rotate-12 transition-transform duration-300"
        style={{
          filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.3))',
        }}
      />
    </button>
  );
};

export const GeneratingSidebarModal: React.FC<GeneratingSidebarModalProps> = ({
  isOpen,
  generationStatus,
  isOverlay = false,
  onOpenModal,
  onCloseModal,
  isManuallyOpened = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevIsOpenRef = useRef(isOpen);
  // Use ref to track if close button should be shown (persists during closing animation)
  const showCloseButtonRef = useRef(isManuallyOpened && !!onCloseModal);
  const [showCloseButton, setShowCloseButton] = useState(isManuallyOpened && !!onCloseModal);
  
  // Update ref and state when isManuallyOpened or onCloseModal changes
  // BUT: Don't hide button if we're currently closing OR if isOpen just became false with onCloseModal
  // (this preserves button during closing animation)
  useEffect(() => {
    const shouldShow = isManuallyOpened && !!onCloseModal;
    // If we're closing and have onCloseModal, preserve button
    // OR if isOpen is false but we have onCloseModal (just started closing), preserve button
    if ((isClosing || (prevIsOpenRef.current && !isOpen)) && !!onCloseModal) {
      // During closing, keep the ref true so button stays visible
      showCloseButtonRef.current = true;
      setShowCloseButton(true);
    } else {
      // Normal update
      showCloseButtonRef.current = shouldShow;
      setShowCloseButton(shouldShow);
    }
  }, [isManuallyOpened, onCloseModal, isClosing, isOpen]);

  // Handle delayed close: only auto-close if NOT manually opened
  // If manually opened, only close when onCloseModal is called
  useEffect(() => {
    // If isOpen changed from true to false, start closing sequence
    if (prevIsOpenRef.current === true && isOpen === false) {
      // Check if we had close button visible before closing started
      // (isManuallyOpened might be false now, but we want to preserve button during animation)
      const hadCloseButton = showCloseButtonRef.current || (prevIsOpenRef.current && isManuallyOpened);
      
      // Only auto-close if NOT manually opened (programmatic close)
      if (!isManuallyOpened && !hadCloseButton) {
        // Wait 1 second before starting the slide-down animation
        closeTimerRef.current = setTimeout(() => {
          setIsClosing(true);
          // After animation completes (600ms), hide the modal
          setTimeout(() => {
            setShouldRender(false);
            setIsClosing(false);
          }, 600);
        }, 500);
      } else {
        // Manually opened - close faster when manually closed (300ms instead of 600ms)
        // Keep close button visible during closing animation
        // If onCloseModal exists, it means this was manually opened - preserve button
        if (!!onCloseModal) {
          showCloseButtonRef.current = true;
          setShowCloseButton(true);
        }
        setIsClosing(true);
        // Don't hide close button immediately - keep it visible during animation
        setTimeout(() => {
          setShouldRender(false);
          setIsClosing(false);
          // Hide close button only after animation completes
          setTimeout(() => {
            setShowCloseButton(false);
            showCloseButtonRef.current = false;
          }, 50); // Small delay to ensure animation is complete
        }, 300); // Faster close for manual close
      }
    } 
    // If isOpen changed from false to true, immediately show
    else if (prevIsOpenRef.current === false && isOpen === true) {
      // Clear any pending close timer
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setIsClosing(false);
      setShouldRender(true);
      // Restore close button visibility if manually opened
      if (isManuallyOpened && onCloseModal) {
        setShowCloseButton(true);
        showCloseButtonRef.current = true;
      }
    }
    
    prevIsOpenRef.current = isOpen;
    
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, [isOpen, isManuallyOpened]);

  // Calculate sidebar width (same as SidebarModal)
  const getSidebarWidth = () => {
    const width = window.innerWidth;
    if (width >= 1598) return '320px';
    if (width >= 1398) return '290px';
    if (width >= 1198) return '274px';
    if (width >= 990) return '256px';
    if (width >= 638) return 'minmax(186px, 250px)';
    return '186px';
  };

  // If overlay mode, render as sliding overlay
  if (isOverlay) {
    // Don't render if we're not supposed to show it
    if (!shouldRender && !isClosing) {
      return (
        <>
          {/* Small button at bottom left to reopen modal when closed */}
          {onOpenModal && generationStatus && (
            <GenerationModalButton onClick={onOpenModal} />
          )}
        </>
      );
    }
    
    return (
      <>
        {/* Generation modal as overlay - slides up from bottom, slides down slowly when closing */}
        <div
          ref={modalRef}
          className="fixed bottom-0 left-0 bg-[var(--puck-color-grey-12,#f5f5f5)] border-r border-[var(--puck-color-grey-09,#e0e0e0)] z-[10000] flex flex-col overflow-hidden shadow-2xl transition-transform ease-out"
          style={{
            width: getSidebarWidth(),
            top: '51px',
            bottom: '0',
            height: 'calc(100vh - 51px)',
            transform: (!isClosing && shouldRender) ? 'translateY(0)' : 'translateY(100%)',
            transitionDuration: isClosing 
              ? (isManuallyOpened ? '300ms' : '600ms') // Faster for manual close, slower for auto-close
              : '300ms',
            pointerEvents: (!isClosing && shouldRender) ? 'auto' : 'none',
            backgroundColor: 'var(--puck-color-grey-12, #f5f5f5)',
            borderRight: '1px solid var(--puck-color-grey-09, #e0e0e0)',
            border: '1px solid var(--puck-color-grey-09, #e0e0e0)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--puck-color-grey-09,#e0e0e0)] bg-white flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 m-0">
              Building Your Website
            </h2>
            {/* Show close button only if manually opened and onCloseModal is provided */}
            {/* Keep button visible during closing animation for smoother transition */}
            {/* Use ref to ensure button stays visible even if props change during closing */}
            {(showCloseButton || showCloseButtonRef.current) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onCloseModal) {
                    onCloseModal();
                  }
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors flex items-center justify-center"
                title="Close"
                style={{
                  color: '#565656',
                  cursor: 'pointer',
                  opacity: isClosing ? 0.8 : 1, // Slight fade during closing
                  transition: 'opacity 0.3s ease-out',
                  pointerEvents: isClosing ? 'none' : 'auto', // Disable clicks during closing
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <StreamingPanel status={generationStatus} showErrorBanner={false} />
          </div>
        </div>

        {/* Small button at bottom left to reopen modal when closed */}
        {/* Only show if there's generation status to display and modal is fully closed */}
        {!shouldRender && !isClosing && onOpenModal && generationStatus && (
          <GenerationModalButton onClick={onOpenModal} />
        )}
      </>
    );
  }

  // Standalone mode (for generating state)
  return (
    <SidebarModal
      isOpen={isOpen}
      onClose={() => {}}
      mode="generating"
      hideClose={true}
    >
      <StreamingPanel status={generationStatus} showErrorBanner={false} />
    </SidebarModal>
  );
};
