import React, { useState, useEffect, useMemo } from 'react';
import { colorCategories, ColorScheme } from '@/components/PageBuilder/CreateSite/colorPaletteConstants';

interface ColorThemeSidebarProps {
  onPaletteSelect?: (paletteId: string, colors: ColorScheme) => void;
  /** Called when "Change Theme" button is clicked – parent can show confirmation modal */
  onChangeThemeRequest?: (paletteId: string, colors: ColorScheme) => void;
  /** Palette ID from generation config (workflow_input) for the current generation – highlighted as the version's palette */
  highlightPaletteId?: string | null;
}

const findPaletteById = (id: string | null) => {
  if (!id) return null;
  for (const c of colorCategories) {
    const p = c.palettes.find((pal) => pal.id === id);
    if (p) return p;
  }
  return null;
};

export const ColorThemeSidebar: React.FC<ColorThemeSidebarProps> = ({
  onPaletteSelect,
  onChangeThemeRequest,
  highlightPaletteId,
}) => {
  const [selectedPaletteId, setSelectedPaletteId] = useState<string | null>(null);

  useEffect(() => {
    if (highlightPaletteId != null) {
      setSelectedPaletteId(highlightPaletteId);
    }
  }, [highlightPaletteId]);

  const selectedPalette = useMemo(
    () => findPaletteById(selectedPaletteId),
    [selectedPaletteId]
  );

  const isSameAsConfig =
    selectedPaletteId != null &&
    highlightPaletteId != null &&
    selectedPaletteId === highlightPaletteId;
  const isChangeThemeDisabled = isSameAsConfig || !selectedPalette;

  const handlePaletteClick = (paletteId: string, colors: ColorScheme) => {
    setSelectedPaletteId(paletteId);
    if (onPaletteSelect) {
      onPaletteSelect(paletteId, colors);
    }
  };

  const handleChangeTheme = () => {
    if (selectedPalette && !isChangeThemeDisabled) {
      // If onChangeThemeRequest is provided, call it (for modal confirmation flow)
      // Otherwise fall back to onPaletteSelect for direct selection
      if (onChangeThemeRequest) {
        onChangeThemeRequest(selectedPalette.id, selectedPalette.colors);
      } else if (onPaletteSelect) {
        onPaletteSelect(selectedPalette.id, selectedPalette.colors);
      }
    }
  };

  return (
    <div className="p-3 space-y-6">
      {colorCategories.map((category) => (
        <div key={category.id} className="space-y-3">
          {/* Category Header */}
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-gray-700">{category.name}</h3>
            <p className="text-xs text-gray-500">{category.description}</p>
          </div>

          {/* Palettes Grid */}
          <div className="grid grid-cols-3 gap-3">
            {category.palettes.map((palette) => (
              <button
                key={palette.id}
                onClick={() => handlePaletteClick(palette.id, palette.colors)}
                className="group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-0"
              >
                {/* Palette Card with Colors */}
                <div
                  className={`rounded-lg border shadow-sm overflow-hidden hover:shadow-md transition-shadow ${
                    selectedPaletteId === palette.id
                      ? 'border-[#8E94F2] ring-2 ring-[#8E94F2]'
                      : 'border-gray-200'
                  }`}
                >
                  {/* Color Swatches */}
                  <div className="flex">
                    {/* Primary Color */}
                    <div
                      className="flex-1 h-12"
                      style={{ backgroundColor: palette.colors.primary }}
                    />
                    {/* Secondary Color */}
                    <div
                      className="flex-1 h-12"
                      style={{ backgroundColor: palette.colors.secondary }}
                    />
                    {/* Accent Color */}
                    <div
                      className="flex-1 h-12"
                      style={{ backgroundColor: palette.colors.accent }}
                    />
                    {/* Background Color */}
                    <div
                      className="flex-1 h-12"
                      style={{ backgroundColor: palette.colors.background }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Change Theme button – same style as Regenerate Full Page */}
      <button
        type="button"
        disabled={isChangeThemeDisabled}
        onClick={handleChangeTheme}
        className="w-full px-4 py-3 rounded-lg border border-[#7a80e0] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-[#8E94F2] focus:ring-offset-1 bg-[#8E94F2] hover:bg-[#7a80e0] hover:shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#8E94F2] disabled:hover:shadow-none disabled:active:scale-100"
      >
        <span>Change Theme</span>
      </button>
    </div>
  );
};

export default ColorThemeSidebar;
