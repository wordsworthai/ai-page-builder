import { useState, useCallback } from 'react';
import type { SidebarHook, SidebarState, SidebarHandlers } from '../../Editor.types';
import type { CategoryResponse } from '@/hooks/api/PageBuilder/Editor/useCategories';

/**
 * Custom hook for managing sidebar modal state and handlers
 * Handles sidebar modal (customise/add modes) and section templates modal
 */
export function useSidebar(): SidebarHook {
  // Sidebar Modal State
  const [sidebarModalOpen, setSidebarModalOpen] = useState(false);
  const [sidebarModalMode, setSidebarModalMode] = useState<'customise' | 'add'>('customise');

  // Section Templates State (now part of sidebar modal)
  const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null);
  const [initialAddTab, setInitialAddTab] = useState<'page' | 'section' | 'headerFooter' | undefined>(undefined);

  // Sidebar Modal Handlers
  const onCustomiseClick = useCallback(() => {
    // Clear selected category when opening customize
    setSelectedCategory(null);
    // Open sidebar in customise mode
    setSidebarModalMode('customise');
    setSidebarModalOpen(true);
  }, []);

  const onAddClick = useCallback(() => {
    // Clear selected category and initial tab when opening add mode
    setSelectedCategory(null);
    setInitialAddTab(undefined);
    // Open sidebar in add mode
    setSidebarModalMode('add');
    setSidebarModalOpen(true);
  }, []);

  const onOpenReplaceHeaderFooter = useCallback(() => {
    setSelectedCategory(null);
    setInitialAddTab('headerFooter');
    setSidebarModalMode('add');
    setSidebarModalOpen(true);
  }, []);

  const onOpenAddSection = useCallback(() => {
    setSelectedCategory(null);
    setInitialAddTab('section');
    setSidebarModalMode('add');
    setSidebarModalOpen(true);
  }, []);

  const onCloseSidebarModal = useCallback(() => {
    setSidebarModalOpen(false);
    setSelectedCategory(null);
    setInitialAddTab(undefined);
  }, []);

  // Section Templates Modal Handlers
  const onCategoryClick = useCallback((category: CategoryResponse) => {
    console.log('[useSidebar] onCategoryClick called with:', category);
    if (!category) {
      console.error('[useSidebar] onCategoryClick called with null/undefined category!');
      return;
    }
    // Open sidebar modal with section templates content
    setSelectedCategory(category);
    setSidebarModalOpen(true);
    setSidebarModalMode('add'); // Use 'add' mode for section templates
    console.log('[useSidebar] State updated - selectedCategory:', category, 'sidebarModalOpen: true');
  }, []);

  const sidebarState: SidebarState = {
    sidebarModalOpen,
    sidebarModalMode,
    selectedCategory,
    initialAddTab,
  };

  const sidebarHandlers: SidebarHandlers = {
    onCustomiseClick,
    onAddClick,
    onCloseSidebarModal,
    onCategoryClick,
    onOpenReplaceHeaderFooter,
    onOpenAddSection,
  };

  return {
    sidebarState,
    sidebarHandlers,
  };
}
