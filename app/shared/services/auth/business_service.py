"""
Service for managing business creation and relationships.
Handles business, business_user, credits, and service_profile creation.
"""
import logging
import uuid
from typing import Optional, Dict, Any

from sqlalchemy import insert, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.models import Business, BusinessUser, BusinessCredits, ServiceBusinessProfile, BusinessType, BusinessRole
from app.shared.config.credits import get_signup_credits
from app.shared.services.payments.credit_service import CreditService

logger = logging.getLogger(__name__)


class BusinessService:
    """Service for business-related operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_business_with_owner(
        self,
        user_id: uuid.UUID,
        business_data: Optional[Dict[str, Any]] = None
    ) -> Business:
        """
        Create a business with owner relationship and initial credits.
        
        Args:
            user_id: UUID of the user who will be the owner
            business_data: Optional dict with:
                - business_name: Optional[str]
                - business_type: Optional[str] (individual/services/ecommerce)
                - business_subtype: Optional[str]
                - google_maps_url: Optional[str]
                - yelp_url: Optional[str]
        
        Returns:
            Created Business object
        
        Raises:
            Exception: If business creation fails
        """
        business_data = business_data or {}
        
        # Extract business name - use provided name or default
        business_name = business_data.get("business_name")
        if not business_name:
            # Default business name if not provided
            business_name = "My Business"
        
        # Extract business type - convert string to enum if provided
        business_type = None
        if business_data.get("business_type"):
            try:
                business_type = BusinessType(business_data["business_type"])
            except ValueError:
                logger.warning(f"Invalid business_type: {business_data['business_type']}, using None")
        
        # Create Business record
        business_stmt = (
            insert(Business)
            .values(
                business_name=business_name,
                business_type=business_type,
                business_subtype=business_data.get("business_subtype"),
            )
            .returning(Business)
        )
        
        business_result = await self.db.execute(business_stmt)
        business = business_result.scalar_one()
        await self.db.flush()  # Flush to get business_id
        
        # Create BusinessUser relationship (owner)
        business_user_stmt = (
            insert(BusinessUser)
            .values(
                business_id=business.business_id,
                user_id=user_id,
                role=BusinessRole.OWNER
            )
        )
        await self.db.execute(business_user_stmt)
        
        # Create BusinessCredits with zero balance; CreditService.grant_signup_credits adds early bonus and creates transaction
        credits_stmt = (
            insert(BusinessCredits)
            .values(
                business_id=business.business_id,
                credits_balance=0,
                plan_type="FREE"
            )
        )
        await self.db.execute(credits_stmt)
        
        # Create ServiceBusinessProfile if URL metadata is provided
        # Note: intent/tone/color_palette_id are now stored per-generation in MongoDB
        has_metadata = any([
            business_data.get("google_maps_url"),
            business_data.get("yelp_url"),
        ])
        
        if has_metadata:
            service_profile_stmt = (
                insert(ServiceBusinessProfile)
                .values(
                    business_id=business.business_id,
                    google_maps_url=business_data.get("google_maps_url"),
                    yelp_url=business_data.get("yelp_url"),
                )
            )
            await self.db.execute(service_profile_stmt)
        
        # Flush to ensure all records are created
        await self.db.flush()
        # Grant early bonus via CreditService so a CreditTransaction is created (shows in Recent Credit Activity)
        credit_service = CreditService(self.db)
        await credit_service.grant_signup_credits(business.business_id)
        # Note: Don't refresh here - business object already has all needed data
        signup_credits = get_signup_credits()
        logger.info(f"Created business {business.business_id} with owner {user_id} and {signup_credits} credits")
        
        return business
    
    async def update_business_data(
        self,
        business_id: uuid.UUID,
        business_data: Dict[str, Any]
    ) -> Business:
        """
        Update an existing business and its service profile.
        
        Uses partial update logic - only provided fields are updated,
        null/empty values preserve existing data.
        
        Args:
            business_id: UUID of the business to update
            business_data: Dict with optional fields:
                - business_name: Optional[str]
                - business_type: Optional[str] (individual/services/ecommerce)
                - business_subtype: Optional[str]
                - google_maps_url: Optional[str]
                - yelp_url: Optional[str]
                - intent: Optional[str]
                - tone: Optional[str]
                - color_palette_id: Optional[str]
        
        Returns:
            Updated Business object
        
        Raises:
            Exception: If business update fails
        """
        # Fetch existing business
        business_stmt = select(Business).where(Business.business_id == business_id)
        business_result = await self.db.execute(business_stmt)
        business = business_result.scalar_one_or_none()
        
        if not business:
            raise ValueError(f"Business with id {business_id} not found")
        
        # Prepare update dict for Business table (only non-null values)
        business_updates = {}
        if business_data.get("business_name"):
            business_updates["business_name"] = business_data["business_name"]
        if business_data.get("business_type"):
            try:
                business_updates["business_type"] = BusinessType(business_data["business_type"])
            except ValueError:
                logger.warning(f"Invalid business_type: {business_data['business_type']}, skipping")
        if business_data.get("business_subtype") is not None:
            business_updates["business_subtype"] = business_data["business_subtype"]
        
        # Update Business record if there are updates
        if business_updates:
            update_stmt = (
                update(Business)
                .where(Business.business_id == business_id)
                .values(**business_updates)
            )
            await self.db.execute(update_stmt)
            await self.db.flush()
            # Refresh to get updated values
            await self.db.refresh(business)
        
        # Handle ServiceBusinessProfile update or creation
        # Note: intent/tone/color_palette_id are now stored per-generation in MongoDB
        has_metadata = any([
            business_data.get("google_maps_url"),
            business_data.get("yelp_url"),
        ])
        
        if has_metadata:
            # Check if profile exists
            profile_stmt = select(ServiceBusinessProfile).where(
                ServiceBusinessProfile.business_id == business_id
            )
            profile_result = await self.db.execute(profile_stmt)
            existing_profile = profile_result.scalar_one_or_none()
            
            if existing_profile:
                # Update existing profile (partial update - only provided fields)
                profile_updates = {}
                if business_data.get("google_maps_url") is not None:
                    profile_updates["google_maps_url"] = business_data["google_maps_url"]
                if business_data.get("yelp_url") is not None:
                    profile_updates["yelp_url"] = business_data["yelp_url"]
                
                if profile_updates:
                    update_profile_stmt = (
                        update(ServiceBusinessProfile)
                        .where(ServiceBusinessProfile.business_id == business_id)
                        .values(**profile_updates)
                    )
                    await self.db.execute(update_profile_stmt)
            else:
                # Create new profile
                profile_stmt = (
                    insert(ServiceBusinessProfile)
                    .values(
                        business_id=business_id,
                        google_maps_url=business_data.get("google_maps_url"),
                        yelp_url=business_data.get("yelp_url"),
                    )
                )
                await self.db.execute(profile_stmt)
            
            await self.db.flush()
        
        logger.info(f"Updated business {business_id}")
        return business
    
    async def get_business_ids_for_user(self, user_id: uuid.UUID) -> list[uuid.UUID]:
        """
        Get all business IDs where user is OWNER.
        
        Args:
            user_id: UUID of the user
            
        Returns:
            List of business IDs
        """
        owner_businesses_stmt = select(BusinessUser.business_id).where(
            BusinessUser.user_id == user_id,
            BusinessUser.role == BusinessRole.OWNER
        )
        result = await self.db.execute(owner_businesses_stmt)
        return [row[0] for row in result.all()]

