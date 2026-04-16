from pydantic import BaseModel
from typing import Optional, Dict, Any, List


class WorkflowTriggerResponse(BaseModel):
    """Response after triggering a workflow"""
    request_id: str
    status: str = "started"
    message: str = "Workflow started successfully"


class NodeUpdatePayload(BaseModel):
    """Payload sent to node_update_url webhook"""
    request_id: str
    node_name: str
    display_name: str
    status: str = "completed"
    output_summary: Optional[str] = None
    output_type: str = "text"
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    duration_ms: Optional[int] = None


class NodeDeliveryAttempt(BaseModel):
    """Per-node delivery attempt (success or failed) with timing."""
    node_name: str
    status: str  # "success" or "failed"
    attempted_at: Optional[str] = None  # ISO datetime when attempt started (for time-series graphs)
    duration_ms: Optional[int] = None
    error_type: Optional[str] = None


class WorkflowCallbackPayload(BaseModel):
    """Payload sent to callback_url on completion/error"""
    request_id: str
    status: str  # "completed" or "failed"
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    tokens_used: Optional[int] = None
    estimated_cost_usd: Optional[float] = None
    # Per-generation node-update delivery metrics (for performance dashboards)
    node_updates_attempted: Optional[int] = None
    node_updates_failed: Optional[int] = None
    node_updates_failed_reasons: Optional[Dict[str, int]] = None
    node_delivery_attempts: Optional[List[NodeDeliveryAttempt]] = None
