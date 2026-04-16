"""
Generic HTTP client for the AI Orchestration Service.
Handles authentication (Google ID Token for Cloud Run) and HTTP transport.
Page-builder-specific workflow trigger functions live in:
  app.products.page_builder.services.generation.workflows
"""
import json
import logging
import os
import httpx
from typing import Optional, Dict, Any, Union
from threading import Lock
from google.auth.transport.requests import Request
from google.oauth2 import id_token

from app.core.config import config
from app.shared.utils.dataclass_serialization import dataclass_to_dict

from wwai_agent_orchestration.contracts.landing_page_builder.workflow_inputs import (
    LandingPageInput,
    PartialAutopopInput,
    PresetSectionsInput,
    RegenerateSectionInput,
)

logger = logging.getLogger(__name__)


def _prepare_workflow_dict(
    workflow_input: Union[LandingPageInput, PartialAutopopInput, PresetSectionsInput, RegenerateSectionInput],
    workflow_name: str = "workflow"
) -> Dict[str, Any]:
    """
    Convert workflow input to dict and verify JSON serializability.
    
    Args:
        workflow_input: The workflow input dataclass
        workflow_name: Name of the workflow for error messages
    
    Returns:
        Dictionary representation of the workflow input
    
    Raises:
        Exception: If conversion fails or dict is not JSON serializable
    """
    # Convert workflow input to dict for JSON serialization (recursively handles nested dataclasses)
    try:
        workflow_dict = dataclass_to_dict(workflow_input)
    except Exception as e:
        logger.error(f"Failed to convert {workflow_name} input to dict: {e}", exc_info=True)
        raise
    
    # Verify the dict is JSON serializable before sending
    try:
        json.dumps(workflow_dict)
    except TypeError as e:
        logger.error(f"Workflow dict contains non-serializable objects: {e}")
        raise
    
    return workflow_dict


class OrchestrationClient:
    """
    HTTP Client for interacting with the AI Orchestration Service.
    Handles authentication via Google ID Token when running in Cloud Run.
    """
    _instance = None
    _lock = Lock()
    
    def __init__(self):
        self.base_url = os.environ.get("ORCHESTRATION_SERVICE_URL", "http://localhost:8081")
        self.client = httpx.AsyncClient(timeout=60.0) # Long timeout for AI tasks
        self._id_token = None
        
    @classmethod
    def get_instance(cls):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = cls()
        return cls._instance

    async def _get_headers(self) -> Dict[str, str]:
        """Get headers with ID token authentication if in production/UAT"""
        headers = {
            "Content-Type": "application/json"
        }
        
        # In local dev (localhost), no auth needed usually
        # In deployed envs (Cloud Run), we need ID token
        if "localhost" not in self.base_url and "127.0.0.1" not in self.base_url:
            token = self._get_id_token()
            if token:
                headers["Authorization"] = f"Bearer {token}"
                
        return headers

    def _get_id_token(self) -> Optional[str]:
        """Fetch Google ID Token for service-to-service auth"""
        try:
            # Only attempts if we are in environment that supports it
            if config.is_development(): 
                return None
            
            auth_req = Request()
            target_audience = self.base_url
            return id_token.fetch_id_token(auth_req, target_audience)
        except Exception as e:
            logger.warning(f"Could not fetch ID token: {e}")
            return None

    async def _trigger_workflow(
        self,
        endpoint_path: str,
        workflow_input: Union[LandingPageInput, PartialAutopopInput, PresetSectionsInput, RegenerateSectionInput],
        callback_url: str,
        node_update_url: Optional[str] = None,
        workflow_name: str = "workflow"
    ) -> Dict[str, Any]:
        """
        Common handler for triggering workflows.
        
        Args:
            endpoint_path: The API endpoint path (e.g., "/workflows/landing-page-recommendation/trigger")
            workflow_input: The workflow input dataclass
            callback_url: URL to POST completion/error callbacks
            node_update_url: Optional URL to POST node update events
            workflow_name: Name of the workflow for error messages
        
        Returns:
            Response JSON as dictionary
        """
        url = f"{self.base_url}{endpoint_path}"
        headers = await self._get_headers()
        
        # Add webhook URLs as query parameters
        params = {
            "callback_url": callback_url,
        }
        if node_update_url:
            params["node_update_url"] = node_update_url

        # Convert workflow input to dict and verify JSON serializability
        workflow_dict = _prepare_workflow_dict(workflow_input, workflow_name)
        
        try:
            response = await self.client.post(
                url,
                json=workflow_dict,
                params=params,
                headers=headers
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Failed to trigger {workflow_name}: {e}")
            raise

    async def trigger_landing_page_workflow(
        self, 
        workflow_input: LandingPageInput,
        callback_url: str,
        node_update_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Trigger Landing Page Recommendation Workflow"""
        return await self._trigger_workflow(
            endpoint_path="/workflows/landing-page-recommendation/trigger",
            workflow_input=workflow_input,
            callback_url=callback_url,
            node_update_url=node_update_url,
            workflow_name="Landing page workflow"
        )

    async def trigger_partial_autopop_workflow(
        self,
        workflow_input: PartialAutopopInput,
        callback_url: str,
        node_update_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Trigger Partial Autopop Workflow - orchestration service uses factory pattern internally"""
        return await self._trigger_workflow(
            endpoint_path="/workflows/partial-autopop/trigger",
            workflow_input=workflow_input,
            callback_url=callback_url,
            node_update_url=node_update_url,
            workflow_name="Partial Autopop workflow"
        )

    async def trigger_direct_section_workflow(
        self,
        workflow_input: PresetSectionsInput,
        callback_url: str,
        node_update_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Trigger Direct Section Workflow - uses section_ids from execution_config"""
        return await self._trigger_workflow(
            endpoint_path="/workflows/direct-section/trigger",
            workflow_input=workflow_input,
            callback_url=callback_url,
            node_update_url=node_update_url,
            workflow_name="Direct Section workflow"
        )

    async def trigger_regenerate_section_workflow(
        self,
        workflow_input: RegenerateSectionInput,
        callback_url: str,
        node_update_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Trigger Regenerate Section Workflow - AI content regeneration for a single section"""
        return await self._trigger_workflow(
            endpoint_path="/workflows/regenerate-section/trigger",
            workflow_input=workflow_input,
            callback_url=callback_url,
            node_update_url=node_update_url,
            workflow_name="Regenerate Section workflow"
        )

    async def health_check(self) -> bool:
        """Check if orchestration service is healthy"""
        url = f"{self.base_url}/health"
        try:
            response = await self.client.get(url)
            return response.status_code == 200
        except Exception:
            return False

def get_orchestration_client() -> OrchestrationClient:
    return OrchestrationClient.get_instance()
