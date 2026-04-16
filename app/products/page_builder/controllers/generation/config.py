"""GET /configs, GET /count."""
import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.db import get_async_db_session
from app.core.db_mongo import get_mongo_database
from app.shared.schemas.auth.auth import CurrentUserResponse
from app.products.page_builder.schemas.generation.generation import (
    GenerationConfigItem,
    GenerationConfigItemConfig,
    GenerationConfigListResponse,
)
from app.shared.utils.user_helpers import get_business_id_from_user
from app.products.page_builder.utils.generation.workflow_input_utils import get_config_from_workflow_input
from app.shared.services.auth.users_service import get_current_user
from app.products.page_builder.models import GenerationVersion


router = APIRouter()
logger = logging.getLogger(__name__)

# Scopes where we only show generations when completed (partial updates).
# Pending/processing/failed partial updates are excluded; full generations stay visible regardless.
PARTIAL_UPDATE_SCOPES = frozenset({
    "regenerate-color-theme",
    "regenerate-content",
    "section_regeneration",
    "autopop_only",
})


@router.get("/configs", response_model=GenerationConfigListResponse)
async def list_generation_configs(
    page_id: Optional[uuid.UUID] = Query(
        None, description="Filter configs by page ID"
    ),
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """List generation configs from MongoDB workflow_input for the current user's business. Optionally filter by page_id.
    Only includes partial update generations (color theme, content, section regen) when completed.
    Full generations (create-site, use-section-ids) stay visible regardless of status."""
    try:
        business_id = await get_business_id_from_user(current_user, db)
        mongo_db = await get_mongo_database("template_generation")
        coll = mongo_db["workflow_input"]
        cursor = coll.find({"business_id": str(business_id)}).sort(
            "created_at", -1
        )
        docs = await cursor.to_list(length=None)

        # Batch-query GenerationVersion for status, generation_scope, entity_id
        all_gvids = [
            doc.get("generation_version_id")
            for doc in docs
            if doc.get("generation_version_id")
        ]
        gvid_info: dict[str, tuple[str, str, uuid.UUID]] = {}
        if all_gvids:
            try:
                gvid_uuids = [uuid.UUID(gvid) for gvid in all_gvids]
            except (ValueError, TypeError):
                gvid_uuids = []
            if gvid_uuids:
                result = await db.execute(
                    select(
                        GenerationVersion.generation_version_id,
                        GenerationVersion.status,
                        GenerationVersion.generation_scope,
                        GenerationVersion.entity_id,
                    ).where(
                        GenerationVersion.generation_version_id.in_(gvid_uuids)
                    )
                )
                for row in result.all():
                    gvid_info[str(row.generation_version_id)] = (
                        row.status,
                        row.generation_scope or "",
                        row.entity_id,
                    )

        configs: list[GenerationConfigItem] = []
        for doc in docs:
            gvid = doc.get("generation_version_id")
            if not gvid:
                continue
            info = gvid_info.get(gvid)
            if info is None:
                continue  # Exclude: no PostgreSQL record
            status_val, generation_scope_val, entity_id_val = info
            if (
                generation_scope_val in PARTIAL_UPDATE_SCOPES
                and status_val != "completed"
            ):
                continue  # Exclude: only show partial when completed
            doc_page_id = doc.get("page_id") or (
                str(entity_id_val) if entity_id_val else None
            )
            if page_id is not None and doc_page_id != str(page_id):
                continue
            cfg = get_config_from_workflow_input(doc)
            configs.append(
                GenerationConfigItem(
                    generation_version_id=str(gvid),
                    config=GenerationConfigItemConfig(
                        intent=cfg.get("intent"),
                        tone=cfg.get("tone"),
                        color_palette_id=cfg.get("color_palette_id"),
                    ),
                    created_at=doc.get("created_at"),
                    page_id=doc_page_id,
                )
            )
        return GenerationConfigListResponse(configs=configs)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Failed to list generation configs: {str(e)}", exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to list generation configs",
        )


@router.get("/count")
async def get_generation_count(
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Get the count of generations for the current user's business."""
    try:
        business_id = await get_business_id_from_user(current_user, db)
        mongo_db = await get_mongo_database("template_generation")

        count = await mongo_db["workflow_input"].count_documents(
            {"business_id": str(business_id)}
        )

        return {
            "count": count,
            "business_id": str(business_id),
        }

    except Exception as e:
        logger.error(
            f"Failed to get generation count: {str(e)}", exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get generation count: {str(e)}",
        )
