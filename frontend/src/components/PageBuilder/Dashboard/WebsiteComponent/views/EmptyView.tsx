import React from 'react';
import { ComponentContainer, ComponentTitle, ComponentContent } from '../../ComponentContainer';
import { EmptyWebsiteState } from '../../EmptyWebsiteState';
import EditorPreviewContainer from '../../EditorPreviewContainer';
import PublishSiteContainer from '../../PublishSiteContainer';
import { LayoutContainer, LeftSection, RightSection } from '../Layout';

const EmptyView: React.FC = () => (
  <ComponentContainer>
    <ComponentTitle>Your website</ComponentTitle>
    <ComponentContent>
      <LayoutContainer>
        <LeftSection>
          <EmptyWebsiteState />
        </LeftSection>
        <RightSection>
          <EditorPreviewContainer disabled disabledMessage="Create a site to begin" />
          <PublishSiteContainer state="disabled" disabledMessage="Create a site to begin" />
        </RightSection>
      </LayoutContainer>
    </ComponentContent>
  </ComponentContainer>
);

export default EmptyView;
