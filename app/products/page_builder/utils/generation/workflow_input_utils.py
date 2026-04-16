"""
Utilities for building and validating workflow_input MongoDB documents.
Centralizes logic for initial_input creation from source + overrides.
"""
import logging
import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.config.credits import WorkflowTriggerType
from app.products.page_builder.controllers.generation.helpers import (
    persist_workflow_input,
    require_workflow_input,
)
from app.products.page_builder.models import GenerationVersion

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Prepared state
# ---------------------------------------------------------------------------


@dataclass
class PreparedWorkflowState:
    """State returned after preparing workflow execution from source."""

    new_generation_version: GenerationVersion
    workflow_input_doc: dict


@dataclass
class PreparedCreateSiteState:
    """State returned after preparing workflow for create-site (no source)."""

    generation_version_id: uuid.UUID
    workflow_input_doc: dict


# ---------------------------------------------------------------------------
# Pydantic models for validation
# ---------------------------------------------------------------------------


class InitialInput(BaseModel):
    """Validated initial_input for workflow_input. No extra fields allowed."""

    # Compulsory - must be explicitly passed (trigger passes "na" for source_generation_version_id)
    website_intention: str = Field(default="generate_leads")
    website_tone: str = Field(default="professional")
    source_generation_version_id: str  # No default; trigger passes "na" when no source
    color_palette_id: str
    palette_id: str
    palette: Dict[str, Any]
    font_family: str
    business_name: str

    # Optional
    google_places_data: Optional[Dict[str, Any]] = None
    yelp_url: Optional[str] = None
    query: Optional[str] = None

    model_config = {"extra": "forbid"}


class TriggeredBy(BaseModel):
    """Minimal structure for triggered_by. Validates required fields."""

    user_id: uuid.UUID
    email: str
    source: str
    source_generation_version_id: Optional[str] = None

    model_config = {"extra": "forbid"}


# ---------------------------------------------------------------------------
# Builders
# ---------------------------------------------------------------------------


