import dataclasses
import logging
import asyncio
import httpx
from datetime import datetime
from typing import Dict, Any, Optional, Union, Literal

from orchestration_service.config import settings
from orchestration_service.schemas.workflow_schemas import (
    WorkflowTriggerResponse,
    NodeUpdatePayload,
    WorkflowCallbackPayload,
    NodeDeliveryAttempt,
)

# Import from the orchestration package
from wwai_agent_orchestration.agent_workflows.landing_page_builder.workflows.workflow_factory import LandingPageWorkflowFactory
from wwai_agent_orchestration.contracts.landing_page_builder.workflow_inputs import (
    LandingPageInput,
    PartialAutopopInput,
    PresetSectionsInput,
    RegenerateSectionInput,
)
from wwai_agent_orchestration.contracts.landing_page_builder.config.main import (
    get_dev_config,
    get_production_config,
)
from wwai_agent_orchestration.core import workflow_background_runner
from wwai_agent_orchestration.core.registry.node_registry import NodeRegistry

logger = logging.getLogger(__name__)

# Per-run node-update delivery metrics (request_id -> {attempted, failed, failed_reasons})
_run_metrics: Dict[str, Dict[str, Any]] = {}
_run_metrics_lock = asyncio.Lock()

# Union type for workflow inputs
WorkflowInput = Union[LandingPageInput, PartialAutopopInput, PresetSectionsInput, RegenerateSectionInput]

# Literal type for workflow types
WorkflowType = Literal["full", "partial_autopop", "preset_sections", "regenerate_section"]

# Set to an int (e.g. 5) to simulate workflow failure after N stream events for retry testing.
# Set to None for normal operation.
SIMULATE_FAIL_AT_EVENT: Optional[int] = None


def _create_workflow_config() -> Dict[str, Any]:
    """
    Create and configure the workflow configuration dictionary.
    
    Args:
        workflow_type: The type of workflow ("full" or "partial_autopop")
        workflow_input: The workflow input (LandingPageInput or PartialAutopopInput)
    
    Returns:
        Configuration dictionary for workflow creation
    """
    # Get base config from environment
    config_obj = get_production_config() if settings.environment == "production" else get_dev_config()
    config_dict = dataclasses.asdict(config_obj) if dataclasses.is_dataclass(config_obj) else (config_obj or {})
    
    # Configure the section repo query filter to only include active sections with the tag "smb"
    config_dict["section_repo_query_filter"] = {"status": "ACTIVE", "tag": "smb"}

    return config_dict


def _create_workflow(
    workflow_type: WorkflowType, 
    workflow_input: WorkflowInput
):
    """
    Create and configure the workflow using factory based on workflow type.
    
    Args:
        workflow_type: The type of workflow ("full" or "partial_autopop")
        workflow_input: The workflow input (LandingPageInput or PartialAutopopInput)
    
    Returns:
        The created workflow instance
    """
    config_dict = _create_workflow_config()
    
    if workflow_type == "partial_autopop":
        regenerate_mode = workflow_input.regenerate_mode
        return LandingPageWorkflowFactory.create(
            "partial_autopop",
            config=config_dict,
            regenerate_mode=regenerate_mode
        )
    elif workflow_type == "preset_sections":
        return LandingPageWorkflowFactory.create(
            "preset_sections",
            config=config_dict
        )
    elif workflow_type == "regenerate_section":
        return LandingPageWorkflowFactory.create(
            "regenerate_section",
            config=config_dict
        )
    else:
        return LandingPageWorkflowFactory.create(
            "full",
            config=config_dict
        )


def _get_workflow_name(workflow_type: WorkflowType) -> str:
    """
    Get the display name for a workflow type.
    
    Args:
        workflow_type: The type of workflow ("full" or "partial_autopop")
    
    Returns:
        Display name for the workflow type
    """
    if workflow_type == "partial_autopop":
        return "Partial autopop workflow"
    if workflow_type == "preset_sections":
        return "Direct Section workflow"
    if workflow_type == "regenerate_section":
        return "Regenerate Section workflow"
    return "Workflow"


def _log_workflow_trigger(
    workflow_type: WorkflowType, 
    request_id: str, 
    workflow_input: WorkflowInput
) -> str:
    """
    Log workflow trigger and return the success message.
    
    Args:
        workflow_type: The type of workflow ("full" or "partial_autopop")
        request_id: The request ID for the workflow
        workflow_input: The workflow input (LandingPageInput or PartialAutopopInput)
    
    Returns:
        Success message for the workflow trigger response
    """
    if workflow_type == "partial_autopop":
        regenerate_mode = workflow_input.regenerate_mode
        logger.info(f"Triggering partial autopop workflow for request_id={request_id}, mode={regenerate_mode}")
        return f"Partial Autopop Workflow ({regenerate_mode}) started successfully"
    if workflow_type == "preset_sections":
        section_count = len(workflow_input.section_ids) if hasattr(workflow_input, "section_ids") else 0
        logger.info(f"Triggering preset sections workflow for request_id={request_id}, sections={section_count}")
        return "Direct Section Workflow started successfully"
    if workflow_type == "regenerate_section":
        section_id = getattr(workflow_input, "section_id", "?")
        logger.info(f"Triggering regenerate section workflow for request_id={request_id}, section_id={section_id}")
        return "Regenerate Section Workflow started successfully"
    logger.info(f"Triggering SMB workflow for request_id={request_id}")
    return "SMB Workflow started successfully"


