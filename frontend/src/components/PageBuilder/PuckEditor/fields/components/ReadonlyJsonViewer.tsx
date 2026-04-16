import { useMemo, useState } from "react";
import { normalizeValueForViewer } from "../utils/normalizeValueForViewer";

type ReadonlyJsonViewerProps = {
  value: unknown;
  title?: string;
  defaultExpanded?: boolean;
  showCopy?: boolean;
};

export function ReadonlyJsonViewer({
  value,
  title,
  defaultExpanded = true,
  showCopy = true,
}: ReadonlyJsonViewerProps) {
  const normalized = useMemo(() => normalizeValueForViewer(value), [value]);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const text = normalized.displayText;

  return (
    <div className="w-full">
      {(title || showCopy) && (
        <div className="flex items-center justify-between gap-2 mb-2">
          <button
            type="button"
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
            onClick={() => setExpanded((v) => !v)}
          >
            {title ?? "Value"} {expanded ? "▾" : "▸"}
          </button>
          {showCopy && (
            <button
              type="button"
              className="text-xs px-2 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-700"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(text ?? "");
                } catch {
                  // ignore
                }
              }}
            >
              Copy
            </button>
          )}
        </div>
      )}

      {expanded && (
        <pre
          className="text-xs leading-relaxed bg-gray-50 border border-gray-200 rounded p-3 overflow-auto max-h-64 whitespace-pre-wrap break-words"
          aria-label="Readonly JSON viewer"
        >
          {text}
        </pre>
      )}
    </div>
  );
}

