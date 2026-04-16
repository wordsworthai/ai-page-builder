from typing import Optional, List

from pydantic import BaseModel


class SectionMetadataResponse(BaseModel):
    """Response model for section metadata matching frontend SectionMetadata interface"""
    section_id: str
    display_name: str
    category_key: str
    preview_image_url: Optional[str] = None
    description: Optional[str] = None


class BatchSectionTemplateRequest(BaseModel):
    """Request model for batch section template compilation"""
    section_ids: List[str]
    template_json_type: Optional[str] = "ipsum_lorem"
