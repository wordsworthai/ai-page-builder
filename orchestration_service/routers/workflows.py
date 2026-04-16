from fastapi import APIRouter, HTTPException, Query, Request
from typing import Type, TypeVar
import logging

from orchestration_service.schemas.workflow_schemas import (
    WorkflowTriggerResponse
)
from orchestration_service.utils.dataclass_serialization import dict_to_dataclass
from wwai_agent_orchestration.contracts.landing_page_builder.workflow_inputs import (
    LandingPageInput,
    PartialAutopopInput,
    PresetSectionsInput,
    RegenerateSectionInput,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/workflows", tags=["Workflows"])

# Type variable for workflow inputs
T = TypeVar('T', LandingPageInput, PartialAutopopInput, PresetSectionsInput, RegenerateSectionInput)


def _get_landing_page_workflow_service():
    """Lazy import so wwai_agent_orchestration (and its Redis connection) is only loaded on first trigger."""
    from orchestration_service.services.landing_page_workflow_service import landing_page_workflow_service
    return landing_page_workflow_service


async def _trigger_workflow_handler(
    request: Request,
    workflow_type: str,
    input_class: Type[T],
    callback_url: str,
    node_update_url: str = None,
    workflow_name: str = "workflow",
) -> WorkflowTriggerResponse:
    """
    Common handler for triggering workflows.
    
    Args:
        request: FastAPI request object
        workflow_type: Type of workflow ("full" or "partial_autopop")
        input_class: The workflow input dataclass class
        callback_url: URL to POST completion/error callbacks
        node_update_url: Optional URL to POST node update events
        workflow_name: Name of the workflow for error messages
    
    Returns:
        WorkflowTriggerResponse
    """
    try:
        body = await request.json()
        workflow_input = dict_to_dataclass(input_class, body)
        service = _get_landing_page_workflow_service()
        response = await service.trigger_workflow(
            workflow_type=workflow_type,
            workflow_input=workflow_input,
            callback_url=callback_url,
            node_update_url=node_update_url,
        )
        return response
    except Exception as e:
        logger.error(f"Failed to trigger {workflow_name}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/landing-page-recommendation/trigger", response_model=WorkflowTriggerResponse)
async def trigger_landing_page_workflow(
    request: Request,
    callback_url: str = Query(..., description="URL to POST completion/error callbacks"),
    node_update_url: str = Query(None, description="URL to POST node update events"),
):
    """
    Trigger the landing page recommendation workflow.
    Requires Redis (wwai_agent_orchestration connects at import). Start Redis and set REDIS_HOST/REDIS_PORT.
    
    Uses LandingPageInput from agent orchestration package directly.
    Webhook URLs are passed as query parameters.
    
    Note: We manually deserialize the request body to ensure nested dataclasses (ExecutionConfig) are properly converted.
    """
    return await _trigger_workflow_handler(
        request=request,
        workflow_type="full",
        input_class=LandingPageInput,
        callback_url=callback_url,
        node_update_url=node_update_url,
        workflow_name="Landing page workflow",
    )


@router.post("/partial-autopop/trigger", response_model=WorkflowTriggerResponse)
async def trigger_partial_autopop_workflow(
    request: Request,
    callback_url: str = Query(..., description="URL to POST completion/error callbacks"),
    node_update_url: str = Query(None, description="URL to POST node update events"),
):
    """
    Trigger the partial autopop workflow (for color theme regeneration, text regeneration, or media regeneration).
    Requires Redis (wwai_agent_orchestration connects at import). Start Redis and set REDIS_HOST/REDIS_PORT.
    
    Uses PartialAutopopInput from agent orchestration package directly.
    Webhook URLs are passed as query parameters.
    
    Note: We manually deserialize the request body to ensure nested dataclasses (ExecutionConfig) are properly converted.
    """
    return await _trigger_workflow_handler(
        request=request,
        workflow_type="partial_autopop",
        input_class=PartialAutopopInput,
        callback_url=callback_url,
        node_update_url=node_update_url,
        workflow_name="partial autopop workflow",
    )


@router.post("/direct-section/trigger", response_model=WorkflowTriggerResponse)
async def trigger_direct_section_workflow(
    request: Request,
    callback_url: str = Query(..., description="URL to POST completion/error callbacks"),
    node_update_url: str = Query(None, description="URL to POST node update events"),
):
    """
    Trigger the direct section workflow (template generation with provided section IDs).
    Uses PresetSectionsInput with section_ids passed via execution_config.
    Webhook URLs are passed as query parameters.
    """
    return await _trigger_workflow_handler(
        request=request,
        workflow_type="preset_sections",
        input_class=PresetSectionsInput,
        callback_url=callback_url,
        node_update_url=node_update_url,
        workflow_name="Direct Section workflow",
    )


@router.post("/regenerate-section/trigger", response_model=WorkflowTriggerResponse)
async def trigger_regenerate_section_workflow(
    request: Request,
    callback_url: str = Query(..., description="URL to POST completion/error callbacks"),
    node_update_url: str = Query(None, description="URL to POST node update events"),
):
    """
    Trigger the regenerate section workflow (AI content regeneration for a single section).
    Uses RegenerateSectionInput with section_id and section_index.
    Webhook URLs are passed as query parameters.
    """
    return await _trigger_workflow_handler(
        request=request,
        workflow_type="regenerate_section",
        input_class=RegenerateSectionInput,
        callback_url=callback_url,
        node_update_url=node_update_url,
        workflow_name="Regenerate Section workflow",
    )