class LandingPageWorkflowService:
    def __init__(self):
        self.http_client = httpx.AsyncClient(timeout=10.0)

    async def trigger_workflow(
        self,
        workflow_type: WorkflowType,
        workflow_input: WorkflowInput,
        callback_url: str,
        node_update_url: Optional[str] = None,
    ) -> WorkflowTriggerResponse:
        """
        Trigger the workflow in the background. Supports LandingPageInput, PartialAutopopInput, and PresetSectionsInput.

        Args:
            workflow_type: The type of workflow to trigger ("full" or "partial_autopop")
            workflow_input: The workflow input (LandingPageInput or PartialAutopopInput)
            callback_url: URL to POST completion/error callbacks
            node_update_url: Optional URL to POST node update events
        """
        request_id = workflow_input.request_id
        
        # Log workflow trigger and get success message
        message = _log_workflow_trigger(workflow_type, request_id, workflow_input)
        
        # Create workflow dynamically based on workflow type
        workflow = _create_workflow(workflow_type, workflow_input)
        
        async with _run_metrics_lock:
            _run_metrics[request_id] = {
                "attempted": 0,
                "failed": 0,
                "failed_reasons": {},
                "node_delivery_attempts": [],
            }
        
        # Run in background using workflow_input directly
        await workflow_background_runner.run_workflow_in_background(
            workflow=workflow,
            workflow_input=workflow_input,
            on_node_update=lambda node_name, node_data: self._on_node_update(
                workflow_input, node_update_url, node_name, node_data
            ),
            on_complete=lambda final_output: self._on_complete(
                workflow_input, callback_url, final_output
            ),
            on_error=lambda error: self._on_error(
                workflow_type, workflow_input, callback_url, error
            ),
            simulate_fail_at_event=SIMULATE_FAIL_AT_EVENT,
        )
        
        return WorkflowTriggerResponse(
            request_id=request_id,
            status="started",
            message=message
        )
    
    async def _on_node_update(
        self, 
        workflow_input: WorkflowInput, 
        node_update_url: Optional[str],
        node_name: str, 
        node_data: Dict[str, Any]
    ):
        """Handle node update callback (package awaits this)."""
        if not node_update_url:
            return
        await self._send_node_update(workflow_input, node_update_url, node_name, node_data)

    def _extract_ui_entry_from_node_data(
        self, node_name: str, node_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Extract UI display info from node_data. Reads ONLY from ui_execution_log.
        Returns the last matching entry for this node, or None to skip.
        """
        if not node_data:
            return None
        ui_log = node_data.get("ui_execution_log")
        if not isinstance(ui_log, list):
            return None
        matching = [
            e
            for e in ui_log
            if isinstance(e, dict) and e.get("node_name") == node_name
        ]
        if not matching:
            return None
        return matching[-1]

    async def _send_node_update(
        self, 
        workflow_input: WorkflowInput, 
        node_update_url: str,
        node_name: str, 
        node_data: Dict[str, Any]
    ):
        """Send node update to webhook. Reads ONLY from ui_execution_log; skips nodes without it."""
        import time as _time
        start_ts = _time.perf_counter()
        request_id = workflow_input.request_id
        try:
            metadata = NodeRegistry.get_metadata_safe(node_name)
            show_node = metadata.show_node if metadata else True
            if not show_node:
                return
            ui_entry = self._extract_ui_entry_from_node_data(node_name, node_data)
            if ui_entry is None:
                return
            display_name = ui_entry.get("display_name") or (
                metadata.get_display_name() if metadata else NodeRegistry.get_display_name(node_name)
            )
            output_summary = ui_entry.get("output_summary")
            output_type = ui_entry.get("output_type") or "text"
            attempted_at: Optional[str] = datetime.utcnow().isoformat()
            async with _run_metrics_lock:
                m = _run_metrics.get(request_id)
                if m is not None:
                    m["attempted"] = m.get("attempted", 0) + 1
            payload = NodeUpdatePayload(
                request_id=request_id,
                node_name=node_name,
                display_name=display_name,
                status="completed",
                output_summary=output_summary,
                output_type=output_type,
                completed_at=datetime.utcnow().isoformat()
            )
            await self.http_client.post(node_update_url, json=payload.model_dump())
            duration_ms = int(round((_time.perf_counter() - start_ts) * 1000))
            async with _run_metrics_lock:
                m = _run_metrics.get(request_id)
                if m is not None and m.get("node_delivery_attempts") is not None:
                    m["node_delivery_attempts"].append(
                        NodeDeliveryAttempt(
                            node_name=node_name,
                            status="success",
                            attempted_at=attempted_at,
                            duration_ms=duration_ms,
                        )
                    )
        except Exception as e:
            if attempted_at is None:
                attempted_at = datetime.utcnow().isoformat()
            duration_ms = int(round((_time.perf_counter() - start_ts) * 1000))
            error_type = type(e).__name__
            async with _run_metrics_lock:
                m = _run_metrics.get(request_id)
                if m is not None:
                    m["failed"] = m.get("failed", 0) + 1
                    m["failed_reasons"] = m.get("failed_reasons") or {}
                    m["failed_reasons"][error_type] = m["failed_reasons"].get(error_type, 0) + 1
                    if m.get("node_delivery_attempts") is not None:
                        m["node_delivery_attempts"].append(
                            NodeDeliveryAttempt(
                                node_name=node_name,
                                status="failed",
                                attempted_at=attempted_at,
                                duration_ms=duration_ms,
                                error_type=error_type,
                            )
                        )
            err_detail = str(e)
            resp_attr = getattr(e, "response", None)
            if resp_attr is not None:
                try:
                    err_detail = f"{resp_attr.status_code} {(resp_attr.text or '')[:500]}"
                except Exception:
                    pass
            logger.error(
                "Failed to send node update webhook request_id=%s node_update_url=%s error=%s",
                request_id,
                node_update_url,
                err_detail,
                exc_info=True,
            )

    async def _on_complete(
        self, 
        workflow_input: WorkflowInput, 
        callback_url: str,
        final_output: Any
    ):
        """Handle workflow completion (package awaits this)."""
        await self._send_callback(workflow_input, callback_url, "completed", result=final_output)

    async def _on_error(
        self, 
        workflow_type: WorkflowType,
        workflow_input: WorkflowInput, 
        callback_url: str,
        error: Exception
    ):
        """Handle workflow error with full details."""
        import traceback
        request_id = workflow_input.request_id
        error_msg = str(error) or repr(error)
        error_tb = traceback.format_exc()
        
        # Log the FULL error with traceback
        workflow_name = _get_workflow_name(workflow_type)
        logger.error(
            f"{workflow_name} failed for {request_id}: {error_msg}\n{error_tb}",
            exc_info=True
        )
        print(f"[ERROR] {workflow_name} {request_id} failed: {error_msg}", flush=True)
        print(f"[TRACEBACK] {error_tb}", flush=True)
        
        await self._send_callback(workflow_input, callback_url, "failed", error_message=error_msg or "Unknown error")

    async def _send_callback(
        self, 
        workflow_input: WorkflowInput, 
        callback_url: str,
        status: str, 
        result: Any = None, 
        error_message: str = None
    ):
        """Send final callback webhook. Logs response on failure so stuck 'Completing website' can be diagnosed."""
        request_id = workflow_input.request_id
        metrics = None
        async with _run_metrics_lock:
            metrics = _run_metrics.pop(request_id, None)
        try:
            # Main app callback only uses request_id, status, tokens_used, estimated_cost_usd, error_message.
            # Do not send raw result: workflow final state can contain datetime objects that are not JSON-serializable.
            payload_dict = {
                "request_id": request_id,
                "status": status,
                "result": None,
                "error_message": error_message,
            }
            if metrics is not None:
                payload_dict["node_updates_attempted"] = metrics.get("attempted", 0)
                payload_dict["node_updates_failed"] = metrics.get("failed", 0)
                payload_dict["node_updates_failed_reasons"] = metrics.get("failed_reasons") or {}
                payload_dict["node_delivery_attempts"] = metrics.get("node_delivery_attempts") or []
            payload = WorkflowCallbackPayload(**payload_dict)
            resp = await self.http_client.post(callback_url, json=payload.model_dump())
            resp.raise_for_status()
            logger.info("Callback webhook succeeded request_id=%s status=%s", request_id, status)
        except Exception as e:
            # Log response body if available (e.g. 4xx/5xx) so stuck runs can be diagnosed
            err_detail = str(e)
            resp_attr = getattr(e, "response", None)
            if resp_attr is not None:
                try:
                    err_detail = f"{resp_attr.status_code} { (resp_attr.text or '')[:500]}"
                except Exception:
                    pass
            logger.error(
                "Failed to send callback webhook; main app may stay 'processing'. "
                "Check: BACKEND_URL in main app env must be reachable from this service (e.g. use host.docker.internal:8020 if orchestration runs in Docker). "
                "See docs/TROUBLESHOOTING_STUCK_GENERATION.md for full checklist. "
                "request_id=%s callback_url=%s error=%s",
                request_id,
                callback_url,
                err_detail,
            )

landing_page_workflow_service = LandingPageWorkflowService()
