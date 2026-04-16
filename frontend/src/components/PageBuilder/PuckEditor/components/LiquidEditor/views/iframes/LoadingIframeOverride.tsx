import React from 'react';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface LoadingIframeOverrideProps {
  document?: Document;
}

/**
 * LoadingIframeOverride: Shows loading screen while intermediate template is being fetched
 * 
 * Displays "Loading selected template..." message with a spinner.
 * This is shown when PARTIAL_TEMPLATE_LOADING_STARTED event is emitted.
 */
export const LoadingIframeOverride: React.FC<LoadingIframeOverrideProps> = () => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      animation: 'fadeIn 0.4s ease-out',
    }}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(167, 139, 250, 0.2)',
          borderTopColor: '#a78bfa',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <div>
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1f2937',
            textAlign: 'center',
            margin: 0,
          }}>Loading selected template...</h1>
          <p style={{
            fontSize: '0.9375rem',
            color: '#6b7280',
            textAlign: 'center',
            marginTop: '8px',
            marginBottom: 0,
          }}>
            Preparing your template preview
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingIframeOverride;
