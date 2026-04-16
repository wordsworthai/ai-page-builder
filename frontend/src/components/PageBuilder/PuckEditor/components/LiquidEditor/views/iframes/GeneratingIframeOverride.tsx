import React, { useEffect, useState } from 'react';
import type { GenerationStatus } from '@/streaming/types/generation';
import { getCreateSiteData } from '@/utils/createSiteStorage';
import { getDedupedNodeCount } from '@/streaming/utils/executionLogUtils';
import { ErrorState } from './components/ErrorState';
import { CompleteState } from './components/CompleteState';
import { InProgressState } from './components/InProgressState';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface GeneratingIframeOverrideProps {
  children?: React.ReactNode;
  document?: Document;
  generationStatus: GenerationStatus | undefined;
  /** Retry from last checkpoint (same as dashboard Retry) */
  onRetry?: () => void;
  /** Back to dashboard: navigate to dashboard (fallback if onRetry not provided) */
  onBackToDashboard?: () => void;
  /** Start over: navigate to create-site or dashboard (same as dashboard Start Over) */
  onStartOver?: () => void;
  /** Open Contact Support dialog */
  onOpenContactSupport?: () => void;
}

export const GeneratingIframeOverride: React.FC<GeneratingIframeOverrideProps> = ({ 
  generationStatus,
  onRetry,
  onBackToDashboard,
  onStartOver,
  onOpenContactSupport,
}) => {
  const [localElapsed, setLocalElapsed] = useState(0);
  const [businessName, setBusinessName] = useState<string | null>(null);
  
  const executionLog = generationStatus?.execution_log ?? [];
  const currentNodeDisplay = generationStatus?.current_node_display || generationStatus?.current_node;
  const status = generationStatus?.status ?? 'pending';
  const isComplete = status === 'completed';
  const isFailed = status === 'failed';
  
  const nodesCompleted = getDedupedNodeCount(executionLog);
  
  // Load business name
  useEffect(() => {
    const data = getCreateSiteData();
    if (data?.businessName) {
      setBusinessName(data.businessName);
    }
  }, []);
  
  // Sync elapsed time
  useEffect(() => {
    if (generationStatus?.elapsed_seconds) {
      setLocalElapsed(generationStatus.elapsed_seconds);
    }
  }, [generationStatus?.elapsed_seconds]);
  
  // Local timer
  useEffect(() => {
    if (isComplete || isFailed) return;
    
    const interval = setInterval(() => {
      setLocalElapsed(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isComplete, isFailed]);
  
  // =========================================================================
  // RENDER: Error state
  // =========================================================================
  if (isFailed) {
    return (
      <ErrorState
        generationStatus={generationStatus}
        nodesCompleted={nodesCompleted}
        localElapsed={localElapsed}
        onRetry={onRetry}
        onBackToDashboard={onBackToDashboard}
        onStartOver={onStartOver}
        onOpenContactSupport={onOpenContactSupport}
      />
    );
  }
  
  // =========================================================================
  // RENDER: Complete state
  // =========================================================================
  if (isComplete) {
    return (
      <CompleteState
        nodesCompleted={nodesCompleted}
        localElapsed={localElapsed}
        businessName={businessName}
      />
    );
  }
  
  // =========================================================================
  // RENDER: In progress state with fancy animation
  // =========================================================================
  return (
    <InProgressState
      generationStatus={generationStatus}
      nodesCompleted={nodesCompleted}
      localElapsed={localElapsed}
      currentNodeDisplay={currentNodeDisplay}
    />
  );
};

export default GeneratingIframeOverride;
