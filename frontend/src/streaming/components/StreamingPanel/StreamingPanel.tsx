/**
 * Generic streaming panel component for displaying generation progress.
 * 
 * This component can be used with any streaming status type.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Typography, Collapse } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import type { StreamingStatus } from '../../types';
import { formatElapsedTime } from '../../utils/timeUtils';
import { 
  dedupeExecutionLog, 
  getDedupedNodeCount, 
  getPlainTextSummary,
  isRawExecutionLogOutput,
  type DedupedExecutionEntry 
} from '../../utils/executionLogUtils';
import { getDisplayErrorMessage } from '@/utils/generationErrorDisplay';
import {
  PanelContainer,
  StatsHeader,
  StatsTitle,
  StatsSubtitle,
  StepperList,
  StepperItem,
  StepHeader,
  IconContainer,
  Spinner,
  StepContent,
  StepName,
  StepPreview,
  ExpandIcon,
  ExpandedContent,
  OutputContainer,
  OutputHtml,
  FooterHint,
  HintText,
  ErrorBanner,
} from './StreamingPanel.styles';

export interface StreamingPanelProps {
  /** Streaming status data */
  status: StreamingStatus | undefined;
  /** Custom status title getter (optional) */
  getStatusTitle?: (status: StreamingStatus) => string;
  /** Custom footer hint text (optional) */
  footerHint?: string;
  /** Whether to show the error banner when generation fails (default: true) */
  showErrorBanner?: boolean;
}

/**
 * Default status title getter
 */
const defaultGetStatusTitle = (status: StreamingStatus): string => {
  if (status.status === 'completed') return '✨ Ready';
  if (status.status === 'failed') return '⚠️ Failed';
  return '🔨 Building...';
};

/**
 * StreamingPanel: Generic component for displaying streaming progress
 */
