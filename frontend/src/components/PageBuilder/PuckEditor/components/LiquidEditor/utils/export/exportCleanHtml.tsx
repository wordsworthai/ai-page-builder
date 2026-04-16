import React from "react";

export type ExportHtmlOptions = {
  title?: string;
  bodyCss?: string;
  containerClass?: string; // wrapper around the render root
};

const DEFAULT_BODY_CSS = [
  "body {",
  "  margin: 0;",
  "  padding: 0;",
  "  box-sizing: border-box;",
  "}",
  "",
  ".wwai_container {",
  "  max-width: 100%;",
  "  margin: 0 auto;",
  "}",
].join("\n");

const DEFAULT_HEIGHT_FIX = [
  // Swiper-based layouts often set wrapper/slide heights; relax them for static export
  ".swiper-wrapper, .swiper-slide {",
  "  height: auto !important;",
  "}",
].join("\n");

// Render <Render> (no DropZone wrappers) into a hidden iframe and return the full HTML as a string
export async function buildCleanHtml(
  config: any,
  data: any,
  options: ExportHtmlOptions = {}
): Promise<string> {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  // Give the hidden iframe a reasonable viewport so lazy assets/layout can resolve
  iframe.style.width = "1440px";
  iframe.style.height = "4000px";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(getBaseHtml(options));
  doc.close();

  const rootEl = doc.getElementById("render-root") as HTMLElement;
  const { createRoot } = await import("react-dom/client");
  const { Render } = await import("@measured/puck");
  const root = createRoot(rootEl);
  root.render(<Render config={config} data={data} />);

  // Ensure layout and assets are settled before serialization
  await waitForContentToSettle(doc);
  const html = doc.documentElement.outerHTML;

  root.unmount();
  document.body.removeChild(iframe);
  return html;
}

// Render and trigger a download (uses buildCleanHtml under the hood)
export async function exportCleanHtml(
  config: any,
  data: any,
  filename = "page.html",
  options: ExportHtmlOptions = {}
) {
  const html = await buildCleanHtml(config, data, options);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Build the minimal HTML shell used for clean export (parametrized like the Python example)
export function getBaseHtml(opts: ExportHtmlOptions = {}): string {
  const title = opts.title ?? "Page";
  const bodyCss = (opts.bodyCss ?? DEFAULT_BODY_CSS).trim();
  const containerClass = opts.containerClass ?? "wwai_container";
  const heightFixCss = DEFAULT_HEIGHT_FIX + "\n";

  return [
    "<!doctype html>",
    "<html>",
    "  <head>",
    '    <meta charset="utf-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `    <title>${escapeHtml(title)}</title>`,
    "    <style>",
    "      *, *::before, *::after { box-sizing: inherit; }",
    "      #" + "render-root { min-height: 100%; }",
    "      ." + escapeHtml(containerClass) + " { position: relative; }",
    heightFixCss
      .split("\n")
      .map((l) => (l.trim().length ? `      ${l}` : ""))
      .join("\n"),
    bodyCss
      .split("\n")
      .map((l) => (l.trim().length ? `      ${l}` : ""))
      .join("\n"),
    "    </style>",
    "  </head>",
    "  <body>",
    `    <div class="${escapeHtml(containerClass)}">`,
    '      <div id="render-root"></div>',
    "    </div>",
    "  </body>",
    "</html>",
  ].join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function waitForContentToSettle(doc: Document): Promise<void> {
  // Eager-load images (lazy images may not load in an offscreen iframe)
  const images: HTMLImageElement[] = Array.from(doc.images) as HTMLImageElement[];
  images.forEach((img) => {
    try {
      (img as any).loading = "eager";
    } catch {}
  });
  await Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : ("decode" in img
            ? (img as any).decode().catch(() => {})
            : new Promise<void>((res) => {
                const done = () => res();
                img.onload = done;
                img.onerror = done;
              }))
    )
  );
  // Wait for fonts if supported
  try {
    // @ts-ignore
    if (doc.fonts && doc.fonts.ready) {
      // @ts-ignore
      await doc.fonts.ready;
    }
  } catch {}
  // Wait for height to stabilize (handles JS equalizers/async layout)
  await waitForStableHeight(doc, 1200);
}

async function waitForStableHeight(doc: Document, maxMs = 1200): Promise<void> {
  const start = performance.now();
  let last = 0;
  let stableCount = 0;
  while (performance.now() - start < maxMs) {
    const h =
      Math.max(
        doc.documentElement.scrollHeight,
        doc.body.scrollHeight,
        doc.documentElement.offsetHeight,
        doc.body.offsetHeight
      ) || 0;
    if (Math.abs(h - last) < 1) {
      stableCount += 1;
      if (stableCount >= 3) break;
    } else {
      stableCount = 0;
      last = h;
    }
    await new Promise((r) => setTimeout(r, 80));
  }
  // One more frame
  await new Promise((r) => requestAnimationFrame(() => r(null)));
}


