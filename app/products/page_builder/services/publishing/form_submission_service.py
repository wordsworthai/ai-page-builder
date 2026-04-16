"""
Form submission service - Business logic for handling form submissions.
"""
import hashlib
import json
import logging
from datetime import datetime, UTC
from typing import Dict, Any, List, Optional
from uuid import UUID

from motor.motor_asyncio import AsyncIOMotorCollection
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from fastapi import Depends
from app.core.db_mongo import get_mongo_collection
from app.core.db import get_async_db_session
from app.products.page_builder.models import Website
from app.products.page_builder.schemas.publishing.form_submission import (
    FormSubmissionCreate,
    FormSubmissionRead,
    FormGroupRead,
    FormSubmissionsListResponse
)

logger = logging.getLogger(__name__)


class FormSubmissionService:
    """Service for handling form submissions and retrieval"""
    
    COLLECTION_NAME = "form_submissions"
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    @staticmethod
    def _generate_form_id(data: Dict[str, Any], form_type: Optional[str] = None) -> str:
        """
        Generate a deterministic form ID based on field structure.
        
        Args:
            data: Form field data
            form_type: Optional form type
            
        Returns:
            MD5 hash of sorted field names
        """
        # Extract field names and sort them
        field_names = sorted(data.keys())
        
        # Include form_type in the hash if present
        if form_type:
            field_names.append(f"__form_type:{form_type}")
        
        # Create deterministic hash
        fields_str = json.dumps(field_names, sort_keys=True)
        form_id = hashlib.md5(fields_str.encode()).hexdigest()
        
        return form_id
    
    async def _get_business_id_from_domain(self, domain: str) -> Optional[str]:
        """
        Look up business_id from subdomain in PostgreSQL websites table.
        
        Args:
            domain: Full domain (e.g., mysite.example.com)
            
        Returns:
            business_id as string or None if not found
        """
        # Extract subdomain from domain
        # domain format: subdomain.example.com or subdomain.try.example.com
        subdomain = domain.split('.')[0]
        
        # Query websites table
        stmt = select(Website).where(Website.subdomain == subdomain)
        result = await self.db.execute(stmt)
        website = result.scalar_one_or_none()
        
        if not website:
            logger.warning(f"No website found for subdomain: {subdomain}")
            return None
        
        return str(website.business_id)
    
    async def _get_collection(self) -> AsyncIOMotorCollection:
        """Get MongoDB collection for form submissions"""
        return await get_mongo_collection(self.COLLECTION_NAME)
    
    async def create_indexes(self):
        """
        Create MongoDB indexes for efficient querying.
        Should be called once during app startup or migration.
        """
        collection = await self._get_collection()
        
        # Composite index for querying by business + form
        await collection.create_index([
            ("business_id", 1),
            ("form_id", 1),
            ("submitted_at", -1)
        ])
        
        # Index for domain lookups
        await collection.create_index([("domain", 1)])
        
        # Index for time-based queries
        await collection.create_index([("submitted_at", -1)])
        
        logger.info("Form submission indexes created successfully")
    
    async def submit_form(self, submission: FormSubmissionCreate) -> str:
        """
        Process and store a form submission.
        
        Args:
            submission: Form submission data
            
        Returns:
            submission_id: MongoDB ObjectId as string
            
        Raises:
            ValueError: If website/business not found
        """
        # Look up business_id from domain
        business_id = await self._get_business_id_from_domain(submission.domain)
        if not business_id:
            raise ValueError(f"No website found for domain: {submission.domain}")
        
        # Generate form_id from field structure
        form_id = self._generate_form_id(submission.data, submission.form_type)
        
        # Prepare document for MongoDB
        document = {
            "form_id": form_id,
            "business_id": business_id,
            "domain": submission.domain,
            "page_path": submission.page_path,
            "form_type": submission.form_type,
            "submitted_at": datetime.now(UTC).replace(tzinfo=None),
            "data": submission.data
        }
        
        # Insert into MongoDB
        collection = await self._get_collection()
        result = await collection.insert_one(document)
        
        logger.info(f"Form submission saved: {result.inserted_id} for business {business_id}")
        
        return str(result.inserted_id)
    
    async def get_submissions_by_business(
        self, 
        business_id: UUID
    ) -> FormSubmissionsListResponse:
        """
        Retrieve all form submissions for a business, grouped by form_id.
        
        Args:
            business_id: Business UUID
            
        Returns:
            FormSubmissionsListResponse with grouped submissions
        """
        collection = await self._get_collection()
        business_id_str = str(business_id)
        
        # Fetch all submissions for this business
        cursor = collection.find(
            {"business_id": business_id_str}
        ).sort("submitted_at", -1)
        
        submissions = await cursor.to_list(length=None)
        
        if not submissions:
            return FormSubmissionsListResponse(
                business_id=business_id_str,
                total_submissions=0,
                forms=[]
            )
        
        # Group submissions by form_id
        forms_dict: Dict[str, List[Dict]] = {}
        for sub in submissions:
            form_id = sub["form_id"]
            if form_id not in forms_dict:
                forms_dict[form_id] = []
            forms_dict[form_id].append(sub)
        
        # Build form groups
        form_groups = []
        for idx, (form_id, subs) in enumerate(forms_dict.items(), start=1):
            # Extract all unique field names across submissions
            all_fields = set()
            for sub in subs:
                all_fields.update(sub["data"].keys())
            
            field_names = sorted(all_fields)
            
            # Convert to Pydantic models
            submissions_read = [
                FormSubmissionRead.from_mongo(sub)
                for sub in subs
            ]
            
            # Determine form label
            form_type = subs[0].get("form_type")
            form_label = form_type if form_type else f"Form {idx}"
            
            form_group = FormGroupRead(
                form_id=form_id,
                form_type=form_type,
                form_label=form_label,
                field_names=field_names,
                submission_count=len(subs),
                submissions=submissions_read
            )
            form_groups.append(form_group)
        
        return FormSubmissionsListResponse(
            business_id=business_id_str,
            total_submissions=len(submissions),
            forms=form_groups
        )


async def get_form_submission_service(
    db: AsyncSession = Depends(get_async_db_session)
) -> FormSubmissionService:
    """Dependency for FastAPI"""
    return FormSubmissionService(db)