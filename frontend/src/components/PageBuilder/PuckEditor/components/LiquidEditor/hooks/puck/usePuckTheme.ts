import { useEffect } from 'react';

// Application theme colors (matching themePrimitives.ts)
const APP_THEME_COLORS = {
  // Grey scale
  grey01: '#1A1A1A', // gray[900]
  grey02: '#2D2D2D', // gray[800]
  grey03: '#424242', // gray[700]
  grey04: '#565656', // gray[600] - TEXT_COLOR
  grey05: '#9E9E9E', // gray[500]
  grey06: '#BDBDBD', // gray[400]
  grey07: '#E0E0E0', // gray[300]
  grey08: '#EFEFEF', // gray[200] - NON_HIGHLIGHT_BUTTON/TEXT_INPUT
  grey09: '#E0E0E0', // gray[300] - Border color
  grey10: '#F5F5F5', // gray[100]
  grey11: '#FAFAFA', // gray[50]
  grey12: '#FFFFFF', // WIDGET_COLOR
  
  // Azure/Brand colors
  azure01: '#12131D', // brand[900]
  azure02: '#1E2033', // brand[800]
  azure03: '#2A2D49', // brand[700]
  azure04: '#434775', // brand[500] - PRIMARY_CTA
  azure05: '#8187DC', // secondary[500] - SECTION_AREA_HIGHLIGHT
  azure06: '#E3E5FF', // secondary[100] - SECONDARY_CTA
  azure07: '#ADB2FF', // secondary[300]
  azure08: '#C8CCFF', // secondary[200]
  azure09: '#E3E5FF', // secondary[100]
  azure10: '#F8F8FF', // secondary[50]
  azure11: '#F8F8FF', // secondary[50]
  azure12: '#FFFFFF', // white
  
  // Base colors
  black: '#565656', // gray[600] - TEXT_COLOR
  white: '#FFFFFF', // WIDGET_COLOR
  
  // Font
  fontFamily: '"General Sans", sans-serif',
};

/**
 * Hook to inject Puck theme CSS variables into the main document head.
 * This affects Puck's sidebars (rendered in main document) and iframe content.
 * 
 * The hook injects CSS variable overrides that map Puck's default colors
 * to the application's theme colors, ensuring consistent theming across
 * all Puck UI components.
 */
export function usePuckTheme(): void {
  useEffect(() => {
    const styleId = 'puck-theme-override';
    
    // Check if style already exists
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    // Set CSS variable overrides
    styleElement.textContent = `
      :root {
        /* Grey scale - mapped to application gray scale */
        --puck-color-grey-01: ${APP_THEME_COLORS.grey01};
        --puck-color-grey-02: ${APP_THEME_COLORS.grey02};
        --puck-color-grey-03: ${APP_THEME_COLORS.grey03};
        --puck-color-grey-04: ${APP_THEME_COLORS.grey04};
        --puck-color-grey-05: ${APP_THEME_COLORS.grey05};
        --puck-color-grey-06: ${APP_THEME_COLORS.grey06};
        --puck-color-grey-07: ${APP_THEME_COLORS.grey07};
        --puck-color-grey-08: ${APP_THEME_COLORS.grey08};
        --puck-color-grey-09: ${APP_THEME_COLORS.grey09};
        --puck-color-grey-10: ${APP_THEME_COLORS.grey10};
        --puck-color-grey-11: ${APP_THEME_COLORS.grey11};
        --puck-color-grey-12: ${APP_THEME_COLORS.grey12};
        
        /* Azure/Brand colors - mapped to application brand colors */
        --puck-color-azure-01: ${APP_THEME_COLORS.azure01};
        --puck-color-azure-02: ${APP_THEME_COLORS.azure02};
        --puck-color-azure-03: ${APP_THEME_COLORS.azure03};
        --puck-color-azure-04: ${APP_THEME_COLORS.azure04};
        --puck-color-azure-05: ${APP_THEME_COLORS.azure05};
        --puck-color-azure-06: ${APP_THEME_COLORS.azure06};
        --puck-color-azure-07: ${APP_THEME_COLORS.azure07};
        --puck-color-azure-08: ${APP_THEME_COLORS.azure08};
        --puck-color-azure-09: ${APP_THEME_COLORS.azure09};
        --puck-color-azure-10: ${APP_THEME_COLORS.azure10};
        --puck-color-azure-11: ${APP_THEME_COLORS.azure11};
        --puck-color-azure-12: ${APP_THEME_COLORS.azure12};
        
        /* Rose colors - mapped to application brand colors for icons */
        --puck-color-rose-01: ${APP_THEME_COLORS.azure01};
        --puck-color-rose-02: ${APP_THEME_COLORS.azure02};
        --puck-color-rose-03: ${APP_THEME_COLORS.azure03};
        --puck-color-rose-04: ${APP_THEME_COLORS.azure04};
        --puck-color-rose-05: ${APP_THEME_COLORS.azure05};
        --puck-color-rose-06: ${APP_THEME_COLORS.azure06};
        --puck-color-rose-07: ${APP_THEME_COLORS.azure05}; /* Layer icon color - using secondary brand color */
        --puck-color-rose-08: ${APP_THEME_COLORS.azure07};
        --puck-color-rose-09: ${APP_THEME_COLORS.azure08};
        --puck-color-rose-10: ${APP_THEME_COLORS.azure10};
        --puck-color-rose-11: ${APP_THEME_COLORS.azure11};
        --puck-color-rose-12: ${APP_THEME_COLORS.azure12};
        
        /* Base colors */
        --puck-color-black: ${APP_THEME_COLORS.black};
        --puck-color-white: ${APP_THEME_COLORS.white};
        
        /* Font */
        --puck-font-family: ${APP_THEME_COLORS.fontFamily};
      }
    `;
    
    // Cleanup: remove style element on unmount
    return () => {
      const element = document.getElementById(styleId);
      if (element) {
        element.remove();
      }
    };
  }, []); // Empty deps - only run once on mount
}
