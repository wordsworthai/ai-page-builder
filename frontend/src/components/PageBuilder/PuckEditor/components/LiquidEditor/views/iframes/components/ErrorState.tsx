import React, { useState } from 'react';
import type { GenerationStatus } from '@/streaming/types/generation';
import { formatElapsedTime } from '@/streaming/utils/timeUtils';
import { getDedupedNodeCount } from '@/streaming/utils/executionLogUtils';
import { formatUserFriendlyError } from '../utils/formatUserFriendlyError';
import { WarningIcon, RefreshIcon, HelpIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';

interface ErrorStateProps {
  generationStatus: GenerationStatus | undefined;
  nodesCompleted: number;
  localElapsed: number;
  onRetry?: () => void;
  onBackToDashboard?: () => void;
  onStartOver?: () => void;
  onOpenContactSupport?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  generationStatus,
  nodesCompleted,
  localElapsed,
  onRetry,
  onBackToDashboard,
  onStartOver,
  onOpenContactSupport,
}) => {
  const errorInfo = formatUserFriendlyError(generationStatus?.error_message);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'auto',
    }}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '40px 32px',
        animation: 'fadeIn 0.4s ease-out',
        maxWidth: '600px',
        margin: '0 auto',
      }}>
        {/* Warning Icon with softer colors */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          boxShadow: '0 8px 24px rgba(245, 158, 11, 0.15)',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        }}>
          <WarningIcon size={40} color="#ffffff" />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#1f2937',
          marginBottom: '12px',
          margin: '0 0 12px 0',
          textAlign: 'center',
          letterSpacing: '-0.02em',
        }}>Generation Failed</h1>

        {/* User-friendly error message */}
        <p style={{
          fontSize: '1rem',
          color: '#4b5563',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '0 0 24px 0',
          lineHeight: 1.6,
        }}>
          {errorInfo.userMessage}
        </p>

        {/* Version Switch Suggestion */}
        <div style={{
          width: '100%',
          maxWidth: '500px',
          marginBottom: '24px',
          padding: '16px 20px',
          backgroundColor: '#faf5ff',
          borderRadius: '12px',
          border: '1px solid #d8b4fe',
        }}>
          <p style={{
            fontSize: '0.9375rem',
            color: '#7c3aed',
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.6,
          }}>
            <strong>Tip:</strong> You can switch to a previous version using the version dropdown in the header above, then re-run the generation.
          </p>
        </div>

        {/* Stats Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          marginBottom: '32px',
          padding: '20px 32px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e5e7eb',
        }}>
          <div style={{ textAlign: 'center', minWidth: '70px' }}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1f2937',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.2,
            }}>{nodesCompleted}</div>
            <div style={{
              fontSize: '0.625rem',
              color: '#9ca3af',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '4px',
            }}>Steps Done</div>
          </div>
          <div style={{ width: '1px', height: '40px', backgroundColor: '#e5e7eb' }} />
          <div style={{ textAlign: 'center', minWidth: '70px' }}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1f2937',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.2,
            }}>{formatElapsedTime(localElapsed)}</div>
            <div style={{
              fontSize: '0.625rem',
              color: '#9ca3af',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '4px',
            }}>Elapsed</div>
          </div>
        </div>

        {/* Technical Details (Expandable) */}
        {errorInfo.technicalDetails && (
          <div style={{
            width: '100%',
            maxWidth: '500px',
            marginBottom: '24px',
          }}>
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.875rem',
                color: '#6b7280',
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              <span>Show technical details</span>
              {showTechnicalDetails ? (
                <ChevronUpIcon size={16} color="#6b7280" />
              ) : (
                <ChevronDownIcon size={16} color="#6b7280" />
              )}
            </button>
            {showTechnicalDetails && (
              <div style={{
                marginTop: '12px',
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
              }}>
                <p style={{
                  fontSize: '0.8125rem',
                  color: '#6b7280',
                  fontFamily: 'monospace',
                  margin: 0,
                  wordBreak: 'break-word',
                  lineHeight: 1.5,
                }}>
                  {errorInfo.technicalDetails}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          width: '100%',
          maxWidth: '500px',
        }}>
          <button
            onClick={() => {
              if (onRetry) {
                onRetry();
              } else if (onBackToDashboard) {
                onBackToDashboard();
              } else {
                window.location.href = '/dashboard';
              }
            }}
            style={{
              flex: 1,
              minWidth: '140px',
              padding: '14px 24px',
              background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
            }}
          >
            <RefreshIcon size={20} color="#ffffff" />
            Retry
          </button>
          <button
            onClick={() => {
              if (onStartOver) {
                onStartOver();
              } else {
                window.location.href = '/create-site';
              }
            }}
            style={{
              flex: 1,
              minWidth: '140px',
              padding: '14px 24px',
              background: 'transparent',
              color: '#6b7280',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#9ca3af';
              e.currentTarget.style.color = '#374151';
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.color = '#6b7280';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Start Over
          </button>
        </div>

        {/* Get Help Button */}
        <button
          onClick={() => {
            if (onOpenContactSupport) {
              onOpenContactSupport();
            } else {
              // Fallback: Open support email with generation details
              const subject = encodeURIComponent('Generation Failed - Need Help');
              const body = encodeURIComponent(
                `Hi,\n\nI encountered an error while generating my website.\n\n` +
                `Generation ID: ${generationStatus?.generation_version_id || 'N/A'}\n` +
                `Error Message: ${generationStatus?.error_message || 'N/A'}\n\n` +
                `Please help me resolve this issue.\n\nThank you!`
              );
              const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'support@example.com';
              window.open(`mailto:${supportEmail}?subject=${subject}&body=${body}`, '_blank');
            }
          }}
          style={{
            padding: '10px 20px',
            background: 'transparent',
            color: '#6b7280',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#9ca3af';
            e.currentTarget.style.color = '#374151';
            e.currentTarget.style.backgroundColor = '#f9fafb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.color = '#6b7280';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <HelpIcon size={18} color="currentColor" />
          Get Help
        </button>
      </div>
    </div>
  );
};
