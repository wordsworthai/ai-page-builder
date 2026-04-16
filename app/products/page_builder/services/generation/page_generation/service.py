"""GenerationService facade - delegates to credits, config, provisioning, workflow, completion."""
import uuid
from typing import Any, Dict, List, Literal, Optional

from sqlalchemy.ext.asyncio import AsyncSession


from app.products.page_builder.services.generation.page_generation import completion
from app.products.page_builder.services.generation.page_generation import credits
from app.products.page_builder.services.generation.page_generation import provisioning
from app.products.page_builder.services.generation.page_generation import workflow


class GenerationService:
    """Service for managing AI page generation. Delegates to page_generation submodules."""

    def __init__(self, db: AsyncSession, business_id: uuid.UUID):
        self.db = db
        self.business_id = business_id

    async def validate_credits(self) -> None:
        await credits.validate_credits(self.db, self.business_id)

    async def deduct_credits(self, generation_version_id: uuid.UUID) -> None:
        await credits.deduct_credits(
            self.db, self.business_id, generation_version_id
        )

    async def provision_assets(
        self, business_name: str, website_intention: str
    ) -> Dict[str, Any]:
        return await provisioning.provision_for_create_site(
            self.db,
            self.business_id,
            business_name,
            website_intention,
        )

    async def run_landing_page_workflow(
        self,
        generation_version_id: uuid.UUID,
        business_name: str,
        website_intention: str,
        website_tone: str,
        yelp_url: Optional[str] = None,
        query: Optional[str] = None,
        palette: Optional[dict] = None,
        font_family: Optional[str] = None,
        enable_node_updates: bool = True,
    ) -> None:
        await workflow.run_landing_page_workflow(
            self.db,
            self.business_id,
            generation_version_id,
            business_name,
            website_intention,
            website_tone,
            yelp_url=yelp_url,
            query=query,
            palette=palette,
            font_family=font_family,
            enable_node_updates=enable_node_updates,
        )

    async def run_with_provided_section_sequence(
        self,
        generation_version_id: uuid.UUID,
        business_name: str,
        website_intention: str,
        website_tone: str,
        section_mapped_recommendations: List[Dict[str, Any]],
        yelp_url: Optional[str] = None,
        query: Optional[str] = None,
        palette: Optional[dict] = None,
        font_family: Optional[str] = None,
        page_type: str = "homepage",
        parent_generation_version_id: Optional[str] = None,
    ) -> None:
        await workflow.run_with_provided_section_sequence(
            self.db,
            self.business_id,
            generation_version_id,
            business_name,
            website_intention,
            website_tone,
            section_mapped_recommendations,
            yelp_url=yelp_url,
            query=query,
            palette=palette,
            font_family=font_family,
            page_type=page_type,
            parent_generation_version_id=parent_generation_version_id,
        )

    async def run_autopop_only_workflow(
        self,
        source_generation_version_id: uuid.UUID,
        new_generation_version_id: uuid.UUID,
        palette: Optional[Dict[str, Any]] = None,
        font_family: Optional[str] = None,
        regenerate_mode: Literal["styles", "text", "media", "all"] = "styles",
    ) -> None:
        await workflow.run_autopop_only_workflow(
            self.db,
            self.business_id,
            source_generation_version_id,
            new_generation_version_id,
            palette=palette,
            font_family=font_family,
            regenerate_mode=regenerate_mode,
        )

    async def run_regenerate_section_workflow(
        self,
        source_generation_version_id: uuid.UUID,
        new_generation_version_id: uuid.UUID,
        section_id: str,
        section_index: int,
    ) -> None:
        await workflow.run_regenerate_section_workflow(
            source_generation_version_id=source_generation_version_id,
            new_generation_version_id=new_generation_version_id,
            section_id=section_id,
            section_index=section_index,
        )

    async def handle_completion(
        self,
        generation_version_id: uuid.UUID,
        status: str,
        tokens_used: Optional[int] = None,
        estimated_cost_usd: Optional[float] = None,
        error_message: Optional[str] = None,
    ) -> None:
        await completion.handle_completion(
            self.db,
            generation_version_id,
            status,
            tokens_used=tokens_used,
            estimated_cost_usd=estimated_cost_usd,
            error_message=error_message,
        )


async def get_generation_service(
    db: AsyncSession, business_id: uuid.UUID
) -> GenerationService:
    """Get generation service instance."""
    return GenerationService(db, business_id)
