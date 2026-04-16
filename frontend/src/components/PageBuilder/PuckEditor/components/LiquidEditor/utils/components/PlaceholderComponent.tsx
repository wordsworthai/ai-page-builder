import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import type { PlaceholderComponentProps } from '../../SectionAddition.types';

export type PlaceholderLoadingState = 'loading' | 'error' | 'success';

/**
 * PlaceholderComponent renders a loading state with blur overlay
 * while the actual section data is being fetched.
 * 
 * This component is rendered inside the Puck canvas when a user
 * drags a section from the templates modal before the full section
 * data has been loaded.
 */
export const PlaceholderComponent: React.FC<PlaceholderComponentProps> = ({
  section_id,
  display_name,
  category_key,
  id,
  onSectionLoaded,
  onLoadError,
  fetchSectionData,
}) => {
  const [loadingState, setLoadingState] = useState<PlaceholderLoadingState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSection = useCallback(async () => {
    if (!fetchSectionData) {
      console.warn('[PlaceholderComponent] No fetchSectionData function provided');
      return;
    }

    setLoadingState('loading');
    setErrorMessage(null);

    try {
      const sectionData = await fetchSectionData(section_id);
      setLoadingState('success');
      onSectionLoaded?.(sectionData);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load section';
      setLoadingState('error');
      setErrorMessage(errorMsg);
      onLoadError?.(error instanceof Error ? error : new Error(errorMsg));
    }
  }, [section_id, fetchSectionData, onSectionLoaded, onLoadError]);

  useEffect(() => {
    if (fetchSectionData) {
      loadSection();
    }
  }, [loadSection, fetchSectionData]);

  const handleRetry = () => {
    loadSection();
  };

  return (
    <div 
      className="placeholder-section-container"
      data-placeholder-id={id}
      data-section-id={section_id}
      style={{
        position: 'relative',
        minHeight: '200px',
        width: '100%',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Blur overlay background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          zIndex: 10,
        }}
      >
        {loadingState === 'loading' && (
          <LoadingStateContent displayName={display_name} />
        )}
        
        {loadingState === 'error' && (
          <ErrorStateContent 
            displayName={display_name} 
            errorMessage={errorMessage}
            onRetry={handleRetry}
          />
        )}
        
        {loadingState === 'success' && (
          <SuccessStateContent displayName={display_name} />
        )}
      </div>

      {/* Placeholder content skeleton */}
      <PlaceholderSkeleton categoryKey={category_key} />
    </div>
  );
};

/**
 * Loading state content with spinner and message
 */
const LoadingStateContent: React.FC<{ displayName: string }> = ({ displayName }) => (
  <>
    <div
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: '#e8e8fd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
      }}
    >
      <Loader2 
        size={24} 
        className="animate-spin" 
        style={{ color: '#8E94F2' }}
      />
    </div>
    <h3 
      style={{
        margin: '0 0 8px 0',
        fontSize: '14px',
        fontWeight: 600,
        color: '#1f2937',
        textAlign: 'center',
      }}
    >
      Loading Section
    </h3>
    <p 
      style={{
        margin: 0,
        fontSize: '13px',
        color: '#6b7280',
        textAlign: 'center',
      }}
    >
      {displayName} is being loaded...
    </p>
  </>
);

/**
 * Error state content with retry button
 */
const ErrorStateContent: React.FC<{ 
  displayName: string; 
  errorMessage: string | null;
  onRetry: () => void;
}> = ({ displayName, errorMessage, onRetry }) => (
  <>
    <div
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: '#fee2e2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
      }}
    >
      <AlertCircle size={24} style={{ color: '#ef4444' }} />
    </div>
    <h3 
      style={{
        margin: '0 0 8px 0',
        fontSize: '14px',
        fontWeight: 600,
        color: '#1f2937',
        textAlign: 'center',
      }}
    >
      Failed to Load Section
    </h3>
    <p 
      style={{
        margin: '0 0 16px 0',
        fontSize: '13px',
        color: '#6b7280',
        textAlign: 'center',
      }}
    >
      {errorMessage || `Unable to load ${displayName}`}
    </p>
    <button
      onClick={onRetry}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: 500,
        color: '#ffffff',
        backgroundColor: '#8E94F2',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = '#7c82e6';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = '#8E94F2';
      }}
    >
      <RefreshCw size={14} />
      Retry
    </button>
  </>
);

/**
 * Success state content (shown briefly before component replacement)
 */
const SuccessStateContent: React.FC<{ displayName: string }> = ({ displayName }) => (
  <>
    <div
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: '#d1fae5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#10b981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
    <h3 
      style={{
        margin: '0 0 8px 0',
        fontSize: '14px',
        fontWeight: 600,
        color: '#1f2937',
        textAlign: 'center',
      }}
    >
      Section Loaded
    </h3>
    <p 
      style={{
        margin: 0,
        fontSize: '13px',
        color: '#6b7280',
        textAlign: 'center',
      }}
    >
      {displayName} is ready
    </p>
  </>
);

/**
 * Placeholder skeleton that shows a rough outline of what the section might look like
 */
const PlaceholderSkeleton: React.FC<{ categoryKey: string }> = ({ categoryKey }) => {
  // Different skeleton layouts based on section category
  const getSkeletonLayout = () => {
    switch (categoryKey) {
      case 'navigation_bar':
      case 'header':
      case 'ribbon':
        return (
          <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: '120px', height: '24px', backgroundColor: '#e5e7eb', borderRadius: '4px' }} />
            <div style={{ display: 'flex', gap: '16px' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ width: '60px', height: '16px', backgroundColor: '#e5e7eb', borderRadius: '4px' }} />
              ))}
            </div>
          </div>
        );
      
      case 'banner':
      case 'video_banner':
        return (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ width: '60%', height: '32px', backgroundColor: '#e5e7eb', borderRadius: '4px', margin: '0 auto 16px' }} />
            <div style={{ width: '80%', height: '16px', backgroundColor: '#e5e7eb', borderRadius: '4px', margin: '0 auto 24px' }} />
            <div style={{ width: '120px', height: '40px', backgroundColor: '#e5e7eb', borderRadius: '6px', margin: '0 auto' }} />
          </div>
        );
      
      case 'footer':
        return (
          <div style={{ padding: '32px 24px', display: 'flex', justifyContent: 'space-between' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ flex: 1, padding: '0 16px' }}>
                <div style={{ width: '80px', height: '16px', backgroundColor: '#e5e7eb', borderRadius: '4px', marginBottom: '12px' }} />
                {[1, 2, 3].map((j) => (
                  <div key={j} style={{ width: '100%', height: '12px', backgroundColor: '#e5e7eb', borderRadius: '4px', marginBottom: '8px' }} />
                ))}
              </div>
            ))}
          </div>
        );
      
      default:
        // Generic content section skeleton
        return (
          <div style={{ padding: '32px 24px' }}>
            <div style={{ width: '40%', height: '24px', backgroundColor: '#e5e7eb', borderRadius: '4px', margin: '0 auto 24px' }} />
            <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ width: '200px' }}>
                  <div style={{ width: '100%', height: '120px', backgroundColor: '#e5e7eb', borderRadius: '8px', marginBottom: '12px' }} />
                  <div style={{ width: '80%', height: '16px', backgroundColor: '#e5e7eb', borderRadius: '4px', marginBottom: '8px' }} />
                  <div style={{ width: '100%', height: '12px', backgroundColor: '#e5e7eb', borderRadius: '4px' }} />
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{ opacity: 0.5 }}>
      {getSkeletonLayout()}
    </div>
  );
};

export default PlaceholderComponent;
