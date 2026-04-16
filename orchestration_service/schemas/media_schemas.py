from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from enum import Enum

class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"

class MediaSlotIdentityRequest(BaseModel):
    element_id: str
    block_type: str
    block_index: int
    section_id: str

class MediaSlotRequest(BaseModel):
    identity: MediaSlotIdentityRequest
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    aspect_ratio: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None

class MediaMatchRequest(BaseModel):
    business_id: str
    slots: List[MediaSlotRequest]
    media_type: MediaType = MediaType.IMAGE

class MediaMatchResponse(BaseModel):
    matches: List[Dict[str, Any]]

class BusinessImagesRequest(BaseModel):
    business_id: str
    yelp_url: Optional[str] = None
    google_places_data: Optional[Dict[str, Any]] = None

class BusinessImagesResponse(BaseModel):
    logos: List[Dict[str, Any]]
    review_photos: List[Dict[str, Any]]
    business_photos: List[Dict[str, Any]]
