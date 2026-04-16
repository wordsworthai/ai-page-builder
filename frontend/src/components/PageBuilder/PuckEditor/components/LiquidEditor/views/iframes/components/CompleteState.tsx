import React from 'react';
import { formatElapsedTime } from '@/streaming/utils/timeUtils';
import { CheckCircleIcon } from './Icons';

interface CompleteStateProps {
  nodesCompleted: number;
  localElapsed: number;
  businessName: string | null;
}

export const CompleteState: React.FC<CompleteStateProps> = ({
  nodesCompleted,
  localElapsed,
  businessName,
}) => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
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
        height: '100%',
        padding: '32px',
        animation: 'fadeIn 0.4s ease-out',
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        }}>
          <CheckCircleIcon size={36} color="#ffffff" />
        </div>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          color: '#1f2937',
          marginBottom: '8px',
          margin: '0 0 8px 0',
        }}>Your Website is Ready!</h1>
        <p style={{
          fontSize: '0.9375rem',
          color: '#6b7280',
          textAlign: 'center',
          maxWidth: '400px',
          margin: 0,
        }}>
          {businessName 
            ? `${businessName}'s website has been created successfully.`
            : 'Your website has been created successfully.'}
        </p>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          marginTop: '24px',
          padding: '16px 32px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        }}>
          <div style={{ textAlign: 'center', minWidth: '60px' }}>
            <div style={{
              fontSize: '1.25rem',
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
            }}>Steps</div>
          </div>
          <div style={{ width: '1px', height: '32px', backgroundColor: '#e5e7eb' }} />
          <div style={{ textAlign: 'center', minWidth: '60px' }}>
            <div style={{
              fontSize: '1.25rem',
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
            }}>Total Time</div>
          </div>
        </div>
        
        <p style={{
          fontSize: '0.9375rem',
          color: '#a78bfa',
          textAlign: 'center',
          maxWidth: '400px',
          marginTop: '24px',
          marginBottom: 0,
        }}>
          Loading editor...
        </p>
      </div>
    </div>
  );
};
