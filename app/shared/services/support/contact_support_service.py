"""
Contact support service - Business logic for handling contact support form submissions.
"""
import asyncio
import functools
import hashlib
import logging
from datetime import datetime, UTC
from typing import Optional

from botocore.exceptions import ClientError, NoCredentialsError
from fastapi import Depends, HTTPException, Request, UploadFile
from motor.motor_asyncio import AsyncIOMotorCollection

from app.products.page_builder.config.aws import aws_config
from app.core.db_mongo import get_mongo_collection
from app.shared.schemas.auth.auth import CurrentUserResponse
from app.shared.schemas.support.contact_support import ContactSupportCreate, ContactSupportResponse, SupportTicket, SupportTicketsListResponse
from app.shared.services.auth.users_service import get_current_user_optional
from app.products.page_builder.utils.media.upload_utils.upload_to_s3 import get_s3_client, generate_s3_url, generate_presigned_url

logger = logging.getLogger(__name__)


class ContactSupportService:
    """Service for handling contact support form submissions"""
    
    COLLECTION_NAME = "customer_support_form"
    DATABASE_NAME = "contact_us"
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB max file size
    ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    
    def __init__(
        self,
        current_user: Optional[CurrentUserResponse],
        request: Request,
    ):
        self.current_user = current_user
        self.request = request
        
        # Initialize S3 client
        self.s3_client, error = get_s3_client()
        if error:
            logger.warning(f"Failed to initialize S3 client: {error}")
            self.s3_client = None
        else:
            self.bucket_name = aws_config.S3_BUCKET_NAME
    
    async def _run_in_thread(self, func, *args, **kwargs):
        """Run synchronous function in thread pool."""
        loop = asyncio.get_event_loop()
        partial_func = functools.partial(func, *args, **kwargs)
        return await loop.run_in_executor(None, partial_func)
    
    async def _get_collection(self) -> AsyncIOMotorCollection:
        """Get MongoDB collection for contact support submissions"""
        return await get_mongo_collection(self.COLLECTION_NAME, self.DATABASE_NAME)
    
    def _detect_device_type(self, user_agent: Optional[str]) -> str:
        """Detect device type from user agent"""
        if not user_agent:
            return "unknown"
        
        user_agent_lower = user_agent.lower()
        if any(mobile in user_agent_lower for mobile in ["mobile", "android", "iphone", "ipad"]):
            if "tablet" in user_agent_lower or "ipad" in user_agent_lower:
                return "tablet"
            return "mobile"
        return "desktop"
    
    async def upload_screenshot_to_s3(
        self,
        file_bytes: bytes,
        filename: str,
        content_type: str
    ) -> str:
        """
        Upload screenshot file to S3.
        
        Args:
            file_bytes: File content as bytes
            filename: Original filename
            content_type: MIME type of the file
            
        Returns:
            S3 URL of uploaded file
            
        Raises:
            HTTPException: If upload fails or file is invalid
        """
        if not self.s3_client:
            raise HTTPException(
                status_code=500,
                detail="S3 client not available. File upload is disabled."
            )
        
        # Validate file size
        if len(file_bytes) > self.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds maximum allowed size of {self.MAX_FILE_SIZE / (1024 * 1024)}MB"
            )
        
        # Validate file type
        if content_type not in self.ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed types: {', '.join(self.ALLOWED_IMAGE_TYPES)}"
            )
        
        # Generate unique S3 key
        timestamp = datetime.now(UTC).replace(tzinfo=None).strftime("%Y%m%d_%H%M%S")
        file_hash = hashlib.md5(file_bytes).hexdigest()[:8]
        file_ext = filename.split('.')[-1] if '.' in filename else 'jpg'
        s3_key = f"contact-support/{timestamp}_{file_hash}.{file_ext}"
        
        try:
            # Upload to S3
            await self._run_in_thread(
                self.s3_client.put_object,
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_bytes,
                ContentType=content_type,
            )
            
            # Generate and return S3 URL
            s3_url = generate_s3_url(s3_key, bucket_name=self.bucket_name)
            logger.info(f"Screenshot uploaded to S3: {s3_url}")
            return s3_url
            
        except (ClientError, NoCredentialsError) as e:
            logger.error(f"Failed to upload screenshot to S3: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload screenshot: {str(e)}"
            )
    
    async def submit_contact_form(
        self,
        form_data: ContactSupportCreate,
        screenshot_file: Optional[UploadFile] = None
    ) -> ContactSupportResponse:
        """
        Submit contact support form.
        
        Args:
            form_data: Contact support form data
            screenshot_file: Optional screenshot file
            
        Returns:
            ContactSupportResponse with submission_id
        """
        screenshot_url = None
        
        # Upload screenshot if provided
        if screenshot_file and screenshot_file.filename:
            try:
                file_bytes = await screenshot_file.read()
                content_type = screenshot_file.content_type or "image/jpeg"
                screenshot_url = await self.upload_screenshot_to_s3(
                    file_bytes=file_bytes,
                    filename=screenshot_file.filename,
                    content_type=content_type
                )
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Error uploading screenshot: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to process screenshot: {str(e)}"
                )
        
        # Build MongoDB document
        now = datetime.now()
        device_type = self._detect_device_type(form_data.user_agent)
        
        document = {
            "name": form_data.name,
            "email": form_data.email,
            "category": form_data.category,
            "subject": form_data.subject,
            "message": form_data.message,
            "screenshot_url": screenshot_url,
            "user_id": self.current_user.user_id if self.current_user else None,
            "current_page": form_data.current_page,
            "current_url": form_data.current_url,
            "user_agent": form_data.user_agent,
            "device_type": device_type,
            "timestamp": now.isoformat(),
            "created_at": now,
            "status": "new"
        }
        
        # Insert into MongoDB
        try:
            collection = await self._get_collection()
            result = await collection.insert_one(document)
            submission_id = str(result.inserted_id)
            
            logger.info(f"Contact support form submitted: {submission_id} by {form_data.email}")
            
            return ContactSupportResponse(
                message="Contact form submitted successfully",
                submission_id=submission_id
            )
            
        except Exception as e:
            logger.error(f"Error storing contact support submission: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to submit contact form: {str(e)}"
            )
    
    async def get_user_tickets(self, user_email: str) -> SupportTicketsListResponse:
        """
        Get all support tickets for a specific user.
        
        Args:
            user_email: User email to fetch tickets for
            
        Returns:
            SupportTicketsListResponse with list of tickets and stats
        """
        try:
            collection = await self._get_collection()
            
            # Find all tickets for this user by email
            cursor = collection.find({"email": user_email}).sort("created_at", -1)
            tickets_data = await cursor.to_list(length=None)
            
            # Convert to SupportTicket objects
            tickets = []
            for ticket_doc in tickets_data:
                # Generate presigned URL for screenshot if present
                screenshot_url = ticket_doc.get("screenshot_url")
                if screenshot_url and self.s3_client:
                    screenshot_url = generate_presigned_url(
                        screenshot_url,
                        expiration=3600,
                        s3_client=self.s3_client,
                    )

                tickets.append(SupportTicket(
                    ticket_id=str(ticket_doc["_id"]),
                    subject=ticket_doc.get("subject"),
                    category=ticket_doc.get("category"),
                    message=ticket_doc.get("message", ""),
                    status=ticket_doc.get("status", "new"),
                    created_at=ticket_doc.get("created_at", datetime.now()),
                    screenshot_url=screenshot_url
                ))
            
            return SupportTicketsListResponse(
                tickets=tickets,
                total_count=len(tickets),
                average_response_time="2 hours"
            )
            
        except Exception as e:
            logger.error(f"Error fetching user tickets: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch support tickets: {str(e)}"
            )


def get_contact_support_service(
    current_user: Optional[CurrentUserResponse] = Depends(get_current_user_optional),
    request: Request = None,
) -> ContactSupportService:
    """Dependency injection for ContactSupportService"""
    return ContactSupportService(current_user=current_user, request=request)
