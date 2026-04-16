import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useGenerationTemplates } from '@/hooks/api/PageBuilder/Generation/useGenerationTemplates';
import { useSelectedTemplate } from '@/hooks/api/PageBuilder/Editor/useSelectedTemplate';
import type { TemplateOption } from '@/hooks/api/PageBuilder/Generation/useGenerationTemplates';
import { useGenerationState } from '@/context/generation_state/useGenerationState';
import SectionPreviewRenderer from '../components/SectionPreviewRenderer';
import { CreditConfirmationModal } from './SidebarModal/editor/CreditConfirmationModal';

interface BrowseTemplatesModalProps {
  open: boolean;
  onClose: () => void;
  sourceGenerationVersionId: string;
}

const STACK_PREVIEW_WIDTH = 200;
const STACK_PREVIEW_MAX_HEIGHT = 240;
const STACK_SEGMENT_HEIGHT = 40;
const STACK_GAP = 2;

const LARGE_PREVIEW_WIDTH = 520;
const LARGE_PREVIEW_MAX_HEIGHT = 720;
const LARGE_SEGMENT_HEIGHT = 120;

interface StackedSectionPreviewProps {
  sectionDesktopUrls: string[];
  sectionIds?: string[];
  altPrefix?: string;
  width?: number;
  maxHeight?: number;
  segmentHeight?: number;
  gap?: number;
  /** 'cover' fills the segment (may crop); 'contain' shows full image (less squished in large preview) */
  objectFit?: 'cover' | 'contain';
}

/**
 * Stacked section preview: vertical strip of section desktop images.
 * Falls back to a placeholder when URLs are missing or an image fails to load.
 */
