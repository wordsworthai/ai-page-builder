"""
Contact support Pydantic schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class ContactSupportCreate(BaseModel):
    """
    Schema for contact support form submission.
    """
    name: str = Field(..., description="User's name", min_length=1, max_length=200)
    email: EmailStr = Field(..., description="User's email address")
    category: Optional[str] = Field(
        None,
        description="Category of inquiry",
        examples=["Technical Support", "Billing Question", "Feature Request", "Bug Report", "General Inquiry"]
    )
    subject: Optional[str] = Field(None, description="Subject line (optional)", max_length=200)
    message: str = Field(..., description="Message content", min_length=1, max_length=5000)
    screenshot_url: Optional[str] = Field(None, description="S3 URL of uploaded screenshot (if provided)")
    
    # Auto-captured metadata (will be added by controller)
    current_page: Optional[str] = Field(None, description="Current page path")
    current_url: Optional[str] = Field(None, description="Full current URL")
    user_agent: Optional[str] = Field(None, description="User agent string")
    device_type: Optional[str] = Field(None, description="Device type (mobile/desktop/tablet)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "John Doe",
                "email": "john@example.com",
                "category": "Technical Support",
                "subject": "Issue with dashboard",
                "message": "I'm experiencing an issue with the dashboard not loading properly.",
                "current_page": "/dashboard",
                "current_url": "https://app.example.com/dashboard",
                "user_agent": "Mozilla/5.0...",
                "device_type": "desktop"
            }
        }


class ContactSupportResponse(BaseModel):
    """Response after successful contact support submission"""
    message: str = "Contact form submitted successfully"
    submission_id: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Contact form submitted successfully",
                "submission_id": "507f1f77bcf86cd799439011"
            }
        }


class SupportTicket(BaseModel):
    """Schema for a single support ticket"""
    ticket_id: str = Field(..., description="Ticket ID")
    subject: Optional[str] = Field(None, description="Ticket subject")
    category: Optional[str] = Field(None, description="Ticket category")
    message: str = Field(..., description="Ticket message")
    status: str = Field(..., description="Ticket status")
    created_at: datetime = Field(..., description="Creation timestamp")
    screenshot_url: Optional[str] = Field(None, description="Screenshot URL if available")
    
    class Config:
        json_schema_extra = {
            "example": {
                "ticket_id": "507f1f77bcf86cd799439011",
                "subject": "Issue with dashboard",
                "category": "Technical Support",
                "message": "I'm experiencing an issue...",
                "status": "new",
                "created_at": "2024-01-15T10:30:00",
                "screenshot_url": "https://s3.amazonaws.com/..."
            }
        }


class SupportTicketsListResponse(BaseModel):
    """Response containing list of support tickets"""
    tickets: list[SupportTicket] = Field(..., description="List of support tickets")
    total_count: int = Field(..., description="Total number of tickets")
    average_response_time: str = Field(..., description="Average response time")
    
    class Config:
        json_schema_extra = {
            "example": {
                "tickets": [],
                "total_count": 5,
                "average_response_time": "2 hours"
            }
        }
