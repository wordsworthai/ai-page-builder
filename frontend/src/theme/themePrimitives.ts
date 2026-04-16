import { createTheme, alpha, Shadows, PaletteMode } from '@mui/material/styles';

declare module '@mui/material/Paper' {
  interface PaperPropsVariantOverrides {
    highlighted: true;
  }
}
declare module '@mui/material/styles/createPalette' {
  interface ColorRange {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  }

  interface PaletteColor extends ColorRange {}

  interface Palette {
    baseShadow: string;
    brand: {
      primaryCta: string;
      secondaryCta: string;
      nonHighlightButton: string;
      textColor: string;
      url: string;
      primaryCtaText: string;
      secondaryCtaText: string;
      textInput: string;
      widgetColor: string;
      widgetShadow: string;
      sectionAreaHighlight: string;
      secondaryCtaIcon: string;
      goodToGo: string;
      error: string;
    };
  }
}

const defaultTheme = createTheme();

const customShadows: Shadows = [...defaultTheme.shadows];

// Brand colors based on PRIMARY_CTA: #434775
export const brand = {
  50: '#F0F1F5',
  100: '#D8DAE8',
  200: '#B8BBD4',
  300: '#989CBF',
  400: '#787DAA',
  500: '#434775', // PRIMARY_CTA - main brand color
  600: '#363A5F',
  700: '#2A2D49',
  800: '#1E2033',
  900: '#12131D',
};

// Secondary CTA colors based on SECONDARY_CTA: #E3E5FF
export const secondary = {
  50: '#F8F8FF',
  100: '#E3E5FF', // SECONDARY_CTA
  200: '#C8CCFF',
  300: '#ADB2FF',
  400: '#9299FF',
  500: '#8187DC', // SECTION_AREA_HIGHLIGHT / SECONDARY_CTA_ICON
  600: '#6B70B8',
  700: '#555994',
  800: '#3F4270',
  900: '#292B4C',
};

// Gray colors based on TEXT_COLOR: #565656
export const gray = {
  50: '#FAFAFA',
  100: '#F5F5F5',
  200: '#EFEFEF', // NON_HIGHLIGHT_BUTTON / TEXT_INPUT
  300: '#E0E0E0',
  400: '#BDBDBD',
  500: '#9E9E9E',
  600: '#565656', // TEXT_COLOR
  700: '#424242',
  800: '#2D2D2D',
  900: '#1A1A1A',
};

// Success colors based on GOOD_TO_GO: #0DE676
export const green = {
  50: '#E6FDF3',
  100: '#CCFBE7',
  200: '#99F7CF',
  300: '#66F3B7',
  400: '#33EF9F',
  500: '#0DE676', // GOOD_TO_GO
  600: '#0AB85E',
  700: '#088A47',
  800: '#055C2F',
  900: '#022E18',
};

// Error colors based on ERROR: #D03F3F
export const red = {
  50: '#FCE8E8',
  100: '#F9D1D1',
  200: '#F3A3A3',
  300: '#ED7575',
  400: '#E74747',
  500: '#D03F3F', // ERROR
  600: '#A63232',
  700: '#7D2626',
  800: '#531919',
  900: '#2A0D0D',
};

// Info/Link colors based on URL: #448AFF
export const blue = {
  50: '#E6F1FF',
  100: '#CCE3FF',
  200: '#99C7FF',
  300: '#66ABFF',
  400: '#448AFF', // URL
  500: '#3370CC',
  600: '#225699',
  700: '#113C66',
  800: '#0B2233',
  900: '#050F1A',
};

// Orange (keeping for warning)
export const orange = {
  50: 'hsl(45, 100%, 97%)',
  100: 'hsl(45, 92%, 90%)',
  200: 'hsl(45, 94%, 80%)',
  300: 'hsl(45, 90%, 65%)',
  400: 'hsl(45, 90%, 40%)',
  500: 'hsl(45, 90%, 35%)',
  600: 'hsl(45, 91%, 25%)',
  700: 'hsl(45, 94%, 20%)',
  800: 'hsl(45, 95%, 16%)',
  900: 'hsl(45, 93%, 12%)',
};

