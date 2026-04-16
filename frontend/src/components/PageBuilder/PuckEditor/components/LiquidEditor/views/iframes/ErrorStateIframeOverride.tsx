import React from 'react';

interface ErrorStateIframeOverrideProps {
  title: string;
  message: string;
  onBackToDashboard: () => void;
}

/**
 * ErrorStateIframeOverride: Shows an error message with a back button
 * 
 * Used for error states (e.g., invalid generation ID, no template data).
 * Displays a customizable error message with a button to return to dashboard.
 */
export const ErrorStateIframeOverride: React.FC<ErrorStateIframeOverrideProps> = ({
  title,
  message,
  onBackToDashboard,
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      backgroundColor: '#f9fafb',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#374151',
          marginBottom: '8px',
          margin: '0 0 8px 0',
        }}>{title}</h1>
        <p style={{
          color: '#6b7280',
          marginBottom: '16px',
          margin: '0 0 16px 0',
        }}>{message}</p>
        <button
          onClick={onBackToDashboard}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e5e7eb';
            e.currentTarget.style.borderColor = '#9ca3af';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ErrorStateIframeOverride;
