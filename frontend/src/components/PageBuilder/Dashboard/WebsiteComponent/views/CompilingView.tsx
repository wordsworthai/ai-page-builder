import React from 'react';
import { ComponentContainer, ComponentTitle, ComponentContent } from '../../ComponentContainer';
import { ProgressCard } from '@/streaming/components/ProgressCard';
import EditorPreviewContainer from '../../EditorPreviewContainer';
import PublishSiteContainer from '../../PublishSiteContainer';
import { LayoutContainer, LeftSection, RightSection } from '../Layout';
import type { CompilationStatus } from '@/streaming/types/generation';

interface CompilingViewProps {
  compilationStatus: CompilationStatus;
}

const CompilingView: React.FC<CompilingViewProps> = ({ compilationStatus }) => (
  <ComponentContainer>
    <ComponentTitle>Your website</ComponentTitle>
    <ComponentContent>
      <LayoutContainer>
        <LeftSection>
          <ProgressCard status={compilationStatus} />
        </LeftSection>
        <RightSection>
          <EditorPreviewContainer disabled disabledMessage="Preparing preview..." />
          <PublishSiteContainer state="disabled" disabledMessage="Preparing preview..." />
        </RightSection>
      </LayoutContainer>
    </ComponentContent>
  </ComponentContainer>
);

export default CompilingView;
