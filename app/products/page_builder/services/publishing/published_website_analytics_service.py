"""
Analytics Service
==================
Business logic for website analytics endpoints.
Handles website ownership validation, date range processing,
and orchestrates BigQuery queries.
"""
import uuid
from datetime import date, timedelta
from typing import Dict, Any, Optional

from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.db import get_async_db_session
from app.shared.models import BusinessUser
from app.products.page_builder.models import Website
from app.shared.schemas.auth.auth import CurrentUserResponse
from app.shared.services.auth.users_service import get_current_user_optional
from app.products.page_builder.services.publishing.bigquery_client import BigQueryClient


class AnalyticsService:
    """
    Service for website analytics operations.
    
    Handles:
    - Website ownership validation
    - Date range calculation
    - BigQuery query orchestration
    - Response formatting
    """
    
    def __init__(
        self,
        db: AsyncSession,
        current_user: Optional[CurrentUserResponse],
    ):
        """Initialize analytics service."""
        self.db = db
        self.current_user = current_user
        self.bq_client = BigQueryClient()
    
    async def _get_website_with_validation(self, website_id: uuid.UUID) -> Website:
        """
        Get website and validate ownership.
        
        Args:
            website_id: Website UUID
        
        Returns:
            Website object
        
        Raises:
            HTTPException: If not authenticated, not found, or no permission
        """
        if not self.current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # 1. Get website
        website = await self.db.get(Website, website_id)
        if not website:
            raise HTTPException(status_code=404, detail="Website not found")
        
        # 2. Get Business ID (Handle missing field on User object)
        business_id = self.current_user.business_id
        
        if not business_id:
            # Fallback: Look up in business_users table
            # This is required because 'business_id' is not a column on the User table
            result = await self.db.execute(
                select(BusinessUser.business_id)
                .where(BusinessUser.user_id == self.current_user.user_id)
                .limit(1)
            )
            found_id = result.scalar_one_or_none()
            
            if found_id:
                business_id = found_id
            else:
                raise HTTPException(
                    status_code=403,
                    detail="User does not have a business account"
                )
        
        # 3. Validate ownership
        # Convert both to strings to ensure safe comparison
        if str(website.business_id) != str(business_id):
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to access this website's analytics"
            )
        
        return website
    
    def _calculate_date_range(
        self,
        start_date: Optional[date],
        end_date: Optional[date],
        default_days: int = 30
    ) -> tuple[date, date]:
        """
        Calculate date range for analytics queries.
        
        Args:
            start_date: Optional start date
            end_date: Optional end date
            default_days: Default range in days if not specified
        
        Returns:
            Tuple of (start_date, end_date)
        """
        today = date.today()
        
        if end_date is None:
            end_date = today
        
        if start_date is None:
            start_date = end_date - timedelta(days=default_days - 1)
        
        # Validate dates
        if start_date > end_date:
            raise HTTPException(
                status_code=400,
                detail="start_date must be before or equal to end_date"
            )
        
        if end_date > today:
            end_date = today
        
        return start_date, end_date
    
    async def get_website_overview(
        self,
        website_id: uuid.UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Get overview analytics for a website.
        """
        # Validate ownership
        website = await self._get_website_with_validation(website_id)
        
        # Calculate date range
        start_date, end_date = self._calculate_date_range(start_date, end_date, 30)
        
        # Check if data exists
        has_data = self.bq_client.check_data_exists(
            website.subdomain,
            start_date,
            end_date
        )
        
        if not has_data:
            return {
                'website_id': str(website_id),
                'subdomain': website.subdomain,
                'date_range': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat(),
                    'days': (end_date - start_date).days + 1
                },
                'total_pageviews': 0,
                'total_unique_visitors': 0,
                'trend': [],
                'top_pages': [],
                'message': 'No analytics data available for this period'
            }
        
        # Get overview data
        overview = self.bq_client.get_website_overview(
            website.subdomain,
            start_date,
            end_date
        )
        
        # Get top pages
        top_pages = self.bq_client.get_top_pages(
            website.subdomain,
            start_date,
            end_date,
            limit=10
        )
        
        return {
            'website_id': str(website_id),
            'subdomain': website.subdomain,
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'days': (end_date - start_date).days + 1
            },
            'total_pageviews': overview['total_pageviews'],
            'total_unique_visitors': overview['total_unique_visitors'],
            'trend': overview['trend'],
            'top_pages': top_pages
        }
    
    async def get_pages_breakdown(
        self,
        website_id: uuid.UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        Get page-level analytics breakdown.
        """
        website = await self._get_website_with_validation(website_id)
        start_date, end_date = self._calculate_date_range(start_date, end_date, 30)
        
        pages = self.bq_client.get_top_pages(
            website.subdomain,
            start_date,
            end_date,
            limit=limit
        )
        
        return {
            'website_id': str(website_id),
            'subdomain': website.subdomain,
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'days': (end_date - start_date).days + 1
            },
            'pages': pages,
            'total_pages': len(pages)
        }
    
    async def get_traffic_sources(
        self,
        website_id: uuid.UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Get traffic sources (referrers) breakdown.
        """
        website = await self._get_website_with_validation(website_id)
        start_date, end_date = self._calculate_date_range(start_date, end_date, 30)
        
        sources_dict = self.bq_client.get_traffic_sources(
            website.subdomain,
            start_date,
            end_date
        )
        
        sources_list = [
            {'source': source, 'pageviews': count}
            for source, count in sources_dict.items()
        ]
        sources_list.sort(key=lambda x: x['pageviews'], reverse=True)
        
        return {
            'website_id': str(website_id),
            'subdomain': website.subdomain,
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'days': (end_date - start_date).days + 1
            },
            'sources': sources_list,
            'total_sources': len(sources_list)
        }
    
    async def get_countries(
        self,
        website_id: uuid.UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Get geographic (country) breakdown.
        """
        website = await self._get_website_with_validation(website_id)
        start_date, end_date = self._calculate_date_range(start_date, end_date, 30)
        
        countries_dict = self.bq_client.get_country_breakdown(
            website.subdomain,
            start_date,
            end_date
        )
        
        countries_list = [
            {'country_code': country, 'pageviews': count}
            for country, count in countries_dict.items()
        ]
        countries_list.sort(key=lambda x: x['pageviews'], reverse=True)
        
        return {
            'website_id': str(website_id),
            'subdomain': website.subdomain,
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'days': (end_date - start_date).days + 1
            },
            'countries': countries_list,
            'total_countries': len(countries_list)
        }
    
    async def get_devices(
        self,
        website_id: uuid.UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Get device breakdown.
        """
        website = await self._get_website_with_validation(website_id)
        start_date, end_date = self._calculate_date_range(start_date, end_date, 30)
        
        devices_dict = self.bq_client.get_device_breakdown(
            website.subdomain,
            start_date,
            end_date
        )
        
        devices_list = [
            {'device_type': device, 'pageviews': count}
            for device, count in devices_dict.items()
        ]
        devices_list.sort(key=lambda x: x['pageviews'], reverse=True)
        
        return {
            'website_id': str(website_id),
            'subdomain': website.subdomain,
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'days': (end_date - start_date).days + 1
            },
            'devices': devices_list,
            'total_device_types': len(devices_list)
        }


def get_analytics_service(
    db_session: AsyncSession = Depends(get_async_db_session),
    current_user: Optional[CurrentUserResponse] = Depends(get_current_user_optional),
) -> AnalyticsService:
    """Dependency injection for analytics service."""
    return AnalyticsService(db_session, current_user)