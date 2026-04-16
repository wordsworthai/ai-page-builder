"""
Form submission Pydantic schemas for request/response validation.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class FormSubmissionCreate(BaseModel):
    """
    Schema for incoming form submission from published website.
    All fields are dynamic except domain and page_path.
    """
    domain: str = Field(..., description="Website domain (e.g., mysite.example.com)")
    page_path: str = Field(..., description="Page path (e.g., /contact)")
    form_type: Optional[str] = Field(None, description="Form type if specified in HTML")
    # All other fields are captured in the data field
    data: Dict[str, Any] = Field(..., description="Dynamic form field data")
    
    class Config:
        json_schema_extra = {
            "example": {
                "domain": "mysite.example.com",
                "page_path": "/contact",
                "form_type": "lead_capture",
                "data": {
                    "first_name": "John",
                    "last_name": "Doe",
                    "email": "john@example.com",
                    "phone_number": "1234567890",
                    "message": "I'm interested in your services"
                }
            }
        }


class FormSubmissionResponse(BaseModel):
    """Response after successful form submission"""
    message: str = "Form submitted successfully"
    submission_id: Optional[str] = None


class FormSubmissionRead(BaseModel):
    """
    Schema for reading form submissions from database.
    Used in dashboard display.
    """
    submission_id: str
    form_id: str
    business_id: str
    domain: str
    page_path: str
    form_type: Optional[str] = None
    submitted_at: datetime
    data: Dict[str, Any]
    
    class Config:
        populate_by_name = True
        
    @classmethod
    def from_mongo(cls, doc: Dict[str, Any]) -> "FormSubmissionRead":
        """Create from MongoDB document, converting _id to submission_id"""
        doc_copy = doc.copy()
        doc_copy["submission_id"] = str(doc_copy.pop("_id"))
        return cls(**doc_copy)


class FormGroupRead(BaseModel):
    """
    Represents a group of submissions for a single form type.
    Used for tab display in dashboard.
    """
    form_id: str
    form_type: Optional[str] = None
    form_label: str  # "Form 1", "Form 2", etc.
    field_names: List[str]  # Column headers
    submission_count: int
    submissions: List[FormSubmissionRead]


class FormSubmissionsListResponse(BaseModel):
    """
    Response containing all form groups for a business.
    """
    business_id: str
    total_submissions: int
    forms: List[FormGroupRead]