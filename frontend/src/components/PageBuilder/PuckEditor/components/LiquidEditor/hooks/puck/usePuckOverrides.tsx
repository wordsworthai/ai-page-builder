import React from 'react';
import { useMemo, useCallback, useRef } from 'react';
import { IframeContentSwitcher } from '../../views/iframes/IframeContentSwitcher';
import { CleanLoadingIframeOverride } from '../../views/iframes/CleanLoadingIframeOverride';
import { ErrorStateIframeOverride } from '../../views/iframes/ErrorStateIframeOverride';
import { GeneratingIframeOverride } from '../../views/iframes/GeneratingIframeOverride';
import type { EditorState } from './usePuckConfig';
import type { IframeContentType } from '../ui/useIframeContent';
import type { GenerationStatus } from '@/streaming/types/generation';

// Memoized override to prevent re-renders
const componentsOverride = () => null;

interface UsePuckOverridesParams {
  editorState: EditorState;
  iframeContentType: IframeContentType;
  isDirectLoad?: boolean;
  // Generation status determines what iframe content to show.
  generationStatus?: GenerationStatus;
  /** When true, shows overlay and animation for updating existing template */
  updateTemplateGenerationOverlayOverride?: boolean;
  templateConfig?: any;
  templateData?: any;
  fieldTypes: any;
  overrides?: any; // For ready mode
  onBackToDashboard: () => void;
  onRetry?: () => void;
  onStartOver?: () => void;
  onOpenContactSupport?: () => void;
}

/**
 * Hook to build Puck overrides based on editor state.
 *
 * Iframe override uses refs so the callback reference stays stable across
 * ready→generating transition. Puck's Preview does `Frame = useMemo(() => overrides.iframe, [overrides])`;
 * when overrides.iframe changes reference, Puck unmounts/remounts the iframe content → template flicker.
 * By keeping iframeOverride stable and reading from refs, we avoid remounts.
 */
