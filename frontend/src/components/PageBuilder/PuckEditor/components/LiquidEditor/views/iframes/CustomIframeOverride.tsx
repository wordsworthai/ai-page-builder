import React, { useEffect, useState } from 'react';

interface CustomIframeOverrideProps {
  children: React.ReactNode;
  document?: Document;
  puckCss?: string;
  /** Show blur overlay on top of content */
  showBlurOverlay?: boolean;
  /** Show generating animation on top of blur overlay */
  showAnimation?: boolean;
  /** When true, overlay starts fading out immediately using CSS transitions */
  shouldFadeOut?: boolean;
  /** When true, this is a direct template load (checking → final), not from generation flow */
  isDirectLoad?: boolean;
  // When true, this is an update template generation (updating existing template)
  //Shows animation even if isDirectLoad is true and changes text.
  updateTemplateGenerationOverlayOverride?: boolean;
}

export const CustomIframeOverride = ({
  children, 
  document, 
  puckCss,
  showBlurOverlay = false,
  showAnimation = false,
  shouldFadeOut = false,
  isDirectLoad = false,
  updateTemplateGenerationOverlayOverride = false,
}: CustomIframeOverrideProps) => {
  // Determine if we should actually show animation:
  // - Only show animation if showAnimation prop is true AND
  // - This is NOT a direct load (meaning we came from generating/partial, not checking → final)
  // - OR if this is an update generation overlay override.
  const shouldShowAnimation = showAnimation && (!isDirectLoad || updateTemplateGenerationOverlayOverride);
  
  // State to manage fade-out transition
  const [isOverlayVisible, setIsOverlayVisible] = useState(showBlurOverlay);
  const [isFadingOut, setIsFadingOut] = useState(false);
  // State to manage content fade-in (for smooth cross-fade effect)
  const [contentOpacity, setContentOpacity] = useState(shouldFadeOut ? 0 : 1);

  // Timing constants based on whether we're coming from generation or direct load
  // Direct load: faster fade since no animation to transition
  // From generation: slower fade for smooth animation transition
  const fadeDelay = isDirectLoad ? 300 : 800; // ms before fade starts
  const fadeDuration = isDirectLoad ? 1000 : 2000; // ms for fade transition

  // Handle overlay visibility and fade-out
  useEffect(() => {
    if (showBlurOverlay) {
      // Show overlay immediately
      setIsOverlayVisible(true);
      
      // If shouldFadeOut is true, start fading out after a delay
      if (shouldFadeOut) {
        // Start with content hidden, then fade in alongside blur fade-out
        setContentOpacity(0);
        
        // Delay to let final template render and settle before starting fade
        const fadeTimer = setTimeout(() => {
          setIsFadingOut(true);
          // Start content fade-in slightly before blur fade starts completing
          setContentOpacity(1);
        }, fadeDelay);
        return () => clearTimeout(fadeTimer);
      } else {
        // Keep overlay fully visible, content visible
        setIsFadingOut(false);
        setContentOpacity(1);
      }
    } else {
      // If showBlurOverlay becomes false, start fade-out transition
      if (isOverlayVisible && !isFadingOut) {
        setIsFadingOut(true);
        setContentOpacity(1);
        // Keep overlay in DOM during transition, remove after fade completes
        const removeTimer = setTimeout(() => {
          setIsOverlayVisible(false);
          setIsFadingOut(false);
        }, fadeDuration);
        return () => clearTimeout(removeTimer);
      }
    }
  }, [showBlurOverlay, shouldFadeOut, isOverlayVisible, isFadingOut, fadeDelay, fadeDuration]);
  useEffect(() => {
    if (document) {
      // Append styles idempotently to the existing <head> instead of replacing it.
      // Replacing the <head> destroys style elements injected by AutoFrame's CopyHostStyles,
      // which prevents their onload handlers from firing and keeps stylesLoaded stuck at false.
      const injectStyles = () => {
        try {
          const head = document.head;
          if (!head) return;

          // Add charset meta tag if not present
          if (!head.querySelector('meta[charset]')) {
            const meta = document.createElement('meta');
            meta.setAttribute('charset', 'utf-8');
            head.appendChild(meta);
          }

          // Add viewport meta tag if not present
          if (!head.querySelector('meta[name="viewport"]')) {
            const viewport = document.createElement('meta');
            viewport.setAttribute('name', 'viewport');
            viewport.setAttribute('content', 'width=device-width, initial-scale=1');
            head.appendChild(viewport);
          }

          // Add isolation styles if not present
          if (!document.getElementById('weditor-iframe-isolation-styles')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'weditor-iframe-isolation-styles';
            styleElement.textContent = `
              body, html {
                margin: 0 !important;
                padding: 0 !important;
                font-family: inherit !important;
                background-color: transparent !important;
                border: none !important;
                overflow: visible !important;
              }
              
              /* Ensure Puck components use our design system */
              [data-puck-component] {
                font-family: inherit !important;
                font-size: inherit !important;
                line-height: inherit !important;
                color: inherit !important;
                background: transparent !important;
              }
              
              /* Override any conflicting Puck styles */
              .puck-component, .puck-editor, .puck-preview {
                font-family: inherit !important;
                background: transparent !important;
              }
            `;
            head.appendChild(styleElement);
          }

          // Inject Puck's Core CSS if not present
          if (puckCss && !document.getElementById('puck-core-styles')) {
            const puckStyle = document.createElement('style');
            puckStyle.id = 'puck-core-styles';
            puckStyle.textContent = puckCss;
            head.appendChild(puckStyle);
          }

          // Inject Tailwind CDN script if not present
          // Uses the same ID as injectTailwindResponsive.ts to avoid duplicates
          if (!document.getElementById('tailwind-cdn-script')) {
            const tailwindScript = document.createElement('script');
            tailwindScript.id = 'tailwind-cdn-script';
            tailwindScript.src = 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4';
            tailwindScript.defer = false;
            head.appendChild(tailwindScript);
          }
        } catch (e) {
          console.error('Error injecting iframe styles:', e);
        }
      };

      injectStyles();

      // Re-run after a delay to survive CopyHostStyles clearing the iframe head
      // with `doc.head.innerHTML = ""`. This is safe because injectStyles is
      // idempotent — it checks element IDs before adding anything.
      const retryTimer = setTimeout(injectStyles, 500);

      return () => {
        clearTimeout(retryTimer);
      };
    }
  }, [document, puckCss]);
  
  return (
    <>
      {/* Content wrapper with fade-in transition for smooth reveal */}
      <div
        style={{
          opacity: contentOpacity,
          transition: shouldFadeOut ? `opacity ${isDirectLoad ? '0.8s' : '1.8s'} ease-in-out` : 'none',
        }}
      >
        {children}
      </div>
      {isOverlayVisible && (
        <div
          id="blur-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            pointerEvents: isFadingOut ? 'none' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isFadingOut ? 'rgba(241, 245, 249, 0)' : 'rgba(241, 245, 249, 0.70)',
            backdropFilter: isFadingOut ? 'blur(0px)' : 'blur(6px)',
            WebkitBackdropFilter: isFadingOut ? 'blur(0px)' : 'blur(6px)',
            opacity: isFadingOut ? 0 : 1,
            // Faster transitions for direct load, slower for generation flow
            transition: isDirectLoad
              ? 'opacity 1s ease-in-out, backdrop-filter 0.8s ease-in-out, -webkit-backdrop-filter 0.8s ease-in-out, background-color 1s ease-in-out'
              : 'opacity 2s ease-in-out, backdrop-filter 1.5s ease-in-out, -webkit-backdrop-filter 1.5s ease-in-out, background-color 2s ease-in-out',
          }}
        >
          {shouldShowAnimation && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', position: 'relative' }}>
              {/* Inject keyframe animations - only looping animations, no entrance animations */}
              <style>
                {`
                  @keyframes pulse {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 1; }
                  }
                  @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    25% { transform: translateY(-6px) rotate(0.5deg); }
                    50% { transform: translateY(-10px) rotate(0deg); }
                    75% { transform: translateY(-6px) rotate(-0.5deg); }
                  }
                  @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                  }
                  @keyframes orbit1 {
                    0% { transform: rotate(0deg) translateX(180px) rotate(0deg); }
                    100% { transform: rotate(360deg) translateX(180px) rotate(-360deg); }
                  }
                  @keyframes orbit2 {
                    0% { transform: rotate(120deg) translateX(200px) rotate(-120deg); }
                    100% { transform: rotate(480deg) translateX(200px) rotate(-480deg); }
                  }
                  @keyframes orbit3 {
                    0% { transform: rotate(240deg) translateX(160px) rotate(-240deg); }
                    100% { transform: rotate(600deg) translateX(160px) rotate(-600deg); }
                  }
                  @keyframes sparkle {
                    0%, 100% { opacity: 0; transform: scale(0); }
                    50% { opacity: 1; transform: scale(1); }
                  }
                  @keyframes glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
                    50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.6); }
                  }
                  @keyframes textGradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                  }
                `}
              </style>

              {/* Orbiting Elements Container */}
              <div style={{ position: 'relative', width: '400px', height: '440px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                
                {/* Orbiting Blocks */}
                <div style={{
                  position: 'absolute',
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
                  animation: 'orbit1 8s linear infinite',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                }} />
                <div style={{
                  position: 'absolute',
                  width: '18px',
                  height: '18px',
                  borderRadius: '4px',
                  background: 'linear-gradient(135deg, #c4b5fd, #a78bfa)',
                  animation: 'orbit2 12s linear infinite',
                  boxShadow: '0 4px 12px rgba(167, 139, 250, 0.4)',
                }} />
                <div style={{
                  position: 'absolute',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ddd6fe, #c4b5fd)',
                  animation: 'orbit3 6s linear infinite',
                  boxShadow: '0 4px 12px rgba(196, 181, 253, 0.4)',
                }} />

                {/* Sparkles */}
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#8b5cf6',
                      top: `${20 + Math.random() * 60}%`,
                      left: `${10 + Math.random() * 80}%`,
                      animation: `sparkle ${2 + Math.random() * 2}s ease-in-out ${Math.random() * 2}s infinite`,
                      opacity: 0,
                    }}
                  />
                ))}
              
                {/* Page Frame with floating animation */}
                <div style={{
                  width: '280px',
                  height: '360px',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  boxShadow: '0 25px 80px rgba(139, 92, 246, 0.15), 0 10px 30px rgba(0, 0, 0, 0.1)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  animation: 'float 4s ease-in-out infinite, glow 3s ease-in-out infinite',
                  position: 'relative',
                  zIndex: 1,
                }}>
                  {/* Nav Block */}
                  <div style={{
                    height: '40px',
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                    gap: '8px',
                  }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#fbbf24' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                    <div style={{ flex: 1 }} />
                    <div style={{ height: '6px', width: '32px', borderRadius: '3px', backgroundColor: '#e5e7eb' }} />
                    <div style={{ height: '6px', width: '32px', borderRadius: '3px', backgroundColor: '#e5e7eb' }} />
                  </div>

                  {/* Hero Block with shimmer */}
                  <div style={{
                    height: '100px',
                    margin: '12px',
                    borderRadius: '10px',
                    background: 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 25%, #c4b5fd 50%, #a78bfa 75%, #8b5cf6 100%)',
                    backgroundSize: '200% 100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '10px',
                    animation: 'shimmer 2.5s ease-in-out infinite',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{ height: '12px', width: '150px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.9)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    <div style={{ height: '10px', width: '100px', borderRadius: '5px', backgroundColor: 'rgba(255, 255, 255, 0.7)', animation: 'pulse 1.5s ease-in-out 0.2s infinite' }} />
                    <div style={{ height: '24px', width: '80px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.95)', marginTop: '4px', animation: 'pulse 1.5s ease-in-out 0.4s infinite' }} />
                  </div>

                  {/* Content Row 1 */}
                  <div style={{ display: 'flex', gap: '10px', padding: '0 12px', marginBottom: '10px' }}>
                    <div style={{
                      flex: 1,
                      height: '65px',
                      borderRadius: '8px',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '12px',
                      gap: '8px',
                      border: '1px solid #e5e7eb',
                    }}>
                      <div style={{ height: '8px', width: '85%', borderRadius: '4px', background: 'linear-gradient(90deg, #d1d5db, #e5e7eb, #d1d5db)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
                      <div style={{ height: '8px', width: '60%', borderRadius: '4px', background: 'linear-gradient(90deg, #d1d5db, #e5e7eb, #d1d5db)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out 0.2s infinite' }} />
                    </div>
                    <div style={{
                      flex: 1,
                      height: '65px',
                      borderRadius: '8px',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '12px',
                      gap: '8px',
                      border: '1px solid #e5e7eb',
                    }}>
                      <div style={{ height: '8px', width: '70%', borderRadius: '4px', background: 'linear-gradient(90deg, #d1d5db, #e5e7eb, #d1d5db)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out 0.1s infinite' }} />
                      <div style={{ height: '8px', width: '90%', borderRadius: '4px', background: 'linear-gradient(90deg, #d1d5db, #e5e7eb, #d1d5db)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out 0.3s infinite' }} />
                    </div>
                  </div>

                  {/* Content Row 2 */}
                  <div style={{ display: 'flex', gap: '10px', padding: '0 12px', marginBottom: '10px' }}>
                    <div style={{
                      flex: 1,
                      height: '65px',
                      borderRadius: '8px',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '12px',
                      gap: '8px',
                      border: '1px solid #e5e7eb',
                    }}>
                      <div style={{ height: '8px', width: '65%', borderRadius: '4px', background: 'linear-gradient(90deg, #d1d5db, #e5e7eb, #d1d5db)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out 0.15s infinite' }} />
                      <div style={{ height: '8px', width: '80%', borderRadius: '4px', background: 'linear-gradient(90deg, #d1d5db, #e5e7eb, #d1d5db)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out 0.35s infinite' }} />
                    </div>
                    <div style={{
                      flex: 1,
                      height: '65px',
                      borderRadius: '8px',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '12px',
                      gap: '8px',
                      border: '1px solid #e5e7eb',
                    }}>
                      <div style={{ height: '8px', width: '75%', borderRadius: '4px', background: 'linear-gradient(90deg, #d1d5db, #e5e7eb, #d1d5db)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out 0.25s infinite' }} />
                      <div style={{ height: '8px', width: '55%', borderRadius: '4px', background: 'linear-gradient(90deg, #d1d5db, #e5e7eb, #d1d5db)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out 0.45s infinite' }} />
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{
                    marginTop: 'auto',
                    height: '40px',
                    background: 'linear-gradient(135deg, #1f2937, #374151)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                  }}>
                    <div style={{ height: '6px', width: '40px', borderRadius: '3px', backgroundColor: '#6b7280', animation: 'pulse 2s ease-in-out infinite' }} />
                    <div style={{ height: '6px', width: '40px', borderRadius: '3px', backgroundColor: '#6b7280', animation: 'pulse 2s ease-in-out 0.3s infinite' }} />
                    <div style={{ height: '6px', width: '40px', borderRadius: '3px', backgroundColor: '#6b7280', animation: 'pulse 2s ease-in-out 0.6s infinite' }} />
                  </div>
                </div>
              </div>
              
              {/* Large animated text */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: 700,
                  background: 'linear-gradient(90deg, #7c3aed, #a78bfa, #8b5cf6, #7c3aed)',
                  backgroundSize: '300% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  animation: 'textGradient 3s ease-in-out infinite',
                  letterSpacing: '-0.02em',
                }}>
                  {updateTemplateGenerationOverlayOverride ? 'Updating Your Website' : 'Building Your Website'}
                </h2>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#6b7280',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#22c55e',
                    animation: 'pulse 1s ease-in-out infinite',
                  }} />
                  {updateTemplateGenerationOverlayOverride ? 'AI is updating your website' : 'AI is crafting your perfect design'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CustomIframeOverride;
