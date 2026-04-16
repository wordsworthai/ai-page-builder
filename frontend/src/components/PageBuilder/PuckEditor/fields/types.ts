import type { ReactElement } from "react";

/**
 * Runtime contract:
 * - Every field has `type: string`
 * - Each field type can carry its own config (options, fetchList, meta, etc.)
 *
 * TS contract:
 * - Keep a permissive `Field` type so unknown field types don't break compilation.
 * - Known field types can be introduced incrementally as discriminated unions later.
 */

export type FieldType = string;

export type BaseField = {
  type: FieldType;
  label?: string;
  elementId?: string;
  sectionId?: string;
  blockType?: string;      // e.g., "features_block" or "wwai_base_settings"
  blockIndex?: number;     // e.g., 0, 1, 2 for block instances
  // Allow arbitrary per-type config payload
  [key: string]: any;
};

export type Field = BaseField;

export type FieldRenderProps = {
  field: Field;
  name: string;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
};

export type FieldRenderer = (props: FieldRenderProps) => ReactElement;

