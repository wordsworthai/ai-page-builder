import React from 'react';
import { formatElapsedTime } from '@/streaming/utils/timeUtils';

/**
 * GenerationStatsCard: Floating stats card showing generation progress
 */
export interface GenerationStatsCardProps {
  nodesCompleted: number;
  elapsedTime: number;
  currentNodeDisplay?: string | null;
}

export const GenerationStatsCard: React.FC<GenerationStatsCardProps> = ({
  nodesCompleted,
  elapsedTime,
  currentNodeDisplay,
}) => {
  return (
    <div style={{
      position: 'absolute',
      top: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      padding: '12px 24px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
      border: '1px solid rgba(255, 255, 255, 0.8)',
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      zIndex: 10,
      animation: 'fadeIn 0.4s ease-out',
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
        }}>{formatElapsedTime(elapsedTime)}</div>
        <div style={{
          fontSize: '0.625rem',
          color: '#9ca3af',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>Elapsed</div>
      </div>
      
      {currentNodeDisplay && (
        <>
          <div style={{ width: '1px', height: '32px', backgroundColor: '#e5e7eb' }} />
          <div style={{
            backgroundColor: 'rgba(167, 139, 250, 0.1)',
            color: '#7c3aed',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 500,
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }} title={currentNodeDisplay}>
            {currentNodeDisplay}
          </div>
        </>
      )}
    </div>
  );
};
