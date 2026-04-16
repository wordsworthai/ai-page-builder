import React from 'react';
import { Box } from '@mui/material';
import { ComponentContainer, ComponentTitle, ComponentContent } from '../../ComponentContainer';
import { ProgressCard } from '@/streaming/components/ProgressCard';
import EditorPreviewContainer from '../../EditorPreviewContainer';
import PublishSiteContainer from '../../PublishSiteContainer';
import { LayoutContainer, LeftSection, RightSection } from '../Layout';
import type { GenerationStatus } from '@/streaming/types/generation';

interface GeneratingViewProps {
  generationStatus: GenerationStatus;
  onOpenEditor: () => void;
}

const GeneratingView: React.FC<GeneratingViewProps> = ({ generationStatus, onOpenEditor }) => (
  <ComponentContainer>
    <ComponentTitle>Your website</ComponentTitle>
    <ComponentContent>
      <LayoutContainer>
        <LeftSection>
          <Box
            onClick={onOpenEditor}
            sx={{
              cursor: 'pointer',
              borderRadius: '12px',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(128, 103, 230, 0.15)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
              height: '100%',
            }}
          >
            <ProgressCard status={generationStatus} />
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

export default GeneratingView;
