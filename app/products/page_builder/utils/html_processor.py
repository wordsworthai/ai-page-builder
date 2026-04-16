"""
HTML processing utility for publishing.

Handles:
- Title injection/replacement
- Meta description injection/replacement
- Favicon link injection
- Tailwind CDN injection (preload + FOUC veil + readiness observer)
- WWAI base stylesheet: dedupe links, strip legacy prepended inline, single <link> at top of <head>
"""

import hashlib
import html as html_stdlib
import re
from pathlib import Path
from typing import Optional

from fastapi import HTTPException


class HTMLProcessingError(HTTPException):
    """Custom exception for HTML processing errors"""
    def __init__(self, detail: str):
        super().__init__(status_code=400, detail=detail)


WWAI_BASE_STYLE_FILENAME = "wwai_base_style.css"

# `<link rel="stylesheet" href="...wwai_base_style.css">` (href quoted; attribute order may vary)
_WWAI_BASE_STYLE_LINK_RE = re.compile(
    r'<link\s[^>]*?\bhref\s*=\s*(["\'])([^"\']*wwai_base_style\.css[^"\']*)\1[^>]*>',
    re.IGNORECASE,
)

TAILWIND_BROWSER_CDN = "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"

_wwai_base_style_css_cache: Optional[str] = None


def _wwai_base_style_css_path() -> Path:
    # This module lives under page_builder/utils/; bundled CSS is page_builder/static/boilerplate/
    return (
        Path(__file__).resolve().parent.parent
        / "static"
        / "boilerplate"
        / "wwai_base_style.css"
    )


def _load_wwai_base_style_css() -> str:
    """Load bundled wwai_base_style.css (kept in sync with curation boilerplate)."""
    global _wwai_base_style_css_cache
    if _wwai_base_style_css_cache is not None:
        return _wwai_base_style_css_cache
    path = _wwai_base_style_css_path()
    if not path.is_file():
        raise HTMLProcessingError(
            f"Bundled WWAI base stylesheet missing: {path}. "
            "Add app/products/page_builder/static/boilerplate/wwai_base_style.css "
            "or set include_wwai_base_stylesheet=False."
        )
    _wwai_base_style_css_cache = path.read_text(encoding="utf-8")
    return _wwai_base_style_css_cache


def get_wwai_base_style_css_bytes() -> bytes:
    """Raw bytes of bundled wwai_base_style.css for S3 upload."""
    path = _wwai_base_style_css_path()
    if not path.is_file():
        raise HTMLProcessingError(
            f"Bundled WWAI base stylesheet missing: {path}. "
            "Add app/products/page_builder/static/boilerplate/wwai_base_style.css."
        )
    return path.read_bytes()


def _dedupe_and_insert_wwai_stylesheet_link(html: str, href: str) -> str:
    """
    Remove all wwai_base_style.css <link> tags.
    then insert a single stylesheet link as the first child of <head>.
    """
    while _WWAI_BASE_STYLE_LINK_RE.search(html):
        html = _WWAI_BASE_STYLE_LINK_RE.sub("", html, count=1)

    safe_href = html_stdlib.escape(href, quote=True)
    link_tag = (
        f'<link rel="stylesheet" href="{safe_href}" data-wwai-boilerplate="1">'
    )

    def _after_head_open(m: re.Match[str]) -> str:
        return m.group(1) + "\n" + link_tag

    return re.sub(
        r"(<head[^>]*>)",
        _after_head_open,
        html,
        count=1,
        flags=re.IGNORECASE,
    )


def process_html_for_publishing(
    html_content: str,
    page_title: Optional[str] = None,
    description: Optional[str] = None,
    favicon_filename: str = "favicon.ico",
    inject_tailwind: bool = True,
    form_submit_endpoint: Optional[str] = None,
    include_wwai_base_stylesheet: bool = True,
    wwai_stylesheet_href: str = f"/{WWAI_BASE_STYLE_FILENAME}",
) -> str:
    """
    Process HTML before publishing to S3.

    Modifications:
    1. Dedupe wwai_base_style links and insert one <link> at top of <head> (optional)
    2. Replace/add <title> tag
    3. Replace/add meta description
    4. Add favicon link
    5. Inject Tailwind CDN script (with preload + FOUC veil + readiness observer)
    6. Inject window.FORM_SUBMIT_ENDPOINT (for published page forms)

    Args:
        html_content: Raw HTML string
        page_title: Page title to inject (optional)
        description: Meta description to inject (optional)
        favicon_filename: Name of favicon file (default: favicon.ico)
        inject_tailwind: Whether to inject Tailwind CDN (default: True)
        form_submit_endpoint: Full URL for form submissions
        include_wwai_base_stylesheet: Insert one wwai_base_stylesheet <link> after deduping (default: True)
        wwai_stylesheet_href: href for that link; use "/wwai_base_style.css" for live site root,
            or "wwai_base_style.css" for preview HTML next to the file

    Returns:
        Processed HTML string

    Raises:
        HTMLProcessingError: If HTML is malformed (no <head> tag)
    """
    # Validate HTML has <head> tag
    if not re.search(r'<head[^>]*>', html_content, re.IGNORECASE):
        raise HTMLProcessingError(
            "Invalid HTML: Missing <head> tag. Cannot process HTML for publishing."
        )

    # 1. Single WWAI base stylesheet reference (dedupe + strip legacy inline)
    if include_wwai_base_stylesheet:
        _load_wwai_base_style_css()  # validate bundled file exists before we publish
        html_content = _dedupe_and_insert_wwai_stylesheet_link(
            html_content, wwai_stylesheet_href
        )

    # 2. Handle title tag
    if page_title:
        html_content = _inject_or_replace_title(html_content, page_title)

    # 3. Handle meta description
    if description:
        html_content = _inject_or_replace_meta_description(html_content, description)

    # 4. Add favicon link
    html_content = _inject_favicon_link(html_content, favicon_filename)

    # 5. Inject Tailwind CDN
    if inject_tailwind:
        html_content = _inject_tailwind_cdn(html_content)

    # 6. Inject form submit endpoint (for published page forms)
    if form_submit_endpoint:
        html_content = _inject_form_submit_endpoint(html_content, form_submit_endpoint)

    return html_content


