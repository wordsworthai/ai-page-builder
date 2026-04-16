"""
Form submissions controller - API endpoints for form submission handling.
"""
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.products.page_builder.schemas.publishing.form_submission import (
    FormSubmissionCreate,
    FormSubmissionResponse,
    FormSubmissionsListResponse
)
from app.products.page_builder.services.publishing.form_submission_service import (
    FormSubmissionService,
    get_form_submission_service
)
from app.shared.services.auth.users_service import get_current_user
from app.shared.schemas.auth.auth import CurrentUserResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/forms", tags=["submitted forms"])


@router.post(
    "/form-submissions",
    response_model=FormSubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["forms"]
)
async def submit_form(
    submission: FormSubmissionCreate,
    service: FormSubmissionService = Depends(get_form_submission_service)
):
    """
    **PUBLIC ENDPOINT** - No authentication required.
    
    Submit a form from a published website.
    
    - Validates domain exists in websites table
    - Generates form_id from field structure
    - Stores submission in MongoDB
    """
    try:
        submission_id = await service.submit_form(submission)
        return FormSubmissionResponse(
            message="Form submitted successfully",
            submission_id=submission_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Form submission error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit form"
        )


@router.get(
    "/form-submissions",
    response_model=FormSubmissionsListResponse,
    tags=["forms"]
)
async def get_form_submissions(
    current_user: CurrentUserResponse = Depends(get_current_user),
    service: FormSubmissionService = Depends(get_form_submission_service)
):
    """
    **AUTHENTICATED ENDPOINT** - Requires user login.
    
    Get all form submissions for the current user's business.
    Returns submissions grouped by form_id for tab display.
    
    - Uses business_id from current_user
    - Retrieves all submissions for that business
    - Groups by form_id
    """
    try:
        # Check if user has a business
        if not current_user.business_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No business found for current user"
            )
        
        # Fetch submissions using business_id from CurrentUserResponse
        submissions = await service.get_submissions_by_business(
            UUID(current_user.business_id)
        )
        
        return submissions
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching form submissions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve form submissions"
        )


@router.post(
    "/form-submissions/create-indexes",
    tags=["forms", "admin"]
)
async def create_form_indexes(
    service: FormSubmissionService = Depends(get_form_submission_service),
    current_user: CurrentUserResponse = Depends(get_current_user)
):
    """
    **ADMIN ENDPOINT** - Create MongoDB indexes for form submissions.
    
    Should be called once during initial setup or migration.
    Can be called by any authenticated user (consider restricting to superuser).
    """
    try:
        await service.create_indexes()
        return {"message": "Indexes created successfully"}
    except Exception as e:
        logger.error(f"Error creating indexes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create indexes"
        )