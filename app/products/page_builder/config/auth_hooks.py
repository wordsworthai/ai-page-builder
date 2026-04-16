from typing import Any, Dict

from sqlalchemy.ext.asyncio import AsyncSession

from app.products.page_builder.services.generation.google_maps_data_service import (
    store_google_maps_data,
)
from app.shared.config.auth import auth_config


async def on_business_created(
    business_id: str,
    business_data: Dict[str, Any],
    db: AsyncSession,
) -> None:
    """Persist Google Maps data for page_builder when available."""
    del db  # Hook signature includes db for generic integrations.
    google_maps_url = business_data.get("google_maps_url")
    google_maps_data = business_data.get("google_maps_data")
    if google_maps_url and google_maps_data:
        await store_google_maps_data(
            business_id=business_id,
            google_maps_url=google_maps_url,
            data=google_maps_data,
        )


def register() -> None:
    """Register page_builder auth hooks and redirect behavior."""
    auth_config.register_business_hooks({"on_business_created": on_business_created})
    auth_config.register_redirect_after_login("/dashboard")
