"""Workflow orchestration: trigger and run landing page full workflow / provided-section workflow / autopop-only workflow."""       
import logging
import uuid
from typing import Any, Awaitable, Callable, Dict, List, Literal, Optional, Union

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import config
from app.shared.services.streaming.generation_redis_service import generation_redis_service
from app.products.page_builder.services.generation.workflows import (
    trigger_landing_page_workflow,
    trigger_partial_autopop_workflow,
    trigger_direct_section_workflow,
    trigger_regenerate_section_workflow,
)
from wwai_agent_orchestration.contracts.landing_page_builder.user_input import (
    BrandContext,
    ExternalDataContext,
    GenericContext,
    WebsiteContext,
)
from wwai_agent_orchestration.contracts.landing_page_builder.workflow_inputs import (
    LandingPageInput,
    PartialAutopopInput,
    PresetSectionsInput,
    RegenerateSectionInput,
)
from wwai_agent_orchestration.utils.landing_page_builder.execution_config_utils import (
    create_execution_config,
)

logger = logging.getLogger(__name__)


async def trigger_workflow_with_status_management(
    generation_version_id: uuid.UUID,
    workflow_type: Literal["full", "partial_autopop", "preset_sections", "regenerate_section"],
    workflow_input_factory: Callable[
        [], Awaitable[Union[LandingPageInput, PartialAutopopInput, PresetSectionsInput, RegenerateSectionInput]]
    ],
    event_data: Dict[str, Any],
    log_message: str,
) -> None:
    """
    Initialize Redis status, call workflow_input_factory(), then trigger via orchestration client.
    On exception updates Redis status to failed and re-raises.
    """
    generation_redis_service.initialize_generation(
        generation_version_id, status="pending"
    )
    generation_redis_service.update_status(generation_version_id, "processing")
    generation_redis_service.add_event(
        generation_version_id, "workflow_started", data=event_data
    )

    callback_url = f"{config.backend_url}/api/generations/internal/callback"
    node_update_url = f"{config.backend_url}/api/generations/internal/node-update"

    workflow_input = await workflow_input_factory()

    try:
        if workflow_type == "partial_autopop":
            await trigger_partial_autopop_workflow(
                workflow_input=workflow_input,
                callback_url=callback_url,
                node_update_url=node_update_url,
            )
        elif workflow_type == "preset_sections":
            await trigger_direct_section_workflow(
                workflow_input=workflow_input,
                callback_url=callback_url,
                node_update_url=node_update_url,
            )
        elif workflow_type == "regenerate_section":
            await trigger_regenerate_section_workflow(
                workflow_input=workflow_input,
                callback_url=callback_url,
                node_update_url=node_update_url,
            )
        else:
            await trigger_landing_page_workflow(
                workflow_input=workflow_input,
                callback_url=callback_url,
                node_update_url=node_update_url,
            )
        logger.info(log_message)
    except Exception as e:
        logger.error(f"Failed to trigger orchestration: {e}", exc_info=True)
        generation_redis_service.update_status(generation_version_id, "failed")
        generation_redis_service.set_error(generation_version_id, str(e))
        raise