def build_initial_input(
    source_workflow_doc: Optional[Dict[str, Any]] = None,
    overrides: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Build initial_input from source workflow doc and optional overrides.
    Overrides take precedence. Applies defaults for website_intention, website_tone.
    Normalizes compulsory str/dict fields (None -> "" or {}).
    Returns validated dict suitable for workflow_input.initial_input.
    """
    base: Dict[str, Any] = {}
    if source_workflow_doc:
        base = dict(source_workflow_doc.get("initial_input") or {})

    merged = {**base}
    if overrides:
        for k, v in overrides.items():
            merged[k] = v

    # Apply defaults for listing/config use
    if not merged.get("website_intention"):
        merged["website_intention"] = "generate_leads"
    if not merged.get("website_tone"):
        merged["website_tone"] = "professional"

    # Normalize compulsory fields (source may have None)
    for field, default in (
        ("color_palette_id", ""),
        ("palette_id", ""),
        ("font_family", ""),
        ("business_name", ""),
    ):
        if merged.get(field) is None:
            merged[field] = default
    if merged.get("palette") is None or not isinstance(merged.get("palette"), dict):
        merged["palette"] = {}

    validated = InitialInput.model_validate(merged)
    return validated.model_dump(exclude_none=True, by_alias=False)


def build_workflow_input_doc(
    generation_version_id: uuid.UUID,
    business_id: uuid.UUID,
    page_id: uuid.UUID,
    workflow_name: str,
    initial_input: Dict[str, Any],
    triggered_by: Dict[str, Any],
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Build a complete workflow_input document for MongoDB.
    Validates initial_input and triggered_by.
    """
    validated_initial = InitialInput.model_validate(initial_input)
    validated_triggered_by = TriggeredBy.model_validate(triggered_by)

    return {
        "generation_version_id": str(generation_version_id),
        "business_id": str(business_id),
        "page_id": str(page_id),
        "workflow_name": workflow_name,
        "input_version": 1,
        "initial_input": validated_initial.model_dump(exclude_none=True, by_alias=False),
        "created_at": datetime.now(UTC).replace(tzinfo=None),
        "triggered_by": validated_triggered_by.model_dump(
            exclude_none=True, by_alias=False, mode="json"
        ),
        "metadata": metadata or {},
    }


def get_config_from_workflow_input(
    workflow_doc: Optional[Dict[str, Any]],
) -> Dict[str, Optional[str]]:
    """Extract intent, tone, color_palette_id from workflow_input.initial_input."""
    if not workflow_doc:
        return {}
    initial = workflow_doc.get("initial_input") or {}
    return {
        "intent": initial.get("website_intention"),
        "tone": initial.get("website_tone"),
        "color_palette_id": initial.get("color_palette_id"),
    }


def require_autopop_initial_input(
    workflow_doc: Optional[Dict[str, Any]],
    required: tuple[str, ...] = ("website_intention", "website_tone"),
) -> Dict[str, Any]:
    """
    Extract initial_input from workflow doc and assert required fields exist.
    Raises ValueError if any required field is missing.
    """
    if not workflow_doc:
        raise ValueError("Source workflow document is required")
    initial = workflow_doc.get("initial_input") or {}
    missing = [f for f in required if not initial.get(f)]
    if missing:
        raise ValueError(f"Source workflow missing required initial_input fields: {missing}")
    return initial


async def get_source_workflow_input(
    mongo_db: Any,
    generation_version_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Fetch workflow_input document for the given generation_version_id."""
    try:
        doc = await mongo_db["workflow_input"].find_one(
            {"generation_version_id": str(generation_version_id)}
        )
        return doc
    except Exception as e:
        logger.warning(f"Could not fetch source workflow_input: {e}")
    return None


def validate_overrides_for_trigger(
    trigger_type: WorkflowTriggerType,
    overrides: dict,
    source_workflow_doc: Optional[Dict[str, Any]] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Validate overrides and metadata for the given trigger type.
    Raises ValueError if overrides or metadata are invalid.
    """
    if trigger_type in (
        WorkflowTriggerType.REGENERATE_COLOR_THEME,
        WorkflowTriggerType.REGENERATE_CONTENT,
        WorkflowTriggerType.USE_SECTION_IDS,
        WorkflowTriggerType.SECTION_REGENERATION,
    ):
        if not overrides.get("source_generation_version_id"):
            raise ValueError("source_generation_version_id is required")

    if trigger_type == WorkflowTriggerType.SECTION_REGENERATION:
        meta = metadata or {}
        if "section_id" not in meta:
            raise ValueError("section_id is required in metadata for section regeneration")
        if "section_index" not in meta:
            raise ValueError("section_index is required in metadata for section regeneration")

    if trigger_type == WorkflowTriggerType.REGENERATE_COLOR_THEME:
        for key in ("color_palette_id", "palette_id", "palette", "font_family"):
            if key not in overrides:
                raise ValueError(f"{key} is required for regenerate-color-theme")


async def prepare_workflow_from_source(
    trigger_type: WorkflowTriggerType,
    mongo_db: Any,
    db: AsyncSession,
    source_generation_version_id: uuid.UUID,
    page_id: uuid.UUID,
    new_generation_version: GenerationVersion,
    business_id: uuid.UUID,
    current_user: Any,
    overrides: dict,
    metadata: Optional[Dict[str, Any]] = None,
) -> PreparedWorkflowState:
    """
    Fetch source workflow, validate overrides, build and persist workflow_input.
    Caller must create the new GenerationVersion (provisioning) before calling.
    Returns prepared state for execution.
    """
    # 1. Fetch source workflow
    if trigger_type in (
        WorkflowTriggerType.REGENERATE_COLOR_THEME,
        WorkflowTriggerType.REGENERATE_CONTENT,
    ):
        try:
            source_workflow_doc = await require_workflow_input(
                source_generation_version_id, mongo_db
            )
        except HTTPException:
            raise
        except Exception as mongo_error:
            logger.warning(
                f"Could not verify workflow_input for source {source_generation_version_id}: {mongo_error}",
                exc_info=True,
            )
            source_workflow_doc = None
        if not source_workflow_doc:
            raise HTTPException(
                status_code=409,
                detail="Source workflow input not found.",
            )
    else:
        source_workflow_doc = await get_source_workflow_input(
            mongo_db, source_generation_version_id
        )
        if not source_workflow_doc:
            raise HTTPException(
                status_code=404,
                detail="Workflow input not found for this generation.",
            )

    # 2. Resolve palette/font for regenerate-content or use-section-ids
    palette = None
    font_family = None
    source_initial = source_workflow_doc.get("initial_input") or {}
    if trigger_type == WorkflowTriggerType.REGENERATE_CONTENT:
        palette = source_initial.get("palette")
        font_family = source_initial.get("font_family")
        if not palette or not font_family:
            raise HTTPException(
                status_code=409,
                detail="Source generation missing palette or font_family. Cannot regenerate content.",
            )
    elif trigger_type == WorkflowTriggerType.USE_SECTION_IDS:
        palette = source_initial.get("palette")
        font_family = source_initial.get("font_family")
        overrides = dict(overrides)
        if palette and not source_initial.get("palette"):
            overrides["palette"] = palette or {}
        if font_family and not source_initial.get("font_family"):
            overrides["font_family"] = font_family or ""

    # 3. Validate overrides and metadata
    validate_overrides_for_trigger(
        trigger_type, overrides, source_workflow_doc, metadata=metadata
    )

    # 4. Build initial_input
    initial_input = build_initial_input(
        source_workflow_doc=source_workflow_doc,
        overrides=overrides,
    )

    # 5. Build workflow_input_doc (caller provides new_generation_version)
    workflow_input_doc = build_workflow_input_doc(
        generation_version_id=new_generation_version.generation_version_id,
        business_id=business_id,
        page_id=page_id,
        workflow_name=trigger_type.value,
        initial_input=initial_input,
        triggered_by={
            "user_id": current_user.user_id,
            "email": current_user.email,
            "source": trigger_type.value,
            "source_generation_version_id": str(source_generation_version_id),
        },
        metadata=metadata,
    )

    # 7. Persist
    await persist_workflow_input(
        mongo_db,
        workflow_input_doc,
        str(new_generation_version.generation_version_id),
    )

    return PreparedWorkflowState(
        new_generation_version=new_generation_version,
        workflow_input_doc=workflow_input_doc,
    )


async def prepare_workflow_for_create_site(
    mongo_db: Any,
    generation_version_id: uuid.UUID,
    page_id: uuid.UUID,
    business_id: uuid.UUID,
    current_user: Any,
    overrides: Dict[str, Any],
) -> PreparedCreateSiteState:
    """
    Prepare workflow for create-site (no source).
    Builds initial_input from overrides, creates workflow_input doc, persists.
    """
    merged = dict(overrides)
    merged.setdefault("source_generation_version_id", "na")
    initial_input = build_initial_input(overrides=merged)
    workflow_input_doc = build_workflow_input_doc(
        generation_version_id=generation_version_id,
        business_id=business_id,
        page_id=page_id,
        workflow_name="landing_page_recommendation",
        initial_input=initial_input,
        triggered_by={
            "user_id": current_user.user_id,
            "email": current_user.email,
            "source": WorkflowTriggerType.CREATE_SITE.value,
        },
    )
    await persist_workflow_input(
        mongo_db, workflow_input_doc, str(generation_version_id)
    )
    return PreparedCreateSiteState(
        generation_version_id=generation_version_id,
        workflow_input_doc=workflow_input_doc,
    )