def compute_html_hash(html_content: str) -> str:
    """
    Compute SHA256 hash of HTML content for versioning.
    
    Args:
        html_content: HTML string
        
    Returns:
        Hex string of SHA256 hash
    """
    return hashlib.sha256(html_content.encode('utf-8')).hexdigest()


def _inject_or_replace_title(html: str, title: str) -> str:
    """
    Replace existing <title> tag or add new one in <head>.
    
    Args:
        html: HTML content
        title: Title text
        
    Returns:
        Modified HTML
    """
    # Escape title for HTML
    escaped_title = _escape_html(title)
    new_title_tag = f"<title>{escaped_title}</title>"
    
    # Check if title tag exists
    title_pattern = r'<title[^>]*>.*?</title>'
    if re.search(title_pattern, html, re.IGNORECASE | re.DOTALL):
        # Replace existing title
        html = re.sub(
            title_pattern,
            new_title_tag,
            html,
            count=1,
            flags=re.IGNORECASE | re.DOTALL
        )
    else:
        # Add title after opening <head> tag
        html = re.sub(
            r'(<head[^>]*>)',
            rf'\1\n    {new_title_tag}',
            html,
            count=1,
            flags=re.IGNORECASE
        )
    
    return html


def _inject_or_replace_meta_description(html: str, description: str) -> str:
    """
    Replace existing meta description or add new one in <head>.
    
    Args:
        html: HTML content
        description: Description text
        
    Returns:
        Modified HTML
    """
    # Escape description for HTML
    escaped_description = _escape_html(description)
    new_meta_tag = f'<meta name="description" content="{escaped_description}">'
    
    # Check if meta description exists
    meta_pattern = r'<meta\s+name=["\']description["\']\s+content=["\'][^"\']*["\'][^>]*>'
    if re.search(meta_pattern, html, re.IGNORECASE):
        # Replace existing meta description
        html = re.sub(
            meta_pattern,
            new_meta_tag,
            html,
            count=1,
            flags=re.IGNORECASE
        )
    else:
        # Add meta description after opening <head> tag
        html = re.sub(
            r'(<head[^>]*>)',
            rf'\1\n    {new_meta_tag}',
            html,
            count=1,
            flags=re.IGNORECASE
        )
    
    return html


def _inject_favicon_link(html: str, favicon_filename: str) -> str:
    """
    Add favicon link to <head>. Always adds, even if one exists.
    
    Args:
        html: HTML content
        favicon_filename: Filename of favicon (e.g., "favicon.ico", "favicon.png")
        
    Returns:
        Modified HTML
    """
    # Determine MIME type based on extension
    extension = favicon_filename.split('.')[-1].lower()
    mime_type_map = {
        'ico': 'image/x-icon',
        'png': 'image/png',
        'svg': 'image/svg+xml',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
    }
    mime_type = mime_type_map.get(extension, 'image/x-icon')
    
    favicon_link = f'<link rel="icon" href="/{favicon_filename}" type="{mime_type}">'
    
    # Add before closing </head> tag
    html = re.sub(
        r'(</head>)',
        rf'    {favicon_link}\n\1',
        html,
        count=1,
        flags=re.IGNORECASE
    )
    
    return html


