import React from 'react';
import { Box } from '@mui/material';
import { ComponentContainer, ComponentTitle, ComponentContent } from '../../ComponentContainer';
import { ProgressCard } from '@/streaming/components/ProgressCard';
import EditorPreviewContainer from '../../EditorPreviewContainer';
import PublishSiteContainer from '../../PublishSiteContainer';
import { LayoutContainer, LeftSection, RightSection } from '../Layout';
import type { StreamingStatus } from '@/streaming/types';

/** Minimal status so ProgressCard shows "Building Your Website" with shimmer and "Starting your website..." */
const PLACEHOLDER_STATUS: StreamingStatus = {
  id: '',
  status: 'pending',
  started_at: null,
  elapsed_seconds: 0,
  current_node: null,
  current_node_display: 'Starting your website...',
  nodes_completed: 0,
  execution_log: [],
  error_message: null,
};

/**
 * Shown in the dashboard box while the pending create-site trigger is running (no generation ID yet).
 * Matches GeneratingView layout so the box shows the same "Building Your Website" card style.
 */
const StartingGenerationPlaceholderView: React.FC = () => (
  <ComponentContainer>
    <ComponentTitle>Your website</ComponentTitle>
    <ComponentContent>
      <LayoutContainer>
        <LeftSection>
          <Box sx={{ height: '100%' }}>
            <ProgressCard status={PLACEHOLDER_STATUS} />
          </Box>
        </LeftSection>
        <RightSection>
          <EditorPreviewContainer disabled disabledMessage="Generating your website..." />
          <PublishSiteContainer state="disabled" disabledMessage="Generating your website..." />
        </RightSection>
      </LayoutContainer>
    </ComponentContent>
  </ComponentContainer>
);

export default StartingGenerationPlaceholderView;
