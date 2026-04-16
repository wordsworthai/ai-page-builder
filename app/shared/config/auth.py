import logging
from typing import Any, Awaitable, Callable, Dict, Optional
from urllib.parse import urlparse

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import FRONTEND_URL, config

logger = logging.getLogger(__name__)

BusinessCreatedHook = Callable[[str, Dict[str, Any], AsyncSession], Awaitable[None]]


class AuthConfig:
    """Product-extensible auth configuration registry."""

    def __init__(self) -> None:
        self.business_hooks: dict[str, list[BusinessCreatedHook]] = {
            "on_business_created": []
        }
        self._redirect_after_login: Optional[str] = None

    def register_business_hooks(
        self, hooks: dict[str, BusinessCreatedHook]
    ) -> None:
        """Register business lifecycle hooks (e.g., on_business_created)."""
        for event_name, hook in hooks.items():
            self.business_hooks.setdefault(event_name, []).append(hook)

    async def run_on_business_created(
        self,
        business_id: str,
        business_data: dict[str, Any],
        db: AsyncSession,
    ) -> None:
        """
        Run all on_business_created hooks.

        Hook failures are logged and ignored so auth flow remains resilient.
        """
        hooks = self.business_hooks.get("on_business_created", [])
        for hook in hooks:
            try:
                await hook(business_id, business_data, db)
            except Exception as exc:
                logger.error(
                    "Auth business hook failed for business %s: %s",
                    business_id,
                    exc,
                    exc_info=True,
                )

    def register_redirect_after_login(self, path_or_url: str) -> None:
        """Register product-specific post-login redirect path or URL."""
        self._redirect_after_login = path_or_url.strip()

    def get_redirect_after_login(self) -> str:
        """
        Resolve redirect URL:
        - absolute URL: use as-is
        - path: prepend FRONTEND_URL
        - not set/invalid: fallback to config.redirect_after_login
        """
        value = self._redirect_after_login
        if value:
            parsed = urlparse(value)
            if parsed.scheme in {"http", "https"} and parsed.netloc:
                return value
            if value.startswith("/"):
                return f"{FRONTEND_URL.rstrip('/')}{value}"

        return config.redirect_after_login


# Global auth configuration instance; products register hooks at startup.
auth_config = AuthConfig()