// Purple (keeping for compatibility)
export const purple = {
  50: '#F8F8FF',
  100: '#E3E5FF',
  200: '#C8CCFF',
  300: '#ADB2FF',
  400: '#9299FF',
  500: '#8187DC',
  600: '#6B70B8',
  700: '#555994',
  800: '#3F4270',
  900: '#292B4C',
};

export const getDesignTokens = (mode: PaletteMode) => {
  // Widget shadow - light gray shadow effect
  const widgetShadow = mode === 'dark'
    ? '0px 2px 8px rgba(0, 0, 0, 0.3), 0px 1px 3px rgba(0, 0, 0, 0.2)'
    : '0px 2px 8px rgba(0, 0, 0, 0.08), 0px 1px 3px rgba(0, 0, 0, 0.05)';

  customShadows[1] =
    mode === 'dark'
      ? 'hsla(220, 30%, 5%, 0.7) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.8) 0px 8px 16px -5px'
      : 'hsla(220, 30%, 5%, 0.07) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.07) 0px 8px 16px -5px';

  return {
    palette: {
      mode,
      primary: {
        light: brand[300],
        main: brand[500], // PRIMARY_CTA: #434775
        dark: brand[700],
        contrastText: '#FFFFFF', // PRIMARY_CTA_TEXT: #FFFFFF
        ...(mode === 'dark' && {
          contrastText: '#FFFFFF',
          light: brand[400],
          main: brand[500],
          dark: brand[600],
        }),
      },
      secondary: {
        light: secondary[200],
        main: secondary[100], // SECONDARY_CTA: #E3E5FF
        dark: secondary[500],
        contrastText: brand[500], // SECONDARY_CTA_TEXT: #434775
        ...(mode === 'dark' && {
          light: secondary[300],
          main: secondary[200],
          dark: secondary[400],
          contrastText: brand[500],
        }),
      },
      info: {
        light: blue[200],
        main: blue[400], // URL: #448AFF
        dark: blue[600],
        contrastText: '#FFFFFF',
        ...(mode === 'dark' && {
          contrastText: '#FFFFFF',
          light: blue[300],
          main: blue[400],
          dark: blue[500],
        }),
      },
      warning: {
        light: orange[300],
        main: orange[400],
        dark: orange[800],
        ...(mode === 'dark' && {
          light: orange[400],
          main: orange[500],
          dark: orange[700],
        }),
      },
      error: {
        light: red[300],
        main: red[500], // ERROR: #D03F3F
        dark: red[700],
        contrastText: '#FFFFFF',
        ...(mode === 'dark' && {
          light: red[400],
          main: red[500],
          dark: red[600],
          contrastText: '#FFFFFF',
        }),
      },
      success: {
        light: green[300],
        main: green[500], // GOOD_TO_GO: #0DE676
        dark: green[700],
        contrastText: '#FFFFFF',
        ...(mode === 'dark' && {
          light: green[400],
          main: green[500],
          dark: green[600],
          contrastText: '#000000',
        }),
      },
      grey: {
        ...gray,
      },
      divider: mode === 'dark' ? alpha(gray[700], 0.6) : alpha(gray[300], 0.4),
      background: {
        default: '#FFFFFF', // WIDGET_COLOR: #FFFFFF (for light mode)
        paper: '#FFFFFF', // WIDGET_COLOR: #FFFFFF
        ...(mode === 'dark' && { 
          default: gray[900], 
          paper: gray[800] 
        }),
      },
      text: {
        primary: gray[600], // TEXT_COLOR: #565656
        secondary: gray[500],
        warning: orange[400],
        ...(mode === 'dark' && { 
          primary: gray[100], 
          secondary: gray[300] 
        }),
      },
      action: {
        hover: alpha(gray[200], 0.2),
        selected: `${alpha(gray[200], 0.3)}`,
        ...(mode === 'dark' && {
          hover: alpha(gray[600], 0.2),
          selected: alpha(gray[600], 0.3),
        }),
      },
      // Brand-specific colors
      brand: {
        primaryCta: brand[500], // #434775
        secondaryCta: secondary[100], // #E3E5FF
        nonHighlightButton: gray[200], // #EFEFEF
        textColor: gray[600], // #565656
        url: blue[400], // #448AFF
        primaryCtaText: '#FFFFFF', // #FFFFFF
        secondaryCtaText: brand[500], // #434775
        textInput: gray[200], // #EFEFEF
        widgetColor: '#FFFFFF', // #FFFFFF
        widgetShadow: widgetShadow,
        sectionAreaHighlight: secondary[500], // #8187DC
        secondaryCtaIcon: secondary[500], // #8187DC
        goodToGo: green[500], // #0DE676
        error: red[500], // #D03F3F
      },
    },
    typography: {
      fontFamily: '"General Sans", sans-serif',
      h1: {
        fontSize: defaultTheme.typography.pxToRem(48),
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: -0.5,
      },
      h2: {
        fontSize: defaultTheme.typography.pxToRem(36),
        fontWeight: 600,
        lineHeight: 1.2,
      },
      h3: {
        fontSize: defaultTheme.typography.pxToRem(30),
        lineHeight: 1.2,
      },
      h4: {
        fontSize: defaultTheme.typography.pxToRem(24),
        fontWeight: 600,
        lineHeight: 1.5,
      },
      h5: {
        fontSize: defaultTheme.typography.pxToRem(20),
        fontWeight: 600,
      },
      h6: {
        fontSize: defaultTheme.typography.pxToRem(18),
        fontWeight: 600,
      },
      subtitle1: {
        fontSize: defaultTheme.typography.pxToRem(18),
      },
      subtitle2: {
        fontSize: defaultTheme.typography.pxToRem(14),
        fontWeight: 500,
      },
      body1: {
        fontSize: defaultTheme.typography.pxToRem(14),
      },
      body2: {
        fontSize: defaultTheme.typography.pxToRem(14),
        fontWeight: 400,
      },
      caption: {
        fontSize: defaultTheme.typography.pxToRem(12),
        fontWeight: 400,
      },
    },
    shape: {
      borderRadius: 8,
    },
    shadows: customShadows,
  };
};