function StackedSectionPreview({
  sectionDesktopUrls,
  sectionIds,
  altPrefix = 'Section',
  width = STACK_PREVIEW_WIDTH,
  maxHeight = STACK_PREVIEW_MAX_HEIGHT,
  segmentHeight = STACK_SEGMENT_HEIGHT,
  gap = STACK_GAP,
  objectFit = 'cover',
}: StackedSectionPreviewProps) {
  const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set());
  const validUrls = sectionDesktopUrls.filter(Boolean);
  const count = validUrls.length;
  const totalHeight = count * segmentHeight + (count - 1) * gap;

  if (count === 0) return null;

  return (
    <div
      className="flex flex-col rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shrink-0"
      style={{ width, maxHeight, height: Math.min(totalHeight, maxHeight) }}
      role="img"
      aria-label={`Layout preview: ${count} sections`}
    >
      {validUrls.map((url, idx) => (
        <div
          key={`${url}-${idx}`}
          className="w-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0"
          style={{
            height: segmentHeight,
            minHeight: segmentHeight,
            marginBottom: idx < validUrls.length - 1 ? gap : 0,
          }}
        >
          {failedIndices.has(idx) ? (
            <span className="text-gray-400 text-xs">Section {idx + 1}</span>
          ) : (
            <img
              src={url}
              alt={`${altPrefix} ${idx + 1} preview`}
              className={`w-full h-full ${objectFit === 'contain' ? 'object-contain' : 'object-cover'} bg-gray-100`}
              loading="lazy"
              decoding="async"
              onError={() => setFailedIndices((prev) => new Set(prev).add(idx))}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Modal to browse and choose a different cached template (use-template).
 * Lists the 3 options from smb_section_cache with stacked section previews and marks the current one.
 * On "Use this template" for a different option, creates a new generation and redirects.
 */
export const BrowseTemplatesModal: React.FC<BrowseTemplatesModalProps> = ({
  open,
  onClose,
  sourceGenerationVersionId,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setActiveGeneration } = useGenerationState();
  const [previewOption, setPreviewOption] = useState<TemplateOption | null>(null);
  const [creditConfirmOption, setCreditConfirmOption] = useState<TemplateOption | null>(null);
  const { data, isLoading, error } = useGenerationTemplates(sourceGenerationVersionId, open);
  const { mutateAsync: triggerGen, isPending: isUsingTemplate } = useSelectedTemplate({
    onSuccess: (res) => {
      const newId = res.generation_version_id;
      // Invalidate credit queries after successful generation
      queryClient.invalidateQueries({ queryKey: ['creditsBalance'] });
      queryClient.invalidateQueries({ queryKey: ['creditsInfo'] });
      queryClient.invalidateQueries({ queryKey: ['creditTransactions'] });
      // Set generation state in context
      setActiveGeneration({
        generationVersionId: newId,
        type: 'from-template',
        fromUseTemplate: true
      });
      onClose();
      navigate(`/editor/${newId}`, {
        replace: true,
      });
    },
  });

  const handleUseTemplate = async (option: TemplateOption) => {
    if (!option.section_ids || option.section_ids.length === 0) {
      console.error('[BrowseTemplatesModal] No section_ids found for template:', option.template_id);
      return;
    }
    try {
      await triggerGen({
        source_generation_version_id: sourceGenerationVersionId,
        section_ids: option.section_ids,
        intent: option.intent,
      });
    } catch {
      // Error handled by useSelectedTemplate onError
    }
  };

  if (!open) return null;

  const modalContent = (
    <>
      <div className="fixed inset-0 z-100 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
        <div className="relative bg-white rounded-xl shadow-xl w-[90vw] h-[90vh] flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Browse templates</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded"
              aria-label="Close"
            >
              <span className="text-xl leading-none">×</span>
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-10">
            {data?.templates && data.templates.length > 0 ? (
              (() => {
                const grouped = data.templates.reduce((acc, t) => {
                  const intent = t.intent || 'Other';
                  if (!acc[intent]) acc[intent] = [];
                  acc[intent].push(t);
                  return acc;
                }, {} as Record<string, typeof data.templates>);

                return Object.entries(grouped).map(([intent, templates]) => {
                  const isIntentCurrent = templates.some(t => t.is_current);
                  return (
                    <div key={intent} className="flex flex-col gap-6">
                      <div className="flex items-center gap-2 px-1">
                        <h3 className="text-lg font-bold text-gray-900 capitalize">
                          {intent.replace(/_/g, ' ')}
                        </h3>
                        {isIntentCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: '#e8e9f2', color: '#434775' }}>
                            Current Intent
                          </span>
                        )}
                      </div>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map((option) => {
                          const urls = option.section_desktop_urls || [];
                          // Show only the 2nd section image. Fallback to 1st if no 2nd exists.
                          const cardPreviewUrl = urls.length > 1 ? urls[1] : urls[0];
                          const hasPreviews = Boolean(cardPreviewUrl);

                          return (
                            <li
                              key={option.template_id}
                              onClick={() => setPreviewOption(option)}
                              className="flex flex-col gap-4 border border-gray-200 rounded-xl p-4 transition-all hover:shadow-md hover:bg-gray-50/50 cursor-pointer group"
                              style={{ transition: 'all 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#434775'}
                              onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
                            >
                              <div className="flex justify-center w-full">
                                {hasPreviews ? (
                                  <div
                                    className="w-full flex justify-center rounded-lg border-2 border-transparent transition-colors overflow-hidden"
                                    aria-hidden
                                  >
                                    <StackedSectionPreview
                                      sectionDesktopUrls={[cardPreviewUrl as string]}
                                      sectionIds={option.section_ids ? [option.section_ids[urls.length > 1 ? 1 : 0]] : undefined}
                                      altPrefix={option.template_name}
                                      width={STACK_PREVIEW_WIDTH}
                                      segmentHeight={160}
                                      maxHeight={160}
                                      objectFit="cover"
                                    />
                                  </div>
                                ) : (
                                  <div
                                    className="w-full rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center"
                                    style={{ width: STACK_PREVIEW_WIDTH, height: 160 }}
                                    aria-hidden
                                  >
                                    <span className="text-gray-400 text-xs font-bold text-center px-2">
                                      {option.section_count} sections
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-1 text-center min-w-0">
                                <p
                                  className="font-bold text-gray-900 truncate transition-colors"
                                  style={{ color: '#434775' }}
                                >
                                  {option.template_name}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewOption(option);
                                }}
                                className="mt-auto w-full px-4 py-2.5 text-sm font-bold rounded-lg text-white transition-colors"
                                style={{ backgroundColor: '#434775' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#353a5f'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#434775'}
                              >
                                See Preview
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                });
              })()
            ) : (
              !isLoading && (
                <p className="text-sm font-bold text-gray-500 text-center py-12">No other layouts available. Run a full generation first.</p>
              )
            )}
          </div>
        </div>
      </div>

      {/* Larger preview modal */}
      {previewOption && previewOption.section_desktop_urls && previewOption.section_desktop_urls.length > 0 && (
        <div className="fixed inset-0 z-110 flex items-center justify-center" role="dialog" aria-modal aria-labelledby="preview-modal-title">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setPreviewOption(null)}
            aria-hidden
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-[90vw] h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <h3 id="preview-modal-title" className="text-base font-bold text-gray-900">
                {previewOption.template_name} — Preview
              </h3>
              <button
                type="button"
                onClick={() => setPreviewOption(null)}
                className="text-gray-500 hover:text-gray-700 p-1.5 rounded-md hover:bg-gray-100"
                aria-label="Close preview"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 flex justify-center items-start bg-gray-50 min-h-0">
              {previewOption.section_ids && previewOption.section_ids.length > 0 ? (
                <SectionPreviewRenderer
                  sectionIds={previewOption.section_ids as string[]}
                  templateName={previewOption.template_name}
                />
              ) : (
                <StackedSectionPreview
                  sectionDesktopUrls={previewOption.section_desktop_urls as string[]}
                  sectionIds={previewOption.section_ids as string[]}
                  altPrefix={previewOption.template_name}
                  width={LARGE_PREVIEW_WIDTH}
                  maxHeight={LARGE_PREVIEW_MAX_HEIGHT}
                  segmentHeight={LARGE_SEGMENT_HEIGHT}
                  gap={0}
                  objectFit="contain"
                />
              )}
            </div>
            <div className="p-4 border-t border-gray-200 shrink-0 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewOption(null)}
                className="px-3 py-1.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const pending = previewOption;
                  setPreviewOption(null);
                  setCreditConfirmOption(pending);
                }}
                disabled={isUsingTemplate}
                className="px-3 py-1.5 text-sm font-bold rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: isUsingTemplate ? '#434775' : '#434775' }}
                onMouseEnter={(e) => !isUsingTemplate && (e.currentTarget.style.backgroundColor = '#353a5f')}
                onMouseLeave={(e) => !isUsingTemplate && (e.currentTarget.style.backgroundColor = '#434775')}
              >
                {isUsingTemplate ? 'Starting…' : 'Use this template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit confirmation before generation */}
      <CreditConfirmationModal
        open={!!creditConfirmOption}
        onClose={() => setCreditConfirmOption(null)}
        actionType="full_page"
        onConfirm={() => {
          if (creditConfirmOption) {
            const option = creditConfirmOption;
            setCreditConfirmOption(null);
            handleUseTemplate(option);
          }
        }}
        returnOrigin={{
          path: `/editor/${sourceGenerationVersionId}`,
          context: {
            action: 'use_template',
            templateId: creditConfirmOption?.template_id,
          },
        }}
      />
    </>
  );

  return createPortal(modalContent, document.body);
};
