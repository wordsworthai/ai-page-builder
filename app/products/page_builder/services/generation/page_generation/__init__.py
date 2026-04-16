"""Page generation service package. Export GenerationService and get_generation_service."""
from app.products.page_builder.services.generation.page_generation.service import (
    GenerationService,
    get_generation_service,
)

__all__ = ["GenerationService", "get_generation_service"]
