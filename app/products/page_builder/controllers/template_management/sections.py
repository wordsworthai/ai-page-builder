"""Section template endpoints - compile single or batch sections with ipsum_lorem."""
import logging
from typing import Optional

from fastapi import APIRouter, Query, HTTPException

from app.products.page_builder.schemas.publishing.section import BatchSectionTemplateRequest
from app.products.page_builder.schemas.generation.template_build_output import TemplateBuildOutput

from wwai_agent_orchestration.utils.landing_page_builder.template_utils import (
    compile_section_with_ipsum_lorem,
    compile_batch_section_templates_with_ipsum_lorem,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/{section_id}/template", response_model=TemplateBuildOutput)
async def get_section_template(
    section_id: str,
    template_json_type: Optional[str] = Query(
        "ipsum_lorem",
        description="Type of template JSON (section templates support ipsum_lorem only)",
    ),
):
    """
    Get compiled template JSON for a single section.

    Compiles a single section using ipsum_lorem (no autopopulation).

    Args:
        section_id: The section ID to compile
        template_json_type: Ignored - section templates use ipsum_lorem only

    Returns:
        TemplateBuildOutput (model_dump) - template JSON for editor
    """
    try:
        tbo = await compile_section_with_ipsum_lorem(section_id=section_id)
        return TemplateBuildOutput.model_validate(tbo.model_dump())
    except Exception as e:
        logger.error(f"Failed to compile section {section_id}: {e}", exc_info=True)
        raise HTTPException(500, f"Failed to compile section: {str(e)}")


@router.post("/compile-batch", response_model=TemplateBuildOutput)
async def get_batch_section_templates(request: BatchSectionTemplateRequest):
    """
    Get compiled template JSON for multiple sections.

    Compiles multiple sections in one call using ipsum_lorem.

    Args:
        request: BatchSectionTemplateRequest containing section_ids list

    Returns:
        TemplateBuildOutput (model_dump) - template JSON for editor
    """
    if not request.section_ids:
        tbo = await compile_batch_section_templates_with_ipsum_lorem(section_ids=[])
        return TemplateBuildOutput.model_validate(tbo.model_dump())

    try:
        tbo = await compile_batch_section_templates_with_ipsum_lorem(
            section_ids=request.section_ids
        )
        return TemplateBuildOutput.model_validate(tbo.model_dump())
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to compile batch sections: {e}", exc_info=True)
        raise HTTPException(500, f"Failed to compile batch sections: {str(e)}")