def _inject_tailwind_cdn(html: str) -> str:
    """
    Inject Tailwind CSS v4 browser build: preload, opaque loading veil + spinner,
    readiness observer, deferred script.

    Uses a fixed solid opaque overlay so page content is not visible until Tailwind is ready
    (avoids seeing half-styled content through a translucent veil).

    Args:
        html: HTML content

    Returns:
        Modified HTML
    """
    veil_css = """<style id="wwai-tw-foil">
#wwai-tw-overlay{position:fixed;inset:0;z-index:2147483647;background:#fff;opacity:1;visibility:visible;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;padding:24px;transition:opacity .35s ease,visibility .35s ease;font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:rgba(0,0,0,0.55);box-sizing:border-box}
#wwai-tw-overlay .wwai-tw-spinner{width:36px;height:36px;border:3px solid rgba(0,0,0,0.12);border-top-color:rgba(0,0,0,0.45);border-radius:50%;animation:wwaiTwSpin .8s linear infinite}
#wwai-tw-overlay .wwai-tw-veil-label{user-select:none}
html.wwai-tw-ready #wwai-tw-overlay{opacity:0;visibility:hidden;pointer-events:none}
@keyframes wwaiTwSpin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){#wwai-tw-overlay .wwai-tw-spinner{animation:none;border-color:rgba(0,0,0,0.25)}}
</style>"""
    preload = (
        f'<link rel="preload" as="script" crossorigin href="{TAILWIND_BROWSER_CDN}">'
    )
    # Mount overlay as soon as <body> exists; fade/remove when Tailwind injects or timeout.
    observer = (
        "<script>"
        '(function(){var d=document.documentElement;'
        "function mount(){"
        'if(document.getElementById("wwai-tw-overlay")||!document.body)return;'
        'var o=document.createElement("div");'
        'o.id="wwai-tw-overlay";'
        'o.setAttribute("aria-busy","true");'
        'o.setAttribute("aria-live","polite");'
        'o.setAttribute("aria-label","Loading your page");'
        'o.innerHTML=\'<div class="wwai-tw-spinner"></div>'
        '<span class="wwai-tw-veil-label">Fetching your webpage…</span>\';'
        "document.body.appendChild(o);"
        "}"
        "if(document.body)mount();"
        "else{"
        "var mb=new MutationObserver(function(){"
        "if(document.body){mount();mb.disconnect();}"
        "});"
        "mb.observe(d,{childList:true,subtree:true});"
        "}"
        "function r(){"
        'd.classList.add("wwai-tw-ready");'
        'var o=document.getElementById("wwai-tw-overlay");'
        "if(o){"
        'o.setAttribute("aria-busy","false");'
        "setTimeout(function(){"
        "if(o&&o.parentNode)o.parentNode.removeChild(o);"
        "},400);"
        "}"
        "}"
        "function c(){"
        "var s=document.querySelectorAll(\"style\");"
        "for(var i=0;i<s.length;i++){"
        'var t=s[i].textContent||"";'
        'if(t.indexOf("tailwindcss")!==-1){r();return true;}'
        "}"
        "return false;"
        "}"
        "if(c())return;"
        "var mo=new MutationObserver(function(){if(c())mo.disconnect();});"
        "mo.observe(d,{childList:true,subtree:true});"
        "setTimeout(function(){r();mo.disconnect();},15000);"
        "})();"
        "</script>"
    )
    script = f'<script src="{TAILWIND_BROWSER_CDN}" defer></script>'

    block = f"    {veil_css}\n    {preload}\n    {observer}\n    {script}\n"
    html = re.sub(
        r'(</head>)',
        rf'{block}\1',
        html,
        count=1,
        flags=re.IGNORECASE
    )

    return html


def _inject_form_submit_endpoint(html: str, endpoint_url: str) -> str:
    """
    Inject window.FORM_SUBMIT_ENDPOINT before closing </head> tag.
    Used by form components on published pages to submit to the correct API.

    Args:
        html: HTML content
        endpoint_url: Full URL (e.g. http://localhost:8020/api/forms/form-submissions or
                      https://api.example.com/api/forms/form-submissions)

    Returns:
        Modified HTML
    """
    # Escape for JavaScript string context (backslash and double-quote)
    escaped_url = endpoint_url.replace("\\", "\\\\").replace('"', '\\"')
    script = f'<script>window.FORM_SUBMIT_ENDPOINT = "{escaped_url}";</script>'

    # Add before closing </head> tag
    html = re.sub(
        r'(</head>)',
        rf'    {script}\n\1',
        html,
        count=1,
        flags=re.IGNORECASE
    )

    return html


def _escape_html(text: str) -> str:
    """
    Escape HTML special characters.
    
    Args:
        text: Text to escape
        
    Returns:
        Escaped text
    """
    replacements = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }
    
    for char, escaped in replacements.items():
        text = text.replace(char, escaped)
    
    return text


def get_file_size_bytes(content: bytes) -> int:
    """
    Get size of content in bytes.
    
    Args:
        content: Bytes content
        
    Returns:
        Size in bytes
    """
    return len(content)


def validate_html_size(content: bytes, max_size_mb: int = 10) -> bool:
    """
    Validate HTML file size.
    
    Args:
        content: HTML content as bytes
        max_size_mb: Maximum allowed size in MB
        
    Returns:
        True if valid
        
    Raises:
        HTTPException: If file is too large
    """
    size_bytes = get_file_size_bytes(content)
    max_size_bytes = max_size_mb * 1024 * 1024
    
    if size_bytes > max_size_bytes:
        size_mb = size_bytes / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"HTML file is too large ({size_mb:.2f}MB). Maximum allowed: {max_size_mb}MB"
        )
    
    return True