import { useState, useEffect, useRef } from 'react';

/**
 * Hook to manage checking status overlay visibility and fade-out timing
 * 
 * Shows overlay when checking starts, then fades out after a delay once checking completes.
 * This allows Puck to load in the background while the overlay is visible.
 * 
 * @param isCheckingStatus - Whether the status check is currently in progress
 * @returns Object with `showCheckingOverlay` and `isFadingOut` state
 */
export function useCheckingStatusOverlay(isCheckingStatus: boolean) {
  const [showCheckingOverlay, setShowCheckingOverlay] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const fadeOutStartTimeoutRef = useRef<NodeJS.Timeout>();
  const fadeOutCompleteTimeoutRef = useRef<NodeJS.Timeout>();
  const previousCheckingStatusRef = useRef<boolean>(false);

  // Timing constants
  const FADEOUT_DELAY = 500; // Wait 0.5 seconds before starting fadeout
  const FADEOUT_DURATION = 1000; // Fadeout animation takes 1.0 seconds

  // Handle checking state transitions
  useEffect(() => {
    // When checking starts, show overlay
    if (isCheckingStatus) {
      setShowCheckingOverlay(true);
      setIsFadingOut(false);
      previousCheckingStatusRef.current = true;
      
      // Clear any existing timeouts
      if (fadeOutStartTimeoutRef.current) {
        clearTimeout(fadeOutStartTimeoutRef.current);
      }
      if (fadeOutCompleteTimeoutRef.current) {
        clearTimeout(fadeOutCompleteTimeoutRef.current);
      }
    } 
    // When checking completes (transitions from true to false)
    else if (previousCheckingStatusRef.current && !isCheckingStatus) {
      // Clear any existing timeouts
      if (fadeOutStartTimeoutRef.current) {
        clearTimeout(fadeOutStartTimeoutRef.current);
      }
      if (fadeOutCompleteTimeoutRef.current) {
        clearTimeout(fadeOutCompleteTimeoutRef.current);
      }
      
      // Wait before starting fadeout
      fadeOutStartTimeoutRef.current = setTimeout(() => {
        // Start fadeout animation
        setIsFadingOut(true);
        
        // After fadeout animation completes, hide overlay completely
        fadeOutCompleteTimeoutRef.current = setTimeout(() => {
          setShowCheckingOverlay(false);
          setIsFadingOut(false);
        }, FADEOUT_DURATION);
      }, FADEOUT_DELAY);
      
      previousCheckingStatusRef.current = false;
    }

    return () => {
      if (fadeOutStartTimeoutRef.current) {
        clearTimeout(fadeOutStartTimeoutRef.current);
      }
      if (fadeOutCompleteTimeoutRef.current) {
        clearTimeout(fadeOutCompleteTimeoutRef.current);
      }
    };
  }, [isCheckingStatus, FADEOUT_DELAY, FADEOUT_DURATION]);

  return {
    showCheckingOverlay,
    isFadingOut,
  };
}
