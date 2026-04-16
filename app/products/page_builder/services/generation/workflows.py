"""
Page Builder workflow trigger functions.
Wraps the generic OrchestrationClient with page-builder-specific workflow calls.
"""
from typing import Optional, Dict, Any

from wwai_agent_orchestration.contracts.landing_page_builder.workflow_inputs import (
    LandingPageInput,
    PartialAutopopInput,
    PresetSectionsInput,
    RegenerateSectionInput,
)

from app.shared.services.orchestration.orchestration_client import get_orchestration_client


async def trigger_landing_page_workflow(
    workflow_input: LandingPageInput,
    callback_url: str,
    node_update_url: Optional[str] = None,
) -> Dict[str, Any]:
    """Trigger Landing Page Recommendation Workflow."""
    client = get_orchestration_client()
    return await client._trigger_workflow(
        endpoint_path="/workflows/landing-page-recommendation/trigger",
        workflow_input=workflow_input,
        callback_url=callback_url,
        node_update_url=node_update_url,
        workflow_name="Landing page workflow",
    )


async def trigger_partial_autopop_workflow(
    workflow_input: PartialAutopopInput,
    callback_url: str,
    node_update_url: Optional[str] = None,
) -> Dict[str, Any]:
    """Trigger Partial Autopop Workflow."""
    client = get_orchestration_client()
    return await client._trigger_workflow(
        endpoint_path="/workflows/partial-autopop/trigger",
        workflow_input=workflow_input,
        callback_url=callback_url,
        node_update_url=node_update_url,
        workflow_name="Partial Autopop workflow",
    )


async def trigger_direct_section_workflow(
    workflow_input: PresetSectionsInput,
    callback_url: str,
    node_update_url: Optional[str] = None,
) -> Dict[str, Any]:
    """Trigger Direct Section Workflow."""
    client = get_orchestration_client()
    return await client._trigger_workflow(
        endpoint_path="/workflows/direct-section/trigger",
        workflow_input=workflow_input,
        callback_url=callback_url,
        node_update_url=node_update_url,
        workflow_name="Direct Section workflow",
    )


async def trigger_regenerate_section_workflow(
    workflow_input: RegenerateSectionInput,
    callback_url: str,
    node_update_url: Optional[str] = None,
) -> Dict[str, Any]:
    """Trigger Regenerate Section Workflow - AI content regeneration for a single section."""
    client = get_orchestration_client()
    return await client._trigger_workflow(
        endpoint_path="/workflows/regenerate-section/trigger",
        workflow_input=workflow_input,
        callback_url=callback_url,
        node_update_url=node_update_url,
        workflow_name="Regenerate Section workflow",
    )