export const colorSchemes = {
  light: {
    palette: {
      primary: {
        light: brand[300],
        main: brand[500], // PRIMARY_CTA: #434775
        dark: brand[700],
        contrastText: '#FFFFFF', // PRIMARY_CTA_TEXT: #FFFFFF
      },
      secondary: {
        light: secondary[200],
        main: secondary[100], // SECONDARY_CTA: #E3E5FF
        dark: secondary[500],
        contrastText: brand[500], // SECONDARY_CTA_TEXT: #434775
      },
      info: {
        light: blue[200],
        main: blue[400], // URL: #448AFF
        dark: blue[600],
        contrastText: '#FFFFFF',
      },
      warning: {
        light: orange[300],
        main: orange[400],
        dark: orange[800],
      },
      error: {
        light: red[300],
        main: red[500], // ERROR: #D03F3F
        dark: red[700],
        contrastText: '#FFFFFF',
      },
      success: {
        light: green[300],
        main: green[500], // GOOD_TO_GO: #0DE676
        dark: green[700],
        contrastText: '#FFFFFF',
      },
      grey: {
        ...gray,
      },
      divider: alpha(gray[300], 0.4),
      background: {
        default: '#FFFFFF', // WIDGET_COLOR: #FFFFFF
        paper: '#FFFFFF', // WIDGET_COLOR: #FFFFFF
      },
      text: {
        primary: gray[600], // TEXT_COLOR: #565656
        secondary: gray[500],
        warning: orange[400],
      },
      action: {
        hover: alpha(gray[200], 0.2),
        selected: `${alpha(gray[200], 0.3)}`,
      },
      baseShadow:
        'hsla(220, 30%, 5%, 0.07) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.07) 0px 8px 16px -5px',
      brand: {
        primaryCta: brand[500], // #434775
        secondaryCta: secondary[100], // #E3E5FF
        nonHighlightButton: gray[200], // #EFEFEF
        textColor: gray[600], // #565656
        url: blue[400], // #448AFF
        primaryCtaText: '#FFFFFF', // #FFFFFF
        secondaryCtaText: brand[500], // #434775
        textInput: gray[200], // #EFEFEF
        widgetColor: '#FFFFFF', // #FFFFFF
        widgetShadow: '0px 2px 8px rgba(0, 0, 0, 0.08), 0px 1px 3px rgba(0, 0, 0, 0.05)',
        sectionAreaHighlight: secondary[500], // #8187DC
        secondaryCtaIcon: secondary[500], // #8187DC
        goodToGo: green[500], // #0DE676
        error: red[500], // #D03F3F
      },
    },
  },
  dark: {
    palette: {
      primary: {
        contrastText: '#FFFFFF',
        light: brand[400],
        main: brand[500], // PRIMARY_CTA: #434775
        dark: brand[600],
      },
      secondary: {
        light: secondary[300],
        main: secondary[200], // SECONDARY_CTA: #E3E5FF
        dark: secondary[400],
        contrastText: brand[500], // SECONDARY_CTA_TEXT: #434775
      },
      info: {
        contrastText: '#FFFFFF',
        light: blue[300],
        main: blue[400], // URL: #448AFF
        dark: blue[500],
      },
      warning: {
        light: orange[400],
        main: orange[500],
        dark: orange[700],
      },
      error: {
        light: red[400],
        main: red[500], // ERROR: #D03F3F
        dark: red[600],
        contrastText: '#FFFFFF',
      },
      success: {
        light: green[400],
        main: green[500], // GOOD_TO_GO: #0DE676
        dark: green[600],
        contrastText: '#000000',
      },
      grey: {
        ...gray,
      },
      divider: alpha(gray[700], 0.6),
      background: {
        default: gray[900],
        paper: gray[800],
      },
      text: {
        primary: gray[100],
        secondary: gray[300],
      },
      action: {
        hover: alpha(gray[600], 0.2),
        selected: alpha(gray[600], 0.3),
      },
      baseShadow:
        'hsla(220, 30%, 5%, 0.7) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.8) 0px 8px 16px -5px',
      brand: {
        primaryCta: brand[500], // #434775
        secondaryCta: secondary[200], // #E3E5FF
        nonHighlightButton: gray[700], // #EFEFEF -> darker for dark mode
        textColor: gray[100], // #565656 -> lighter for dark mode
        url: blue[400], // #448AFF
        primaryCtaText: '#FFFFFF', // #FFFFFF
        secondaryCtaText: brand[500], // #434775
        textInput: gray[700], // #EFEFEF -> darker for dark mode
        widgetColor: gray[800], // #FFFFFF -> darker for dark mode
        widgetShadow: '0px 2px 8px rgba(0, 0, 0, 0.3), 0px 1px 3px rgba(0, 0, 0, 0.2)',
        sectionAreaHighlight: secondary[500], // #8187DC
        secondaryCtaIcon: secondary[500], // #8187DC
        goodToGo: green[500], // #0DE676
        error: red[500], // #D03F3F
      },
    },
  },
};

