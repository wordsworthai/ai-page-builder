import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, styled, Typography, Button, CircularProgress } from '@mui/material';
import PublishIcon from '@mui/icons-material/Publish';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Language } from '@mui/icons-material';
import { PublishDialog } from '@/components/PageBuilder/Publishing/PublishDialog';
import { useEditorDataProvider } from '@/components/PageBuilder/PuckEditor/components/LiquidEditor/utils';
import { buildCleanHtml } from '@/components/PageBuilder/PuckEditor/components/LiquidEditor/utils/export';
import { useWebsitePages } from '@/hooks/api/PageBuilder/Websites/useWebsitePages';

export interface PageHtmlEntry {
  route: string;
  html: string;
  pageTitle: string;
}

type PublishState = 'disabled' | 'unpublished' | 'published';

interface PublishSiteContainerProps {
  state: PublishState;
  publishedUrl?: string;
  generationVersionId?: string;
  disabledMessage?: string;
  lastPublishedAt?: string | null;
}

const Container = styled(Box)<{ disabled?: boolean }>(({ disabled }) => ({
  flex: '1',
  border: '1px solid rgba(0, 0, 0, 0.1)',
  borderRadius: '8px',
  backgroundColor: disabled ? '#f0f0f0' : '#fafafa',
  minHeight: 0,
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  opacity: disabled ? 0.7 : 1,
}));

const DisabledMessage = styled(Typography)({
  fontSize: '0.875rem',
  color: 'rgba(0, 0, 0, 0.5)',
  fontStyle: 'italic',
});

const ActionButton = styled(Button)(({ theme }) => ({
  width: '100%',
  marginTop: 'auto',
  gap: theme.spacing(1),
}));

const LiveLink = styled(Typography)({
  fontSize: '0.75rem',
  color: 'rgba(0, 0, 0, 0.6)',
  marginTop: '8px',
  wordBreak: 'break-all',
});

const Timestamp = styled(Typography)({
  fontSize: '0.875rem',
  color: 'rgba(0, 0, 0, 0.6)',
  marginBottom: '12px',
});

const getRelativePublishedTime = (dateString: string | null | undefined): string => {
  if (!dateString) { return 'Not published yet'; }
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Last published just now';
  if (diffMins < 60) return `Last published ${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Last published ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Last published ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `Last published ${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `Last published ${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
};

const PublishSiteContainer: React.FC<PublishSiteContainerProps> = ({
  state,
  publishedUrl,
  generationVersionId,
  disabledMessage,
  lastPublishedAt,
}) => {
  // State for direct publish flow
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [pageHtmls, setPageHtmls] = useState<PageHtmlEntry[]>([]);
  const [isGeneratingHtml, setIsGeneratingHtml] = useState(false);
  const [buildProgress, setBuildProgress] = useState('');
  const { fetchTemplateData } = useEditorDataProvider();
  const { data: websitePages } = useWebsitePages();

  const handleDirectPublish = async () => {
    if (!generationVersionId) {
      alert('No generation ID available. Cannot publish.');
      return;
    }
    setIsGeneratingHtml(true);
    setBuildProgress('Preparing to publish...');
    try {
      // Get all pages that have a current_generation_id
      const publishablePages = (websitePages ?? []).filter(
        (p) => p.current_generation_id
      );

      const results: PageHtmlEntry[] = [];

      if (publishablePages.length > 0) {
        // Build HTML for every publishable page (always publish the whole website)
        for (let i = 0; i < publishablePages.length; i++) {
          const page = publishablePages[i];
          setBuildProgress(`Building page ${i + 1} of ${publishablePages.length}: ${page.page_title}...`);
          const { config, data } = await fetchTemplateData(
            page.current_generation_id!,
            "https://www.shopify.com"
          );
          const html = await buildCleanHtml(config, data, {
            title: page.page_title,
            containerClass: "wwai_container",
          });
          results.push({
            route: page.page_path,
            html,
            pageTitle: page.page_title,
          });
        }
      } else {
        // Fallback: no pages loaded yet, use current generationVersionId for homepage
        setBuildProgress('Building homepage...');
        const { config, data } = await fetchTemplateData(
          generationVersionId,
          "https://www.shopify.com"
        );
        const html = await buildCleanHtml(config, data, {
          title: "My Website",
          containerClass: "wwai_container",
        });
        results.push({
          route: '/',
          html,
          pageTitle: 'Home',
        });
      }

      // Set homepage HTML as the preview content
      const homepageHtml = results.find((r) => r.route === '/')?.html ?? results[0]?.html ?? null;
      setGeneratedHtml(homepageHtml);
      setPageHtmls(results);
      setPublishDialogOpen(true);
    } catch (error) {
      console.error('Failed to generate HTML:', error);
      alert('Failed to prepare publish. Please try again.');
    } finally {
      setIsGeneratingHtml(false);
      setBuildProgress('');
    }
  };

  const handleViewLiveSite = () => {
    if (publishedUrl) {
      window.open(publishedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getPublishedMessage = (state: string): string | null => {
    if (state === 'disabled') return null;
    else if (state === 'unpublished') return "Not Published Yet";
    else return getRelativePublishedTime(lastPublishedAt);
  };

  const isDisabled = state === 'disabled';

  return (
    <>
    <Container disabled={isDisabled}>
      {state === 'disabled' && disabledMessage ? (
        <DisabledMessage>{disabledMessage}</DisabledMessage>
        ) : (
          <Timestamp>{getPublishedMessage(state)}</Timestamp>
        )}

      {state === 'disabled' && (
        <ActionButton
          variant="outlined"
          color="primary"
          disabled
          endIcon={<Language fontSize="small" />}
          sx={{ backgroundColor: "#434775", color: 'white !important' }}
        >
          Publish
        </ActionButton>
      )}

      {state === 'unpublished' && (
        <ActionButton
          variant="contained"
          color="primary"
          onClick={handleDirectPublish}
          disabled={isGeneratingHtml}
          startIcon={<PublishIcon fontSize="small" />}
        >
          {isGeneratingHtml ? 'Preparing...' : 'Publish'}
        </ActionButton>
      )}

      {state === 'published' && (
        <>
          <ActionButton
            variant="contained"
            color="primary"
            onClick={handleViewLiveSite}
            endIcon={<OpenInNewIcon fontSize="small" />}
          >
            Take Me
          </ActionButton>
        </>
      )}
    </Container>
    
    {/* Publish Dialog */}
    <PublishDialog
      open={publishDialogOpen}
      onClose={() => {
        setPublishDialogOpen(false);
        setGeneratedHtml(null);
        setPageHtmls([]);
      }}
      htmlContent={generatedHtml}
      pageHtmls={pageHtmls.length > 0 ? pageHtmls : undefined}
    />
    
    {/* Loading Overlay */}
    {isGeneratingHtml && typeof document !== 'undefined' && createPortal(
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1300,
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <p style={{ color: '#374151', fontWeight: 500, margin: 0 }}>
            {buildProgress || 'Preparing to publish...'}
          </p>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

export default PublishSiteContainer;
