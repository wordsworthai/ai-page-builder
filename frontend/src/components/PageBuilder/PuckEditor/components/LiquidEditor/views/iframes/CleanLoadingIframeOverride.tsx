import React from 'react';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface CleanLoadingIframeOverrideProps {
  document?: Document;
  title?: string;
  subtitle?: string;
}

/**
 * CleanLoadingIframeOverride: Shows a clean loading screen with spinner
 * 
 * Used for loading states (e.g., loading template data).
 * Displays a customizable message with a spinner.
 */
export const CleanLoadingIframeOverride: React.FC<CleanLoadingIframeOverrideProps> = ({
  document,
  title = 'Loading...',
  subtitle = 'Please wait',
}) => {
  // Inject CSS styles into iframe document
  React.useEffect(() => {
    if (document) {
      const html = document.documentElement;
      const body = document.body;
      const head = document.head;
      
      // Store original styles to restore later
      const originalHtmlStyle = html.style.cssText;
      const originalBodyStyle = body.style.cssText;
      
      // Set full viewport styles
      html.style.cssText = 'height: 100%; width: 100%; margin: 0; padding: 0; overflow: hidden;';
      body.style.cssText = 'height: 100%; width: 100%; margin: 0; padding: 0; overflow: hidden;';
      
      // Inject CSS for loading component
      let styleElement = document.getElementById('clean-loading-styles');
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'clean-loading-styles';
        styleElement.textContent = `
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .clean-loading-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100vw;
            height: 100vh;
            background-color: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            z-index: 9999;
            animation: fadeIn 0.4s ease-out;
          }
          .clean-loading-centered {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 32px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
          }
          .clean-loading-spinner {
            width: 64px;
            height: 64px;
            border: 5px solid rgba(167, 139, 250, 0.2);
            border-top-color: #a78bfa;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            flex-shrink: 0;
          }
          .clean-loading-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #a78bfa;
            text-align: center;
            line-height: 1.4;
            letter-spacing: -0.02em;
            margin: 0;
          }
          .clean-loading-subtitle {
            font-size: 1rem;
            color: #c4b5fd;
            text-align: center;
            line-height: 1.5;
            font-weight: 400;
            margin: 0;
          }
          .clean-loading-text-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }
        `;
        head.appendChild(styleElement);
      }
      
      return () => {
        // Restore original styles on cleanup
        html.style.cssText = originalHtmlStyle;
        body.style.cssText = originalBodyStyle;
        
        // Remove style element
        const styleEl = document.getElementById('clean-loading-styles');
        if (styleEl) {
          styleEl.remove();
        }
      };
    }
  }, [document]);

  return (
    <div className="clean-loading-container">
      <div className="clean-loading-centered">
        <div className="clean-loading-spinner" />
        <div className="clean-loading-text-container">
          <h1 className="clean-loading-title">{title}</h1>
          {subtitle && <p className="clean-loading-subtitle">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

export default CleanLoadingIframeOverride;