export const typography = {
  fontFamily: '"General Sans", sans-serif',
  h1: {
    fontSize: defaultTheme.typography.pxToRem(48),
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: defaultTheme.typography.pxToRem(36),
    fontWeight: 600,
    lineHeight: 1.2,
  },
  h3: {
    fontSize: defaultTheme.typography.pxToRem(30),
    lineHeight: 1.2,
  },
  h4: {
    fontSize: defaultTheme.typography.pxToRem(24),
    fontWeight: 600,
    lineHeight: 1.5,
  },
  h5: {
    fontSize: defaultTheme.typography.pxToRem(20),
    fontWeight: 600,
  },
  h6: {
    fontSize: defaultTheme.typography.pxToRem(18),
    fontWeight: 600,
  },
  subtitle1: {
    fontSize: defaultTheme.typography.pxToRem(18),
  },
  subtitle2: {
    fontSize: defaultTheme.typography.pxToRem(14),
    fontWeight: 500,
  },
  body1: {
    fontSize: defaultTheme.typography.pxToRem(14),
  },
  body2: {
    fontSize: defaultTheme.typography.pxToRem(14),
    fontWeight: 400,
  },
  caption: {
    fontSize: defaultTheme.typography.pxToRem(12),
    fontWeight: 400,
  },
};

export const shape = {
  borderRadius: 8,
};

// @ts-ignore
const defaultShadows: Shadows = [
  'none',
  'var(--template-palette-baseShadow)',
  ...defaultTheme.shadows.slice(2),
];
export const shadows = defaultShadows;
