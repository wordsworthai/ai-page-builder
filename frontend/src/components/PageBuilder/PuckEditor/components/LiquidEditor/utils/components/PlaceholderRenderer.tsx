import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createUsePuck } from '@measured/puck';
import { Loader2, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { 
  generateComponentConfig, 
  type LiquidCodeProps 
} from './LiquidComponent';
import type { 
  PlaceholderRendererProps,
} from '../../SectionAddition.types';
import { getLiquidComponentKey } from '../dynamicPuckSectionConfig';
import { extractDisplayName } from '../hooks/editorDataProvider';
import { ROOT_ZONE_COMPOUNDS } from './createPuckRoot';

const usePuck = createUsePuck();

export type PlaceholderState = 'loading' | 'loaded' | 'replacing' | 'error';

/**
 * PlaceholderRenderer is rendered INSIDE the Puck component tree.
 * It has access to usePuck() and can dispatch actions to update data.
 * 
 * Lifecycle:
 * 1. On mount, fetches section data
 * 2. Once data is loaded, calls onRegisterComponent to add real component to config
 * 3. Dispatches setData action to replace placeholder with real component
 * 4. Component unmounts as Puck replaces it with the real section
 */
export const PlaceholderRenderer: React.FC<PlaceholderRendererProps> = ({
  section_id,
  display_name,
  category_key,
  id,
  fetchSectionData,
  onRegisterComponent,
}) => {
  const [state, setState] = useState<PlaceholderState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasStartedLoading = useRef(false);
  const hasTriggeredReplacement = useRef(false);

  const dispatch = usePuck((s) => s.dispatch);
  const appState = usePuck((s) => s.appState);

  /**
   * Fetch section data and replace placeholder with real component
   */
  const loadAndReplace = useCallback(async () => {
    if (!fetchSectionData) {
      console.warn('[PlaceholderRenderer] No fetchSectionData function provided');
      setState('error');
      setErrorMessage('Section loading not configured');
      return;
    }

    if (hasTriggeredReplacement.current) {
      console.log('[PlaceholderRenderer] Replacement already triggered, skipping');
      return;
    }

    try {
      setState('loading');
      setErrorMessage(null);

      // Fetch section data
      const sectionData = await fetchSectionData(section_id);
      
      if (!sectionData) {
        throw new Error('Section data not found');
      }

      setState('loaded');
      
      // Register the real component in config (if callback provided)
      // Use sectionData.section_id (actual section ID from API response, may have suffix)
      // instead of section_id prop (original ID) to ensure correct component registration
      const actualSectionId = sectionData.section_id || sectionData.liquid_section_id || section_id;
      const componentKey = getLiquidComponentKey(actualSectionId);
      
      if (onRegisterComponent) {
        const liquidProps: LiquidCodeProps = {
          liquid_section_type: sectionData.liquid_section_type,
          liquid_section_set: sectionData.liquid_section_set,
          liquid_section_name: sectionData.liquid_section_name,
          liquid_section_id: sectionData.liquid_section_id,
          liquid_data_puck: sectionData.liquid_data_puck,
          liquid_data_schema: sectionData.liquid_data_schema,
          liquid_section: sectionData.liquid_section,
          liquid_section_compiler_dependencies: sectionData.liquid_section_compiler_dependencies,
        };
        
        const componentConfig = generateComponentConfig(extractDisplayName(sectionData.liquid_section_name), liquidProps);
        onRegisterComponent(componentKey, componentConfig);
      } else {
        console.warn('[PlaceholderRenderer] onRegisterComponent is not provided! Component will not be registered.');
      }

      setState('replacing');
      hasTriggeredReplacement.current = true;

      // Parse liquid data for default props
      let parsedPuckData = {};
      try {
        parsedPuckData = JSON.parse(sectionData.liquid_data_puck);
      } catch (e) {
        console.error('[PlaceholderRenderer] Failed to parse liquid_data_puck:', e);
      }

      // Create new props for the real component
      // Use actualSectionId to ensure consistency with component registration
      const newProps = {
        id, // Keep the same ID to maintain position
        liquid_section_type: sectionData.liquid_section_type,
        liquid_section_set: sectionData.liquid_section_set,
        liquid_section_name: sectionData.liquid_section_name,
        liquid_section_id: actualSectionId, // Use actual section ID from response
        liquid_data_puck: sectionData.liquid_data_puck,
        liquid_data_schema: sectionData.liquid_data_schema,
        liquid_section: sectionData.liquid_section,
        liquid_section_compiler_dependencies: sectionData.liquid_section_compiler_dependencies,
        ...parsedPuckData,
      };

      // Determine which zone this placeholder lives in (body vs header/footer)
      const node = (appState as any)?.indexes?.nodes?.[id];
      const zoneCompound = node ? `${node.parentId}:${node.zone}` : null;

      // Dispatch setData to replace this placeholder with the real component
      // Replace in the correct location: content (body) or zones (header/footer)
      dispatch({
        type: 'setData',
        data: (prevData: any) => {
          // Decide if the section to update is in main zone (sections) or 
          // in a header/footer zone.
          // Main section exists in root, whereas header/footer sections exist in zones.
          // This is used to update the correct zone in the puck editor.
          const replacement = { type: componentKey, props: newProps };

          if (zoneCompound === ROOT_ZONE_COMPOUNDS.sections) {
            // Body sections live in content
            const newContent = (prevData.content ?? []).map((item: any) =>
              item.props?.id === id ? replacement : item
            );
            return { ...prevData, content: newContent };
          }

          if (zoneCompound && prevData.zones?.[zoneCompound]) {
            // Header/footer live in zones
            const zoneItems = prevData.zones[zoneCompound];
            const newZoneItems = zoneItems.map((item: any) =>
              item.props?.id === id ? replacement : item
            );
            return {
              ...prevData,
              zones: { ...prevData.zones, [zoneCompound]: newZoneItems },
            };
          }

          // Fallback: replace in content (backward compatibility)
          const newContent = (prevData.content ?? []).map((item: any) =>
            item.props?.id === id ? replacement : item
          );
          return { ...prevData, content: newContent };
        },
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load section';
      console.error(`[PlaceholderRenderer] Error loading section ${section_id}:`, error);
      setState('error');
      setErrorMessage(errorMsg);
      hasTriggeredReplacement.current = false;
    }
  }, [section_id, id, dispatch, appState, fetchSectionData, onRegisterComponent]);

  /**
   * Retry loading after an error
   */
  const handleRetry = useCallback(() => {
    hasStartedLoading.current = false;
    hasTriggeredReplacement.current = false;
    loadAndReplace();
  }, [loadAndReplace]);

  // Start loading on mount
  useEffect(() => {
    if (!hasStartedLoading.current) {
      hasStartedLoading.current = true;
      loadAndReplace();
    }
  }, [loadAndReplace]);

  return (
    <div 
      className="placeholder-renderer"
      data-placeholder-id={id}
      data-section-id={section_id}
      data-state={state}
      style={{
        position: 'relative',
        minHeight: '200px',
        width: '100%',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Blur overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          zIndex: 10,
        }}
      >
        {state === 'loading' && <LoadingContent displayName={display_name} />}
        {state === 'loaded' && <LoadedContent displayName={display_name} />}
        {state === 'replacing' && <ReplacingContent displayName={display_name} />}
        {state === 'error' && (
          <ErrorContent 
            displayName={display_name} 
            errorMessage={errorMessage}
            onRetry={handleRetry}
          />
        )}
      </div>

      {/* Skeleton background */}
      <SkeletonBackground categoryKey={category_key} />
    </div>
  );
};

// Loading state content
const LoadingContent: React.FC<{ displayName: string }> = ({ displayName }) => (
  <>
    <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mb-4">
      <Loader2 size={24} className="animate-spin text-[#8E94F2]" />
    </div>
    <h3 className="text-sm font-semibold text-gray-900 mb-1 text-center">
      Loading Section
    </h3>
    <p className="text-xs text-gray-500 text-center">
      {displayName} is being loaded...
    </p>
  </>
);

// Loaded state content (brief)
const LoadedContent: React.FC<{ displayName: string }> = ({ displayName }) => (
  <>
    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
      <CheckCircle size={24} className="text-green-500" />
    </div>
    <h3 className="text-sm font-semibold text-gray-900 mb-1 text-center">
      Section Loaded
    </h3>
    <p className="text-xs text-gray-500 text-center">
      Preparing {displayName}...
    </p>
  </>
);

// Replacing state content
const ReplacingContent: React.FC<{ displayName: string }> = ({ displayName }) => (
  <>
    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
      <Loader2 size={24} className="animate-spin text-blue-500" />
    </div>
    <h3 className="text-sm font-semibold text-gray-900 mb-1 text-center">
      Adding Section
    </h3>
    <p className="text-xs text-gray-500 text-center">
      Rendering {displayName}...
    </p>
  </>
);

// Error state content
const ErrorContent: React.FC<{ 
  displayName: string; 
  errorMessage: string | null;
  onRetry: () => void;
}> = ({ displayName, errorMessage, onRetry }) => (
  <>
    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
      <AlertCircle size={24} className="text-red-500" />
    </div>
    <h3 className="text-sm font-semibold text-gray-900 mb-1 text-center">
      Failed to Load
    </h3>
    <p className="text-xs text-gray-500 text-center mb-4">
      {errorMessage || `Unable to load ${displayName}`}
    </p>
    <button
      onClick={onRetry}
      className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#8E94F2] rounded-md hover:bg-[#7c82e6] transition-colors"
    >
      <RefreshCw size={14} />
      Retry
    </button>
  </>
);

// Skeleton background based on category
const SkeletonBackground: React.FC<{ categoryKey: string }> = ({ categoryKey }) => {
  const getLayout = () => {
    switch (categoryKey) {
      case 'navigation_bar':
      case 'header':
        return (
          <div className="p-4 flex justify-between items-center">
            <div className="w-24 h-6 bg-gray-200 rounded" />
            <div className="flex gap-4">
              {[1, 2, 3].map(i => <div key={i} className="w-16 h-4 bg-gray-200 rounded" />)}
            </div>
          </div>
        );
      case 'banner':
        return (
          <div className="p-8 text-center">
            <div className="w-1/2 h-8 bg-gray-200 rounded mx-auto mb-4" />
            <div className="w-2/3 h-4 bg-gray-200 rounded mx-auto mb-6" />
            <div className="w-32 h-10 bg-gray-200 rounded mx-auto" />
          </div>
        );
      case 'footer':
        return (
          <div className="p-6 flex justify-between">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex-1 px-4">
                <div className="w-20 h-4 bg-gray-200 rounded mb-3" />
                {[1, 2, 3].map(j => <div key={j} className="w-full h-3 bg-gray-200 rounded mb-2" />)}
              </div>
            ))}
          </div>
        );
      default:
        return (
          <div className="p-6">
            <div className="w-1/3 h-6 bg-gray-200 rounded mx-auto mb-6" />
            <div className="flex gap-6 justify-center">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-48">
                  <div className="w-full aspect-video bg-gray-200 rounded mb-3" />
                  <div className="w-3/4 h-4 bg-gray-200 rounded mb-2" />
                  <div className="w-full h-3 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return <div className="opacity-50">{getLayout()}</div>;
};

export default PlaceholderRenderer;
