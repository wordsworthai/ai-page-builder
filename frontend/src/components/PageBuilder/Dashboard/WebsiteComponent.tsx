import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebsiteData } from '@/hooks/api/PageBuilder/Websites/useWebsiteData';
import { usePageGenerationStatus } from '@/streaming/hooks';
import { usePreviewCompilation } from '@/hooks/api/PageBuilder/Editor/usePreviewCompilation';
import { useGenerationRetry } from '@/hooks/api/PageBuilder/Generation/useGenerationRetry';
import type { WebsiteComponentState } from '@/streaming/types/generation';
import { useGenerationState } from '@/context/generation_state/useGenerationState';
import { useEffectiveGenerationId } from './hooks/useEffectiveGenerationId';
import { useCompilationKeySync } from './hooks/useCompilationKeySync';
import { useDashboardStateMachine } from './hooks/useDashboardStateMachine';
import { useGenerationCompletionHandler } from './hooks/useGenerationCompletionHandler';
import { useDashboardErrorEffect } from './hooks/useDashboardErrorEffect';
import { getLastSuccessfulGenerationId } from './WebsiteComponent/utils';
import {
  CheckingView,
  EmptyView,
  GeneratingView,
  CompilingView,
  ReadyView,
  ErrorView,
  InitializingView,
} from './WebsiteComponent/views';

const getCompilationKey = (generationId: string | undefined) =>
  generationId ? `compilation_triggered_${generationId}` : null;

const WebsiteComponent: React.FC = () => {
  const navigate = useNavigate();
  const { clearActiveGeneration } = useGenerationState();

  const [componentState, setComponentState] = useState<WebsiteComponentState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasTriggeredCompilation, setHasTriggeredCompilation] = useState(false);

  const {
    effectiveGenerationId,
    generationIdFromContext,
    getEffectiveGenerationIdForNavigation,
    shouldPollGeneration,
  } = useEffectiveGenerationId();

  const { data: websiteData, isLoading: isLoadingWebsite } = useWebsiteData();

  const {
    data: generationStatus,
    isLoading: isPolling,
    isError: pollingError,
    error: pollingErrorDetail,
  } = usePageGenerationStatus({
    generationId: effectiveGenerationId,
    enabled: shouldPollGeneration,
  });
  const { compilePreview, compilationStatus, error: compilationError } = usePreviewCompilation();

  const { mutate: retryGeneration, isPending: isRetrying } = useGenerationRetry({
    onSuccess: () => {
      setComponentState('generating');
      setErrorMessage(null);
    },
  });

  useCompilationKeySync({ effectiveGenerationId, setHasTriggeredCompilation });

  useDashboardStateMachine({
    websiteData,
    isLoadingWebsite,
    generationStatus,
    isPolling,
    effectiveGenerationId,
    generationIdFromContext,
    componentState,
    setComponentState,
    setErrorMessage,
  });

  useGenerationCompletionHandler({
    generationStatus,
    effectiveGenerationId,
    componentState,
    hasTriggeredCompilation,
    setHasTriggeredCompilation,
    setComponentState,
    setErrorMessage,
    websiteData,
  });

  useDashboardErrorEffect({
    componentState,
    pollingError,
    pollingErrorDetail,
    compilationError,
    setComponentState,
    setErrorMessage,
  });

  const isCompilationError = errorMessage === 'compilation_failed' ||
    (errorMessage?.includes('compile') ?? false) ||
    (errorMessage?.includes('preview') ?? false);

  const handleRetryCompilation = async () => {
    if (!effectiveGenerationId) return;

    const key = getCompilationKey(effectiveGenerationId);
    if (key) {
      localStorage.removeItem(key);
    }

    setHasTriggeredCompilation(false);
    setErrorMessage(null);
    setComponentState('compiling');

    try {
      const result = await compilePreview(effectiveGenerationId);
      setComponentState('ready');
      navigate(`/editor/${result.generation_version_id}`);
    } catch {
      setErrorMessage('compilation_failed');
      setComponentState('error');
    }
  };

  const handleRetry = () => {
    if (!effectiveGenerationId) {
      handleCreateWebsite();
      return;
    }

    const key = getCompilationKey(effectiveGenerationId);
    if (key) {
      localStorage.removeItem(key);
    }

    retryGeneration(effectiveGenerationId);
  };

  const handleCreateWebsite = () => {
    try {
      navigate('/create-site');
    } catch (error) {
      console.error('Navigation failed:', error);
      // Fallback
      window.location.href = '/create-site';
    }
  };

  if (componentState === 'checking') {
    return <CheckingView />;
  }

  if (componentState === 'empty') {
    return <EmptyView />;
  }

  if (componentState === 'generating' && generationStatus) {
    return (
      <GeneratingView
        generationStatus={generationStatus}
        onOpenEditor={() => {
          const id = getEffectiveGenerationIdForNavigation();
          if (id) navigate(`/editor/${id}`);
        }}
      />
    );
  }

  if (componentState === 'compiling') {
    return <CompilingView compilationStatus={compilationStatus} />;
  }

  if (componentState === 'ready' && websiteData && websiteData.homepage.current_generation_id) {
    const isPublished = websiteData.homepage.is_published;
    const previewLink = isPublished
      ? (websiteData.homepage.last_cloudfront_url ?? websiteData.homepage.preview_link ?? '')
      : (websiteData.homepage.preview_link ?? '');
    const publishedUrl = websiteData.homepage.last_cloudfront_url ?? undefined;
    const generationId =
      getEffectiveGenerationIdForNavigation() || websiteData.homepage.current_generation_id;

    return (
      <ReadyView
        previewLink={previewLink}
        generationId={generationId}
        lastEditedAt={websiteData.homepage.last_edited_at}
        lastPublishedAt={websiteData.homepage.last_published_at}
        isPublished={isPublished}
        publishedUrl={publishedUrl}
      />
    );
  }

  if (componentState === 'error') {
    return (
      <ErrorView
        errorMessage={errorMessage}
        lastSuccessfulGenerationId={getLastSuccessfulGenerationId(websiteData)}
        isRetrying={isRetrying}
        isCompilationError={isCompilationError}
        onRetry={isCompilationError ? handleRetryCompilation : handleRetry}
        onGoToLastVersion={() => {
          const lastId = getLastSuccessfulGenerationId(websiteData);
          if (lastId) {
            clearActiveGeneration();
            navigate(`/editor/${lastId}`);
          }
        }}
        onGoToEditor={isCompilationError && effectiveGenerationId ? () => {
          navigate(`/editor/${effectiveGenerationId}`);
        } : undefined}
        onStartOver={handleCreateWebsite}
      />
    );
  }

  return <InitializingView />;
};

export default WebsiteComponent;