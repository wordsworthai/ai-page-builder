import React from 'react';
import { ComponentContainer, ComponentTitle, ComponentContent } from '../../ComponentContainer';
import { PreviewIframe } from '../../PreviewIframe';
import EditorPreviewContainer from '../../EditorPreviewContainer';
import PublishSiteContainer from '../../PublishSiteContainer';
import { LayoutContainer, LeftSection, RightSection } from '../Layout';

interface ReadyViewProps {
  previewLink: string;
  generationId: string;
  lastEditedAt: string | null | undefined;
  lastPublishedAt: string | null | undefined;
  isPublished: boolean;
  publishedUrl?: string;
}

const ReadyView: React.FC<ReadyViewProps> = ({
  previewLink,
  generationId,
  lastEditedAt,
  lastPublishedAt,
  isPublished,
  publishedUrl,
}) => {
  const publishState: 'disabled' | 'unpublished' | 'published' = isPublished ? 'published' : 'unpublished';

  return (
    <ComponentContainer>
      <ComponentTitle>Your website</ComponentTitle>
      <ComponentContent>
        <LayoutContainer>
          <LeftSection>
            <PreviewIframe previewLink={previewLink} />
          </LeftSection>
          <RightSection>
            <EditorPreviewContainer
              generationVersionId={generationId}
              lastEditedAt={lastEditedAt}
            />
            <PublishSiteContainer
              state={publishState}
              publishedUrl={publishedUrl}
              generationVersionId={generationId}
              lastPublishedAt={lastPublishedAt}
            />
          </RightSection>
        </LayoutContainer>
      </ComponentContent>
    </ComponentContainer>
  );
};

export default ReadyView;