export function usePuckOverrides({
  editorState,
  iframeContentType,
  isDirectLoad = false,
  generationStatus,
  updateTemplateGenerationOverlayOverride = false,
  templateConfig,
  templateData,
  fieldTypes,
  overrides,
  onBackToDashboard,
  onRetry,
  onStartOver,
  onOpenContactSupport,
}: UsePuckOverridesParams): any {
  // Iframe Override - uses refs for editorState/iframeContentType so the callback reference stays stable
  // across ready→generating transition. Puck unmounts iframe when overrides.iframe changes reference.
  const templateConfigRef = useRef(templateConfig);
  const templateDataRef = useRef(templateData);
  const generationStatusRef = useRef(generationStatus);
  const editorStateRef = useRef(editorState);
  const iframeContentTypeRef = useRef(iframeContentType);
  const updateTemplateGenerationOverlayOverrideRef = useRef(updateTemplateGenerationOverlayOverride);

  // Update refs synchronously so iframeOverride reads latest when invoked
  templateConfigRef.current = templateConfig;
  templateDataRef.current = templateData;
  generationStatusRef.current = generationStatus;
  editorStateRef.current = editorState;
  iframeContentTypeRef.current = iframeContentType;
  updateTemplateGenerationOverlayOverrideRef.current = updateTemplateGenerationOverlayOverride;

  const iframeOverride = useCallback(
    (props: any) => {
      const currentEditorState = editorStateRef.current;
      const currentIframeContentType = iframeContentTypeRef.current;
      const currentTemplateConfig = templateConfigRef.current;
      const currentTemplateData = templateDataRef.current;
      const currentGenerationStatus = generationStatusRef.current;
      // Error state: invalid generation ID
      if (currentEditorState === 'error') {
        return (
          <ErrorStateIframeOverride
            title="Invalid Generation ID"
            message="The generation ID in the URL is invalid or not found."
            onBackToDashboard={onBackToDashboard}
          />
        );
      }

      // Error state: ready but no template data
      if (currentEditorState === 'ready' && (!currentTemplateConfig || !currentTemplateData)) {
        return (
          <ErrorStateIframeOverride
            title="No Template Data"
            message="Unable to load template configuration"
            onBackToDashboard={onBackToDashboard}
          />
        );
      }

      // All checking (create-site and try-another-layout): show light starting state until status returns
      if (currentEditorState === 'checking') {
        return (
          <CleanLoadingIframeOverride
            document={props.document}
            title="Starting…"
            subtitle="Checking status…"
          />
        );
      }

      if (currentEditorState === 'loading') {
        if (currentTemplateData) {
          return (
            <IframeContentSwitcher
              key="iframe-content-switcher"
              contentType={currentIframeContentType}
              updateTemplateGenerationOverlayOverride={updateTemplateGenerationOverlayOverrideRef.current}
              document={props.document}
              isDirectLoad={isDirectLoad}
            >
              {props.children}
            </IframeContentSwitcher>
          );
        }
        return (
          <CleanLoadingIframeOverride
            document={props.document}
            title="Loading your website..."
            subtitle="Fetching template data"
          />
        );
      }

      if (currentEditorState === 'generating') {
        if (currentGenerationStatus?.status === 'failed') {
          return (
            <GeneratingIframeOverride
              generationStatus={currentGenerationStatus}
              onRetry={onRetry}
              onStartOver={onStartOver}
              onOpenContactSupport={onOpenContactSupport}
            />
          );
        }
        return (
          <IframeContentSwitcher
            key="iframe-content-switcher"
            contentType={currentIframeContentType}
            updateTemplateGenerationOverlayOverride={updateTemplateGenerationOverlayOverrideRef.current}
            document={props.document}
            isDirectLoad={isDirectLoad}
          >
            {props.children}
          </IframeContentSwitcher>
        );
      }

      // Ready state: use IframeContentSwitcher to handle blur overlay fade-out
      // Also shows overlay template is being updated.
      if (currentEditorState === 'ready') {
        return (
          <IframeContentSwitcher
            key="iframe-content-switcher"
            contentType={currentIframeContentType}
            updateTemplateGenerationOverlayOverride={updateTemplateGenerationOverlayOverrideRef.current}
            document={props.document}
            isDirectLoad={isDirectLoad}
          >
            {props.children}
          </IframeContentSwitcher>
        );
      }

      return props.children;
    },
    [
      isDirectLoad,
      // Don't include editorState/iframeContentType/templateConfig/templateData/generationStatus/
      // updateTemplateGenerationOverlayOverride - we use refs so the callback stays stable across
      // ready→generating and processing→failed. Puck unmounts iframe when overrides.iframe
      // reference changes; stable ref = no flicker.
      onBackToDashboard,
      onRetry,
      onStartOver,
      onOpenContactSupport,
    ]
  );

  // Components Override
  // When we have template, NEVER hide it - keep visible during ready, generating (section regen),
  // and loading (fetching new template after regen).
  const componentsOverrideValue = useMemo(() => {
    const hasTemplate = !!(templateConfig && templateData);

    // Error states: no components
    if (editorState === 'error' || (editorState === 'ready' && !hasTemplate)) {
      return componentsOverride;
    }

    // Checking: no template yet (initial load)
    if (editorState === 'checking') {
      return componentsOverride;
    }
    // Loading: only hide when NO template. When we have template (e.g. fetching new after regen),
    // keep it visible to avoid flash.
    if (editorState === 'loading' && !hasTemplate) {
      return componentsOverride;
    }
    // Generating: only hide when NO template (full generation). Section regen keeps template visible.
    if (editorState === 'generating' && !hasTemplate) {
      return componentsOverride;
    }
    return undefined;
  }, [editorState, templateConfig, templateData]);

  // Build overrides object.
  // CACHE: When generating with template, return the same merged object to avoid Puck re-renders
  // from status polling (overrides reference changes). This prevents template flicker.
  const buildMerged = useCallback(() => {
    const baseOverrides: any = {
      fieldTypes: fieldTypes,
    };
    baseOverrides.iframe = iframeOverride;
    if (componentsOverrideValue) {
      baseOverrides.components = componentsOverrideValue;
    }
    if (overrides) {
      const { iframe: _externalIframe, components: _externalComponents, ...restOverrides } =
        overrides;
      const merged = { ...baseOverrides, ...restOverrides };
      if (componentsOverrideValue) {
        merged.components = componentsOverrideValue;
      }
      return merged;
    }
    return baseOverrides;
  }, [fieldTypes, iframeOverride, componentsOverrideValue, overrides]);

  const cacheRef = useRef<{ merged: any } | null>(null);
  const readyCacheRef = useRef<{ merged: any } | null>(null);
  const prevUpdateOverlayRef = useRef(updateTemplateGenerationOverlayOverride);

  const puckOverrides = useMemo(() => {
    // Invalidate ready cache when overlay override changes (e.g. partial regen fails → overlay must disappear)
    if (prevUpdateOverlayRef.current !== updateTemplateGenerationOverlayOverride) {
      prevUpdateOverlayRef.current = updateTemplateGenerationOverlayOverride;
      readyCacheRef.current = null;
    }

    const hasTemplate = !!(templateConfig && templateData);
    const isGeneratingWithTemplate =
      editorState === 'generating' && hasTemplate && !componentsOverrideValue;
    const isReadyWithTemplate =
      editorState === 'ready' && hasTemplate && !componentsOverrideValue;

    // CACHE only when ALREADY in generating. On first transition ready→generating, build NEW
    // so Puck receives new overrides ref → store updates → Preview re-renders → Frame invoked
    // with fresh refs (contentType='generating') → animation shows. No flicker because iframe
    // function is stable (refs); Puck only re-invokes Frame, doesn't remount iframe.
    if (isGeneratingWithTemplate && cacheRef.current) {
      return cacheRef.current.merged;
    }

    // CACHE when in ready state with template. Prevents overrides churn on every keystroke
    // (templateData changes) which would cause Puck/Fields to re-render and input to lose focus.
    if (isReadyWithTemplate && readyCacheRef.current) {
      return readyCacheRef.current.merged;
    }

    const merged = buildMerged();
    if (isGeneratingWithTemplate) {
      cacheRef.current = { merged };
      readyCacheRef.current = null;
    } else if (isReadyWithTemplate) {
      readyCacheRef.current = { merged };
      cacheRef.current = null;
    } else {
      cacheRef.current = null;
      readyCacheRef.current = null;
    }
    return merged;
  }, [editorState, templateConfig, templateData, componentsOverrideValue, buildMerged, updateTemplateGenerationOverlayOverride]);

  return puckOverrides;
}
