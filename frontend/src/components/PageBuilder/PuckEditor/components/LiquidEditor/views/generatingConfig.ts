import type { Config, Data } from "@measured/puck";

/**
 * Minimal Puck configuration used while website generation is in progress
 * or when template data is not yet available (loading, error).
 * Allows Puck to render its shell (header, sidebar) while the iframe area
 * is overridden with custom UI (progress indicator, error message).
 * No zones needed—base config only.
 */
export const generatingConfig: Config = {
  // No actual components needed - iframe will be overridden
  components: {},
  // Root configuration
  root: {
    fields: {},
    defaultProps: {},
    render: ({ children }) => {
      // This won't actually render since we override the iframe
      return children;
    }
  }
};

/**
 * Empty data structure for the generating state.
 */
export const generatingData: Data = {
  root: { props: {} },
  content: [],
  zones: {}
};
