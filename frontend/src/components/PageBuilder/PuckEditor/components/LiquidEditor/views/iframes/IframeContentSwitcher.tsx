import React from 'react';
import CustomIframeOverride from './CustomIframeOverride';
import type { IframeContentType } from '../../hooks';
import puckCss from '@measured/puck/puck.css?inline';

/**
 * Determines if the blur overlay should be shown on top of the iframe content.
 * 
 * The blur overlay is shown in the following cases:
 * 1. 'generating' - During active generation (shows crafting animation)
 * 2. 'partial' - When partial template is loaded (intermediate state during generation)
 * 3. 'final' - When final template is loaded (before fade-out transition)
 * 4. updateTemplateGenerationOverlayOverride=true - When updating existing template (partial autopop)
 *    This allows showing overlay on current template while new generation is processing
 */
function shouldShowBlurOverlay(
  contentType: IframeContentType,
  updateTemplateGenerationOverlayOverride: boolean
): boolean {
  return (
    contentType === 'generating' ||
    contentType === 'partial' ||
    contentType === 'final' ||
    updateTemplateGenerationOverlayOverride
  );
}

/**
 * Determines if the generating animation should be shown on top of the blur overlay.
 * 
 * The animation is shown in the following cases:
 * 1. 'generating' - Always show during active generation
 * 2. 'partial' - Always show when partial template is displayed
 * 3. 'final' + !isDirectLoad - Show when final template loads from generation flow
 *    (not from direct navigation like checking → final)
 * 4. updateTemplateGenerationOverlayOverride=true - Show when updating existing template
 *    (allows animation on current template during partial autopop)
 * 
 * Note: Animation is NOT shown for direct loads (checking → final) to avoid
 * showing crafting animation when user navigates directly to completed generation.
 */
function shouldShowAnimation(
  contentType: IframeContentType,
  isDirectLoad: boolean,
  updateTemplateGenerationOverlayOverride: boolean
): boolean {
  return (
    contentType === 'generating' ||
    contentType === 'partial' ||
    (contentType === 'final' && !isDirectLoad) ||
    updateTemplateGenerationOverlayOverride
  );
}

/**
 * Determines if the blur overlay should start fading out.
 * 
 * Fade-out occurs in the following case:
 * - 'final' + !updateTemplateGenerationOverlayOverride - When final template is loaded
 *   and there's no active update generation, start fading out the overlay
 *   to reveal the final template smoothly.
 * 
 * Fade-out does NOT occur when:
 * - updateTemplateGenerationOverlayOverride=true - Keep overlay visible during update generation
 * - contentType is 'generating' or 'partial' - Overlay stays fully visible
 * - isDirectLoad=true - Direct loads don't need fade-out (no overlay was shown)
 */
function shouldFadeOutOverlay(
  contentType: IframeContentType,
  updateTemplateGenerationOverlayOverride: boolean
): boolean {
  return contentType === 'final' && !updateTemplateGenerationOverlayOverride;
}

interface IframeContentSwitcherProps {
  contentType: IframeContentType;
  // When true, shows overlay and animation for update generation (updating existing template)
  updateTemplateGenerationOverlayOverride?: boolean;
  // Puck props
  children?: React.ReactNode;
  document?: Document;
  // True if this is a direct template load (checking → final), not from generation flow.
  // This is computed by useIframeContent based on actual generation events.
  isDirectLoad?: boolean;
}

/**
 * Switches between different iframe content types.
 * 
 * IMPORTANT: Always renders the SAME CustomIframeOverride component with different props.
 * This prevents React from unmounting/remounting when contentType changes,
 * eliminating flicker during transitions (generating → partial → final).
 * 
 * The only exception is 'loading' state which shows a different component.
 * 
 * MEMOIZED: Ignores children prop changes to prevent remounts when Puck updates.
 * Children are passed through but don't trigger remounts.
 */
export const IframeContentSwitcher: React.FC<IframeContentSwitcherProps> = React.memo(({
  contentType,
  updateTemplateGenerationOverlayOverride = false,
  children,
  document,
  isDirectLoad = false,
}) => {
  // Compute overlay and animation states using helper functions
  const showBlurOverlay = shouldShowBlurOverlay(contentType, updateTemplateGenerationOverlayOverride);
  const showAnimation = shouldShowAnimation(contentType, isDirectLoad, updateTemplateGenerationOverlayOverride);
  const shouldFadeOut = shouldFadeOutOverlay(contentType, updateTemplateGenerationOverlayOverride);
  
  return (
    <CustomIframeOverride
      key="custom-iframe-override"
      document={document}
      puckCss={puckCss}
      showBlurOverlay={showBlurOverlay}
      showAnimation={showAnimation}
      shouldFadeOut={shouldFadeOut}
      isDirectLoad={isDirectLoad}
      updateTemplateGenerationOverlayOverride={updateTemplateGenerationOverlayOverride}
    >
      {children}
    </CustomIframeOverride>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: Only re-render if meaningful props change
  // Ignore children changes (they change on every Puck update but don't affect our logic)
  return (
    prevProps.contentType === nextProps.contentType &&
    prevProps.isDirectLoad === nextProps.isDirectLoad &&
    prevProps.updateTemplateGenerationOverlayOverride === nextProps.updateTemplateGenerationOverlayOverride &&
    prevProps.document === nextProps.document
    // Intentionally NOT comparing children - they change frequently but don't affect our rendering logic
  );
});