async def run_landing_page_workflow(
    db: AsyncSession,
    business_id: uuid.UUID,
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
    """Run landing page full workflow (agent path). Returns after creating the background task."""
    gen_id_str = str(generation_version_id)
    query_str = query if query is not None else ""

    async def create_workflow_input() -> LandingPageInput:
        execution_config = create_execution_config(
            enable_screenshot_compilation=False,
            enable_html_compilation=False,
            use_mock_autopopulation=False,
            enable_reflection=False,
            max_iterations=1,
        )
        return LandingPageInput(
            business_name=business_name,
            business_id=str(business_id),
            execution_config=execution_config,
            request_id=gen_id_str,
            generic_context=GenericContext(query=query_str, sector=None, page_url=None),
            website_context=WebsiteContext(
                website_intention=website_intention,
                website_tone=website_tone,
            ),
            brand_context=BrandContext(palette=palette, font_family=font_family),
            external_data_context=ExternalDataContext(yelp_url=yelp_url or ""),
        )

    await trigger_workflow_with_status_management(
        generation_version_id=generation_version_id,
        workflow_type="full",
        workflow_input_factory=create_workflow_input,
        event_data={"business_name": business_name},
        log_message=f"Triggered orchestration workflow for {generation_version_id}",
    )


async def run_with_provided_section_sequence(
    db: AsyncSession,
    business_id: uuid.UUID,
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
    """Run DirectSection workflow with provided section sequence (use-template path)."""
    section_ids = [
        m["section_id"]
        for rec in section_mapped_recommendations
        for m in rec.get("section_mappings", [])
    ]
    if not section_ids:
        raise ValueError(
            "section_mapped_recommendations must contain at least one section_id in section_mappings"
        )

    gen_id_str = str(generation_version_id)
    query_str = query if query is not None else ""

    async def create_workflow_input() -> PresetSectionsInput:
        execution_config = create_execution_config(
            section_ids=section_ids,
            enable_screenshot_compilation=False,
            enable_html_compilation=False,
            use_mock_autopopulation=False,
        )
        return PresetSectionsInput(
            business_name=business_name,
            business_id=str(business_id),
            request_id=gen_id_str,
            section_ids=section_ids,
            execution_config=execution_config,
            generic_context=GenericContext(query=query_str, sector=None, page_url=None),
            website_context=WebsiteContext(
                website_intention=website_intention,
                website_tone=website_tone,
            ),
            brand_context=BrandContext(palette=palette, font_family=font_family),
            external_data_context=ExternalDataContext(yelp_url=yelp_url or ""),
            page_type=page_type,
            parent_generation_version_id=parent_generation_version_id,
        )

    await trigger_workflow_with_status_management(
        generation_version_id=generation_version_id,
        workflow_type="preset_sections",
        workflow_input_factory=create_workflow_input,
        event_data={"business_name": business_name, "source": "use_template"},
        log_message=f"Triggered orchestration workflow (direct section) for {generation_version_id}",
    )


async def run_autopop_only_workflow(
    db: AsyncSession,
    business_id: uuid.UUID,
    source_generation_version_id: uuid.UUID,
    new_generation_version_id: uuid.UUID,
    palette: Optional[Dict[str, Any]] = None,
    font_family: Optional[str] = None,
    regenerate_mode: Literal["styles", "text", "media", "all"] = "styles",
) -> None:
    """Run Partial Autopop Workflow to regenerate styles or content."""
    gen_id_str = str(new_generation_version_id)
    source_id_str = str(source_generation_version_id)

    async def create_workflow_input() -> PartialAutopopInput:
        execution_config = create_execution_config(
            enable_screenshot_compilation=False,
            enable_html_compilation=False,
            use_mock_autopopulation=False,
        )

        brand_context = BrandContext(palette=palette, font_family=font_family)
        return PartialAutopopInput(
            request_id=gen_id_str,
            source_thread_id=source_id_str,
            execution_config=execution_config,
            regenerate_mode=regenerate_mode,
            brand_context=brand_context,
        )

    event_data = {"source_generation_id": source_id_str}
    if palette is not None:
        event_data["palette_id"] = palette.get("palette_id", "unknown")

    await trigger_workflow_with_status_management(
        generation_version_id=new_generation_version_id,
        workflow_type="partial_autopop",
        workflow_input_factory=create_workflow_input,
        event_data=event_data,
        log_message=(
            f"Triggered partial autopop workflow for {new_generation_version_id} "
            f"(source: {source_generation_version_id}, mode: {regenerate_mode})"
        ),
    )


async def run_regenerate_section_workflow(
    source_generation_version_id: uuid.UUID,
    new_generation_version_id: uuid.UUID,
    section_id: str,
    section_index: int,
) -> None:
    """Run Regenerate Section workflow - AI content regeneration for a single section."""
    gen_id_str = str(new_generation_version_id)
    source_id_str = str(source_generation_version_id)

    async def create_workflow_input() -> RegenerateSectionInput:
        execution_config = create_execution_config(
            enable_screenshot_compilation=False,
            enable_html_compilation=False,
            use_mock_autopopulation=False,
        )
        return RegenerateSectionInput(
            request_id=gen_id_str,
            source_thread_id=source_id_str,
            section_id=section_id,
            section_index=section_index,
            execution_config=execution_config,
        )

    await trigger_workflow_with_status_management(
        generation_version_id=new_generation_version_id,
        workflow_type="regenerate_section",
        workflow_input_factory=create_workflow_input,
        event_data={
            "source_generation_id": source_id_str,
            "section_id": section_id,
            "section_index": section_index,
        },
        log_message=(
            f"Triggered regenerate section workflow for {new_generation_version_id} "
            f"(source: {source_generation_version_id}, section: {section_id})"
        ),
    )
