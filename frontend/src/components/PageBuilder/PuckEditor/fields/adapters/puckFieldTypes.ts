import React from "react";
import type { Field as InternalField, FieldRenderProps } from "../types";
import { getFieldRenderer, getRegisteredFieldTypes } from "../registry";

/**
 * Adapter: expose the registry in the shape Puck expects: `overrides.fieldTypes`.
 *
 * We intentionally only export LiquidEditor overrides from here, so other editors
 * remain untouched unless they explicitly opt-in.
 */

type PuckFieldTypeProps = {
  readOnly?: boolean;
  field: any;
  name: string;
  value: unknown;
  onChange: (value: unknown) => void;
};

export function buildPuckFieldTypesFromRegistry() {
  const registeredTypes = getRegisteredFieldTypes();
  const fieldTypes: Record<string, (props: PuckFieldTypeProps) => React.ReactElement> = {};

  for (const type of registeredTypes) {
    const renderer = getFieldRenderer(type);
    if (!renderer) {
      console.error(`[buildPuckFieldTypesFromRegistry] ERROR: No renderer found for type "${type}"`);
      // Shouldn't happen because we build from registered types, but keep safe.
      continue;
    }
    fieldTypes[type] = ({ readOnly, field, name, value, onChange }) => {
      const rendererAtRuntime = getFieldRenderer(type);
      if (!rendererAtRuntime) {
        console.error(`[buildPuckFieldTypesFromRegistry] ERROR: Renderer is undefined at runtime for type "${type}"`);
        return null;
      }

      const internalProps: FieldRenderProps = {
        field: field as InternalField,
        name,
        value,
        onChange,
        readOnly,
      };

      try {
        const result = rendererAtRuntime(internalProps);
        return result;
      } catch (error) {
        console.error(`[buildPuckFieldTypesFromRegistry] ERROR rendering "${type}":`, error);
        throw error;
      }
    };
  }

  return fieldTypes;
}

