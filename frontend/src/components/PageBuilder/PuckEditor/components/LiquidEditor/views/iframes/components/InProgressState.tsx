import React from 'react';
import type { GenerationStatus } from '@/streaming/types/generation';
import { GenerationStatsCard } from './GenerationStatsCard';

interface InProgressStateProps {
  generationStatus: GenerationStatus | undefined;
  nodesCompleted: number;
  localElapsed: number;
  currentNodeDisplay?: string | null;
}

export const InProgressState: React.FC<InProgressStateProps> = ({
  generationStatus,
  nodesCompleted,
  localElapsed,
  currentNodeDisplay,
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
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', position: 'relative' }}>
          {/* Inject keyframe animations */}
          <style>
            {`
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes scaleIn {
                0% { transform: scale(0.8); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
              }
              @keyframes fadeInUp {
                0% { transform: translateY(20px); opacity: 0; }
                100% { transform: translateY(0); opacity: 1; }
              }
              @keyframes fadeInDown {
                0% { transform: translateY(-20px); opacity: 0; }
                100% { transform: translateY(0); opacity: 1; }
              }
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
              @keyframes slideIn {
                0% { transform: translateX(-30px); opacity: 0; }
                100% { transform: translateX(0); opacity: 1; }
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

          {/* Floating stats card */}
          {generationStatus && (
            <GenerationStatsCard
              nodesCompleted={nodesCompleted}
              elapsedTime={localElapsed}
              currentNodeDisplay={currentNodeDisplay}
            />
          )}

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
                animation: 'fadeInDown 0.5s ease-out forwards',
              }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#fbbf24' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                <div style={{ flex: 1 }} />
                <div style={{ height: '6px', width: '32px', borderRadius: '3px', backgroundColor: '#e5e7eb', animation: 'slideIn 0.5s ease-out 0.3s both' }} />
                <div style={{ height: '6px', width: '32px', borderRadius: '3px', backgroundColor: '#e5e7eb', animation: 'slideIn 0.5s ease-out 0.4s both' }} />
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
                animation: 'scaleIn 0.6s ease-out 0.2s both, shimmer 2.5s ease-in-out infinite',
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
                  animation: 'fadeInUp 0.5s ease-out 0.4s both',
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
                  animation: 'fadeInUp 0.5s ease-out 0.5s both',
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
                  animation: 'fadeInUp 0.5s ease-out 0.6s both',
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
                  animation: 'fadeInUp 0.5s ease-out 0.7s both',
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
                animation: 'fadeInUp 0.5s ease-out 0.9s both',
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
            animation: 'fadeInUp 0.6s ease-out 1s both',
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
              Building Your Website
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
                backgroundColor: generationStatus ? '#22c55e' : '#a78bfa',
                animation: 'pulse 1s ease-in-out infinite',
              }} />
              {generationStatus
                ? 'AI is crafting your perfect design'
                : 'Starting… Checking status…'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
