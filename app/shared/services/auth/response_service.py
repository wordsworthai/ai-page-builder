from urllib.parse import urlparse
from fastapi import Request, Response
from app.core.config import (
    COOKIE_DOMAIN,
    COOKIE_SAMESITE,
    JWT_COOKIE_NAME,
    OAUTH_REDIRECT_COOKIE_NAME,
    REDIRECT_AFTER_LOGIN,
    config,
)


def _origin_from_url(url: str) -> str | None:
    try:
        parsed = urlparse(url)
        if parsed.scheme in {"http", "https"} and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}"
    except Exception:
        return None
    return None


def build_dashboard_redirect_from_request(request: Request) -> str:
    """
    Build post-login dashboard redirect URL from request context.

    Priority:
    1. Explicit `redirect_to` query param if it shares origin with request headers
    2. Request Origin header
    3. Request Referer header origin
    4. Configured REDIRECT_AFTER_LOGIN fallback
    """
    default_redirect = REDIRECT_AFTER_LOGIN
    default_origin = _origin_from_url(default_redirect)

    header_origin = request.headers.get("origin")
    referer = request.headers.get("referer")
    referer_origin = _origin_from_url(referer) if referer else None
    trusted_origins = {origin for origin in [header_origin, referer_origin] if origin}

    explicit_redirect = request.query_params.get("redirect_to")
    if explicit_redirect:
        parsed_explicit = urlparse(explicit_redirect)
        if parsed_explicit.scheme in {"http", "https"} and parsed_explicit.netloc:
            explicit_origin = f"{parsed_explicit.scheme}://{parsed_explicit.netloc}"
            if explicit_origin in trusted_origins or (
                default_origin and explicit_origin == default_origin
            ):
                explicit_path = parsed_explicit.path or "/dashboard"
                return f"{explicit_origin}{explicit_path}"

    if header_origin:
        return f"{header_origin.rstrip('/')}/dashboard"
    if referer_origin:
        return f"{referer_origin.rstrip('/')}/dashboard"

    return default_redirect


def set_auth_cookie(response: Response, token: str) -> None:
    """Set authentication cookie with environment-appropriate configuration."""
    cookie_config = {
        "key": JWT_COOKIE_NAME,
        "value": token,
        "httponly": True,
        "secure": True,
        "max_age": config.access_token_expire_minutes * 60,
        "samesite": COOKIE_SAMESITE,
    }

    if COOKIE_DOMAIN:
        cookie_config["domain"] = COOKIE_DOMAIN

    response.set_cookie(**cookie_config)


def clear_auth_cookie(response: Response) -> None:
    """Delete authentication cookie with environment-appropriate configuration."""
    delete_config = {
        "key": JWT_COOKIE_NAME,
        "samesite": COOKIE_SAMESITE,
        "secure": True,
    }

    if COOKIE_DOMAIN:
        delete_config["domain"] = COOKIE_DOMAIN

    response.delete_cookie(**delete_config)


def set_oauth_redirect_cookie(response: Response, redirect_after_login: str) -> None:
    """Store short-lived post-OAuth redirect target."""
    cookie_config = {
        "key": OAUTH_REDIRECT_COOKIE_NAME,
        "value": redirect_after_login,
        "httponly": True,
        "secure": True,
        "max_age": 10 * 60,  # 10 minutes; enough for OAuth roundtrip
        "samesite": COOKIE_SAMESITE,
    }
    if COOKIE_DOMAIN:
        cookie_config["domain"] = COOKIE_DOMAIN
    response.set_cookie(**cookie_config)


def clear_oauth_redirect_cookie(response: Response) -> None:
    """Delete short-lived OAuth redirect cookie once consumed."""
    delete_config = {
        "key": OAUTH_REDIRECT_COOKIE_NAME,
        "samesite": COOKIE_SAMESITE,
        "secure": True,
    }
    if COOKIE_DOMAIN:
        delete_config["domain"] = COOKIE_DOMAIN
    response.delete_cookie(**delete_config)
