import React, { createContext, useContext } from 'react';

export interface SectionRegenerationContextValue {
  openRegenModal: (sectionId: string, sectionIndex: number) => void;
  generationVersionId: string | undefined;
}

const SectionRegenerationContext = createContext<SectionRegenerationContextValue | null>(null);

interface SectionRegenerationProviderProps {
  value: SectionRegenerationContextValue;
  children: React.ReactNode;
}

/**
 * Provider for section regeneration - openRegenModal and generationVersionId.
 * Used by StructuralActionBarOverride and useSectionAddition to trigger section regen
 * without flowing through setEditorSectionActionBarOverride (breaks cyclic dependency).
 */
export function SectionRegenerationProvider({ value, children }: SectionRegenerationProviderProps) {
  return (
    <SectionRegenerationContext.Provider value={value}>
      {children}
    </SectionRegenerationContext.Provider>
  );
}

/**
 * Hook to access section regeneration context.
 * Returns null when outside provider (e.g. StructuralActionBarOverride fallback).
 */
export function useSectionRegenerationContext(): SectionRegenerationContextValue | null {
  return useContext(SectionRegenerationContext);
}