export const StreamingPanel: React.FC<StreamingPanelProps> = ({
  status,
  getStatusTitle = defaultGetStatusTitle,
  footerHint = 'Usually takes 90-120 seconds',
  showErrorBanner = true,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [localElapsed, setLocalElapsed] = useState(0);
  const currentNodeRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolledToBottomRef = useRef(false);
  const prevStatusRef = useRef<string | undefined>(undefined);
  
  const executionLog = status?.execution_log ?? [];
  const currentNodeDisplay = status?.current_node_display || status?.current_node;
  const streamStatus = status?.status ?? 'pending';
  const isComplete = streamStatus === 'completed';
  const isFailed = streamStatus === 'failed';
  
  // Dedupe execution log
  const dedupedLog = dedupeExecutionLog(executionLog);
  const nodesCompleted = getDedupedNodeCount(executionLog);
  
  // Sync elapsed time
  useEffect(() => {
    if (status?.elapsed_seconds) {
      setLocalElapsed(status.elapsed_seconds);
    }
  }, [status?.elapsed_seconds]);
  
  // Local timer
  useEffect(() => {
    if (isComplete || isFailed) return;
    
    const interval = setInterval(() => {
      setLocalElapsed(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isComplete, isFailed]);
  
  // Track status changes
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = streamStatus;
    
    // Reset scroll flag when status changes from completed to something else
    if (prevStatus === 'completed' && streamStatus !== 'completed') {
      hasScrolledToBottomRef.current = false;
    }
  }, [streamStatus]);
  
  // Auto-scroll: scroll to bottom when completed, or to current node during generation
  useEffect(() => {
    if (!listContainerRef.current) return;
    
    // When status becomes completed, scroll to bottom smoothly (only once)
    // This happens when the last stage completes and status changes to "completed"
    if (isComplete && !hasScrolledToBottomRef.current) {
      hasScrolledToBottomRef.current = true;
      // Small delay to ensure DOM is updated with final content
      setTimeout(() => {
        if (listContainerRef.current) {
          listContainerRef.current.scrollTo({
            top: listContainerRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
      }, 150);
      return;
    }
    
    // If already completed, don't scroll (even if content reloads and text changes to "✨ Ready")
    if (isComplete) {
      return;
    }
    
    // During generation: scroll to current node, but scroll to bottom when in last stages
    if (!isComplete && !isFailed && currentNodeRef.current) {
      // If we have 3 or more completed items, we're likely near the end
      // In this case, scroll to bottom to show the last stage loading
      const isNearEnd = dedupedLog.length >= 3;
      
      if (isNearEnd) {
        // Scroll to bottom smoothly to show the last stage
        setTimeout(() => {
          if (listContainerRef.current) {
            listContainerRef.current.scrollTo({
              top: listContainerRef.current.scrollHeight,
              behavior: 'smooth',
            });
          }
        }, 100);
      } else {
        // Otherwise scroll to current node
        currentNodeRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentNodeDisplay, dedupedLog.length, isComplete, isFailed]);
  
  const handleToggleExpand = (nodeName: string, hasOutput: boolean) => {
    if (!hasOutput) return;
    
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeName)) {
        next.delete(nodeName);
      } else {
        next.add(nodeName);
      }
      return next;
    });
  };
  
  const getPreviewText = (entry: DedupedExecutionEntry): string => {
    const plainText = getPlainTextSummary(entry);
    if (!plainText) return '';
    // Show first 80 chars as preview
    return plainText.length > 80 ? plainText.substring(0, 80) + '...' : plainText;
  };

  const getFullHtmlOutput = (entry: DedupedExecutionEntry): string | null => {
    if (!entry.output_summary || isRawExecutionLogOutput(entry.output_summary)) {
      return null;
    }
    // Return the raw HTML output for expanded view
    if (entry.output_type === 'html') {
      return entry.output_summary;
    }
    // For plain text, wrap in basic formatting
    return `<p>${entry.output_summary}</p>`;
  };
  
  if (!status) {
    return (
      <PanelContainer>
        <StatsHeader>
          <StatsTitle>Loading...</StatsTitle>
        </StatsHeader>
      </PanelContainer>
    );
  }
  
  return (
    <PanelContainer>
      {/* Stats Header */}
      <StatsHeader>
        <StatsTitle>{getStatusTitle(status)}</StatsTitle>
        <StatsSubtitle>
          <span>{nodesCompleted} steps</span>
          <span>•</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatElapsedTime(localElapsed)}</span>
        </StatsSubtitle>
      </StatsHeader>
      
      {/* Error Banner */}
      {showErrorBanner && isFailed && status?.error_message && (
        <ErrorBanner>
          <ErrorIcon sx={{ color: '#ef4444', fontSize: 16, flexShrink: 0, marginTop: '1px' }} />
          <Typography sx={{ fontSize: '0.75rem', color: '#dc2626', lineHeight: 1.5 }}>
            {getDisplayErrorMessage(status.error_message)}
          </Typography>
        </ErrorBanner>
      )}
      
      {/* Stepper List */}
      <StepperList ref={listContainerRef}>
        {/* Completed nodes (deduped) */}
        {dedupedLog.map((entry) => {
          const fullHtml = getFullHtmlOutput(entry);
          const hasOutput = !!fullHtml;
          const isExpanded = expandedNodes.has(entry.node_name);
          const previewText = getPreviewText(entry);
          
          return (
            <StepperItem key={entry.node_name} status="complete">
              <StepHeader 
                clickable={hasOutput}
                onClick={() => handleToggleExpand(entry.node_name, hasOutput)}
              >
                <IconContainer status="complete">
                  <CheckCircleIcon sx={{ fontSize: 16, color: '#22c55e' }} />
                </IconContainer>
                
                <StepContent>
                  <StepName status="complete">
                    {entry.display_name}
                  </StepName>
                  {/* Show preview when collapsed and has content */}
                  {!isExpanded && previewText && (
                    <StepPreview>{previewText}</StepPreview>
                  )}
                </StepContent>
                
                {hasOutput && (
                  <ExpandIcon 
                    className="expand-icon" 
                    expanded={isExpanded} 
                  />
                )}
              </StepHeader>
              
              {/* Expanded full HTML output */}
              {hasOutput && (
                <Collapse in={isExpanded} timeout={200}>
                  <ExpandedContent>
                    <OutputContainer>
                      <OutputHtml 
                        dangerouslySetInnerHTML={{ __html: fullHtml! }} 
                      />
                    </OutputContainer>
                  </ExpandedContent>
                </Collapse>
              )}
            </StepperItem>
          );
        })}
        
        {/* Current node */}
        {!isComplete && !isFailed && currentNodeDisplay && (
          <StepperItem ref={currentNodeRef} status="current">
            <StepHeader clickable={false}>
              <IconContainer status="current">
                <Spinner />
              </IconContainer>
              <StepContent>
                <StepName status="current">{currentNodeDisplay}</StepName>
              </StepContent>
            </StepHeader>
          </StepperItem>
        )}
      </StepperList>
      
      {/* Footer Hint */}
      {!isComplete && !isFailed && (
        <FooterHint>
          <HintText>{footerHint}</HintText>
        </FooterHint>
      )}
    </PanelContainer>
  );
};
