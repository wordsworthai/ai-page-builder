from pydantic import BaseModel


class CategoryResponse(BaseModel):
    """Response model for section categories"""
    key: str
    name: str
    description: str
