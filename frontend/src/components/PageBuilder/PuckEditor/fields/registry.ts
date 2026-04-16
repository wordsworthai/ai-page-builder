import type { FieldRenderer } from "./types";

/**
 * Field type registry:
 * Maps `field.type` (string) -> renderer component.
 *
 * Note: Keep this registry small and explicit. Only types we want to override
 * should be registered. Unknown types will fall back to Puck defaults.
 */

const registry: Record<string, FieldRenderer> = {};

export function registerFieldType(type: string, renderer: FieldRenderer) {
  registry[type] = renderer;
}

export function getFieldRenderer(type: string): FieldRenderer | undefined {
  return registry[type];
}

export function hasFieldRenderer(type: string): boolean {
  return Boolean(registry[type]);
}

export function getRegisteredFieldTypes(): string[] {
  return Object.keys(registry);
}

