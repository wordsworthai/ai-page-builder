"""
Contact support controller - API endpoints for contact support form submissions.
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, status, UploadFile
from pydantic import EmailStr

from app.shared.schemas.auth.auth import CurrentUserResponse
from app.shared.schemas.support.contact_support import ContactSupportCreate, ContactSupportResponse, SupportTicketsListResponse
from app.shared.services.support.contact_support_service import (
    ContactSupportService,
    get_contact_support_service
)
from app.shared.services.auth.users_service import get_current_user_optional, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contact-support", tags=["contact support"])


@router.post(
    "/submit",
    response_model=ContactSupportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit contact support form",
    description="""
    **PUBLIC ENDPOINT** - No authentication required.
    
    Submit a contact support form with optional screenshot upload.
    
    - Captures user details (name, email)
    - Optional category and subject
    - Required message
    - Optional screenshot (uploaded to S3)
    - Auto-captures metadata (page, user agent, device type, etc.)
    - Stores submission in MongoDB (contact_us.customer_support_form)
    """
)
async def submit_contact_support(
    request: Request,
    name: str = Form(..., description="User's name"),
    email: EmailStr = Form(..., description="User's email address"),
    category: Optional[str] = Form(None, description="Category of inquiry"),
    subject: Optional[str] = Form(None, description="Subject line (optional)"),
    message: str = Form(..., description="Message content"),
    current_page: Optional[str] = Form(None, description="Current page path"),
    current_url: Optional[str] = Form(None, description="Full current URL"),
    user_agent: Optional[str] = Form(None, description="User agent string"),
    device_type: Optional[str] = Form(None, description="Device type"),
    screenshot: Optional[UploadFile] = File(None, description="Optional screenshot image"),
    current_user: Optional[CurrentUserResponse] = Depends(get_current_user_optional),
    service: ContactSupportService = Depends(get_contact_support_service),
):
    """
    Submit contact support form.
    
    Accepts multipart form data with optional file upload.
    """
    try:
        # Extract user agent from request headers if not provided
        if not user_agent:
            user_agent = request.headers.get("user-agent", "")
        
        # Extract current URL from request if not provided
        if not current_url:
            current_url = str(request.url)
        
        # Extract current page from request if not provided
        if not current_page:
            current_page = request.url.path
        
        # Build form data object
        form_data = ContactSupportCreate(
            name=name,
            email=email,
            category=category,
            subject=subject,
            message=message,
            screenshot_url=None,  # Will be set after S3 upload if screenshot provided
            current_page=current_page,
            current_url=current_url,
            user_agent=user_agent,
            device_type=device_type,
        )
        
        # Submit form (service will handle S3 upload if screenshot provided)
        response = await service.submit_contact_form(
            form_data=form_data,
            screenshot_file=screenshot
        )
        
        logger.info(f"Contact support form submitted successfully: {response.submission_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting contact support form: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit contact form: {str(e)}"
        )


@router.get(
    "/my-tickets",
    response_model=SupportTicketsListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user's support tickets",
    description="""
    **AUTHENTICATED ENDPOINT** - Requires authentication.
    
    Get all support tickets submitted by the current user.
    
    Returns:
    - List of all tickets submitted by the user
    - Total count of tickets
    - Average response time
    """
)
async def get_my_tickets(
    current_user: CurrentUserResponse = Depends(get_current_user),
    service: ContactSupportService = Depends(get_contact_support_service),
):
    """
    Get all support tickets for the current user.
    """
    try:
        return await service.get_user_tickets(current_user.email)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user tickets: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch support tickets: {str(e)}"
        )
