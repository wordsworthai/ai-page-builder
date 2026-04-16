import * as React from 'react';
import { alpha, Theme, Components } from '@mui/material/styles';
import { outlinedInputClasses } from '@mui/material/OutlinedInput';
import { svgIconClasses } from '@mui/material/SvgIcon';
import { toggleButtonGroupClasses } from '@mui/material/ToggleButtonGroup';
import { toggleButtonClasses } from '@mui/material/ToggleButton';
import CheckBoxOutlineBlankRoundedIcon from '@mui/icons-material/CheckBoxOutlineBlankRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import { gray, brand } from '../themePrimitives';

export const inputsCustomizations: Components<Theme> = {
  MuiButtonBase: {
    defaultProps: {
      disableTouchRipple: true,
      disableRipple: true,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        boxSizing: 'border-box',
        transition: 'all 100ms ease-in',
        '&:focus-visible': {
          outline: 'none',
        },
        '&:hover': {
          outline: 'none',
        },
      }),
    },
  },
  MuiButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        boxShadow: 'none',
        borderRadius: theme.shape.borderRadius,
        textTransform: 'none',
        variants: [
          {
            props: {
              size: 'small',
            },
            style: {
              height: '2.25rem',
              padding: '8px 12px',
            },
          },
          {
            props: {
              size: 'medium',
            },
            style: {
              height: '2.5rem', // 40px
            },
          },
          {
            props: {
              color: 'primary',
              variant: 'contained',
            },
            style: {
              color: theme.palette.primary.contrastText, // PRIMARY_CTA_TEXT: #FFFFFF
              backgroundColor: theme.palette.primary.main, // PRIMARY_CTA: #434775
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
              '&:active': {
                backgroundColor: theme.palette.primary.dark,
              },
              '&:disabled': {
                backgroundColor: alpha(theme.palette.primary.main, 0.5),
                color: alpha(theme.palette.primary.contrastText, 0.5),
              },
            },
          },
          {
            props: {
              color: 'secondary',
              variant: 'contained',
            },
            style: {
              color: theme.palette.secondary.contrastText, // SECONDARY_CTA_TEXT: #434775
              backgroundColor: theme.palette.secondary.main, // SECONDARY_CTA: #E3E5FF
              '&:hover': {
                backgroundColor: theme.palette.secondary.dark,
              },
              '&:active': {
                backgroundColor: theme.palette.secondary.dark,
              },
              '&:disabled': {
                backgroundColor: alpha(theme.palette.secondary.main, 0.5),
                color: alpha(theme.palette.secondary.contrastText, 0.5),
              },
            },
          },
          {
            props: {
              variant: 'outlined',
            },
            style: {
              color: theme.palette.text.primary,
              border: '1px solid',
              borderColor: gray[200],
              backgroundColor: theme.palette.brand?.nonHighlightButton || gray[200], // NON_HIGHLIGHT_BUTTON: #EFEFEF
              '&:hover': {
                backgroundColor: gray[300],
                borderColor: gray[400],
              },
              '&:active': {
                backgroundColor: gray[300],
              },
              ...theme.applyStyles('dark', {
                backgroundColor: gray[700],
                borderColor: gray[600],
                '&:hover': {
                  backgroundColor: gray[600],
                  borderColor: gray[500],
                },
                '&:active': {
                  backgroundColor: gray[600],
                },
              }),
            },
          },
          {
            props: {
              color: 'secondary',
              variant: 'outlined',
            },
            style: {
              color: theme.palette.secondary.contrastText, // SECONDARY_CTA_TEXT: #434775
              border: '1px solid',
              borderColor: theme.palette.secondary.main, // SECONDARY_CTA: #E3E5FF
              backgroundColor: 'transparent',
              '&:hover': {
                backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                borderColor: theme.palette.secondary.dark,
              },
              '&:active': {
                backgroundColor: alpha(theme.palette.secondary.main, 0.2),
              },
              ...theme.applyStyles('dark', {
                color: theme.palette.secondary.contrastText,
                borderColor: theme.palette.secondary.main,
                backgroundColor: 'transparent',
                '&:hover': {
                  borderColor: theme.palette.secondary.dark,
                  backgroundColor: alpha(theme.palette.secondary.main, 0.2),
                },
                '&:active': {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.3),
                },
              }),
            },
          },
          {
            props: {
              color: 'error',
              variant: 'outlined',
            },
            style: {
              color: theme.palette.error.main,
              border: '1px solid',
              borderColor: theme.palette.error.main,
              backgroundColor: 'transparent',
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                borderColor: theme.palette.error.dark,
              },
              '&:active': {
                backgroundColor: alpha(theme.palette.error.main, 0.2),
              },
              ...theme.applyStyles('dark', {
                color: theme.palette.error.light,
                borderColor: theme.palette.error.main,
                backgroundColor: 'transparent',
                '&:hover': {
                  borderColor: theme.palette.error.light,
                  backgroundColor: alpha(theme.palette.error.main, 0.2),
                },
                '&:active': {
                  backgroundColor: alpha(theme.palette.error.main, 0.3),
                },
              }),
            },
          },
          {
            props: {
              color: 'error',
              variant: 'contained',
            },
            style: {
              color: theme.palette.error.contrastText,
              backgroundColor: theme.palette.error.main,
              '&:hover': {
                backgroundColor: theme.palette.error.dark,
              },
              '&:active': {
                backgroundColor: theme.palette.error.dark,
              },
              ...theme.applyStyles('dark', {
                backgroundColor: theme.palette.error.main,
                '&:hover': {
                  backgroundColor: theme.palette.error.dark,
                },
              }),
            },
          },
          {
            props: {
              variant: 'text',
            },
            style: {
              color: gray[600],
              '&:hover': {
                backgroundColor: gray[100],
              },
              '&:active': {
                backgroundColor: gray[200],
              },
              ...theme.applyStyles('dark', {
                color: gray[50],
                '&:hover': {
                  backgroundColor: gray[700],
                },
                '&:active': {
                  backgroundColor: alpha(gray[700], 0.7),
                },
              }),
            },
          },
          {
            props: {
              color: 'secondary',
              variant: 'text',
            },
            style: {
              color: brand[700],
              '&:hover': {
                backgroundColor: alpha(brand[100], 0.5),
              },
              '&:active': {
                backgroundColor: alpha(brand[200], 0.7),
              },
              ...theme.applyStyles('dark', {
                color: brand[100],
                '&:hover': {
                  backgroundColor: alpha(brand[900], 0.5),
                },
                '&:active': {
                  backgroundColor: alpha(brand[900], 0.3),
                },
              }),
            },
          },
        ],
      }),
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        boxShadow: 'none',
        borderRadius: theme.shape.borderRadius,
        textTransform: 'none',
        fontWeight: theme.typography.fontWeightMedium,
        letterSpacing: 0,
        color: theme.palette.text.primary,
        border: '1px solid ',
        borderColor: gray[200],
        backgroundColor: alpha(gray[50], 0.3),
        '&:hover': {
          backgroundColor: gray[100],
          borderColor: gray[300],
        },
        '&:active': {
          backgroundColor: gray[200],
        },
        ...theme.applyStyles('dark', {
          backgroundColor: gray[800],
          borderColor: gray[700],
          '&:hover': {
            backgroundColor: gray[900],
            borderColor: gray[600],
          },
          '&:active': {
            backgroundColor: gray[900],
          },
        }),
        variants: [
          {
            props: {
              size: 'small',
            },
            style: {
              width: '2.25rem',
              height: '2.25rem',
              padding: '0.25rem',
              [`& .${svgIconClasses.root}`]: { fontSize: '1rem' },
            },
          },
          {
            props: {
              size: 'medium',
            },
            style: {
              width: '2.5rem',
              height: '2.5rem',
            },
          },
        ],
      }),
    },
  },
  MuiToggleButtonGroup: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: '10px',
        boxShadow: `0 4px 16px ${alpha(gray[400], 0.2)}`,
        [`& .${toggleButtonGroupClasses.selected}`]: {
          color: brand[500],
        },
        ...theme.applyStyles('dark', {
          [`& .${toggleButtonGroupClasses.selected}`]: {
            color: '#fff',
          },
          boxShadow: `0 4px 16px ${alpha(brand[700], 0.5)}`,
        }),
      }),
    },
  },
  MuiToggleButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: '12px 16px',
        textTransform: 'none',
        borderRadius: '10px',
        fontWeight: 500,
        ...theme.applyStyles('dark', {
          color: gray[400],
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
          [`&.${toggleButtonClasses.selected}`]: {
            color: brand[300],
          },
        }),
      }),
    },
  },
  MuiCheckbox: {
    defaultProps: {
      disableRipple: true,
      icon: (
        <CheckBoxOutlineBlankRoundedIcon sx={{ color: 'hsla(210, 0%, 0%, 0.0)' }} />
      ),
      checkedIcon: <CheckRoundedIcon sx={{ height: 14, width: 14 }} />,
      indeterminateIcon: <RemoveRoundedIcon sx={{ height: 14, width: 14 }} />,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        margin: 10,
        height: 16,
        width: 16,
        borderRadius: 5,
        border: '1px solid ',
        borderColor: alpha(gray[300], 0.8),
        boxShadow: '0 0 0 1.5px hsla(210, 0%, 0%, 0.04) inset',
        backgroundColor: alpha(gray[100], 0.4),
        transition: 'border-color, background-color, 120ms ease-in',
        '&:hover': {
          borderColor: brand[300],
        },
        '&.Mui-focusVisible': {
          outline: `3px solid ${alpha(brand[500], 0.5)}`,
          outlineOffset: '2px',
          borderColor: brand[400],
        },
        '&.Mui-checked': {
          color: 'white',
          backgroundColor: brand[500],
          borderColor: brand[500],
          boxShadow: `none`,
          '&:hover': {
            backgroundColor: brand[600],
          },
        },
        ...theme.applyStyles('dark', {
          borderColor: alpha(gray[700], 0.8),
          boxShadow: '0 0 0 1.5px hsl(210, 0%, 0%) inset',
          backgroundColor: alpha(gray[900], 0.8),
          '&:hover': {
            borderColor: brand[300],
          },
          '&.Mui-focusVisible': {
            borderColor: brand[400],
            outline: `3px solid ${alpha(brand[500], 0.5)}`,
            outlineOffset: '2px',
          },
        }),
      }),
    },
  },
  MuiInputBase: {
    styleOverrides: {
      root: {
        // Minimal styling - let MUI handle default behavior
      },
      input: {
        '&::placeholder': {
          opacity: 0.7,
          color: gray[500],
        },
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        // Basic theme-aware styling only
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.brand?.textInput || gray[200], // TEXT_INPUT: #EFEFEF
        borderRadius: theme.shape.borderRadius,
        transition: 'border-color 150ms ease-in-out, box-shadow 150ms ease-in-out',
        '&:hover': {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.text.primary,
          },
        },
        '&.Mui-focused': {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
            borderWidth: 2,
          },
        },
        ...theme.applyStyles('dark', {
          backgroundColor: gray[700],
        }),
      }),
      // Remove all input and multiline overrides - let MUI handle defaults
    },
  },
  MuiInputAdornment: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: theme.palette.grey[500],
        ...theme.applyStyles('dark', {
          color: theme.palette.grey[400],
        }),
      }),
    },
  },
  MuiFormLabel: {
    styleOverrides: {
      root: {
        // Let MUI handle default form label styling
      },
    },
  },
};