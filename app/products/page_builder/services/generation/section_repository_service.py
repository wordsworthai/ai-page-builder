"""
Section Repository Service Wrapper

Wraps the agent orchestration SectionRepositoryService to provide
category and section fetching for the page-builder API.
"""

import logging
from typing import List, Optional

from wwai_agent_orchestration.data.repositories.section_repository import (
    SectionRepositoryService,
    DocumentNotFoundError,
)

from app.products.page_builder.schemas.publishing.category import CategoryResponse
from app.products.page_builder.schemas.publishing.section import SectionMetadataResponse

logger = logging.getLogger(__name__)


class SectionRepositoryServiceWrapper:
    """
    Wrapper service for SectionRepositoryService from agent orchestration.
    
    Provides methods to fetch categories and sections with proper error handling
    and data transformation for the page-builder API.
    """
    
    def __init__(self):
        self._service = SectionRepositoryService()
    
    async def get_categories(self) -> List[CategoryResponse]:
        """
        Get all unique L0 categories from the section repository.
        
        Returns:
            List of CategoryResponse objects with key, name, and description
        
        On error, returns empty list and logs the error.
        """
        try:
            # Use SMB filter: status ACTIVE and tag smb
            query_filter = {
                "status": "ACTIVE",
                "tag": "smb"
            }
            categories = self._service.get_unique_l0_categories(query_filter=query_filter)
            
            # Convert to CategoryResponse format
            result = []
            for cat in categories:
                result.append(CategoryResponse(
                    key=cat.get("l0_key", ""),
                    name=cat.get("name", ""),  # This is section_l0
                    description=""  # No description needed
                ))
            
            logger.info(
                f"Successfully fetched {len(result)} categories from section repository"
            )
            return result
            
        except DocumentNotFoundError:
            logger.warning("No categories found in section repository")
            return []
        except Exception as e:
            logger.error(
                f"Error fetching categories from section repository: {str(e)}",
                exc_info=True
            )
            return []
    
    async def get_sections(
        self,
        category_key: Optional[str] = None
    ) -> List[SectionMetadataResponse]:
        """
        Get sections from the section repository, optionally filtered by category.
        
        Args:
            category_key: Optional L0 category key to filter sections. If None, returns all sections.
        
        Returns:
            List of SectionMetadataResponse objects
        
        On error, returns empty list and logs the error.
        """
        try:
            # Use SMB filter: status ACTIVE and tag smb
            query_filter = {
                "status": "ACTIVE",
                "tag": "smb"
            }
            
            if category_key:
                # Filter by L0 category
                # First, get all categories to find the matching original L0 value
                categories = self._service.get_unique_l0_categories(query_filter=query_filter)
                matching_l0 = None
                
                for cat in categories:
                    if cat.get("l0_key") == category_key:
                        matching_l0 = cat.get("original_l0")
                        break
                
                if not matching_l0:
                    # Fallback: try converting category_key to title case with spaces
                    matching_l0 = category_key.replace("_", " ").title()
                    logger.warning(
                        f"Category key '{category_key}' not found in categories, using fallback: '{matching_l0}'"
                    )
                
                sections = self._service.get_sections_by_l0(matching_l0, query_filter=query_filter)
            else:
                # Get all sections (use fetch_sections_with_metadata)
                sections = self._service.fetch_sections_with_metadata(query_filter=query_filter)
            
            # Convert to SectionMetadataResponse format
            result = []
            for section in sections:
                # Get section_id (could be _id as ObjectId or section_id as string)
                section_id = str(section.get("section_id") or section.get("_id", ""))
                
                # Get section_l0 and section_l1
                section_l0 = section.get("section_l0", "")
                section_l1 = section.get("section_l1", "")
                
                # Build display_name from L0 and L1 (e.g., "Banner - Hero Banner")
                if section_l1:
                    display_name = f"{section_l0} - {section_l1}"
                else:
                    display_name = section_l0 or section_id
                
                # Get category_key (from section_l0, normalized)
                category_key_value = (
                    section_l0.lower().replace(" ", "_") if section_l0 else ""
                )
                
                # Get desktop_image_url
                preview_image_url = section.get("desktop_image_url")
                
                result.append(SectionMetadataResponse(
                    section_id=section_id,
                    display_name=display_name,
                    category_key=category_key_value,
                    preview_image_url=preview_image_url,
                    description=None  # No description
                ))
            
            logger.info(
                f"Successfully fetched {len(result)} sections from section repository"
                + (f" for category: {category_key}" if category_key else "")
            )
            return result
            
        except DocumentNotFoundError:
            logger.warning(
                f"No sections found in section repository"
                + (f" for category: {category_key}" if category_key else "")
            )
            return []
        except Exception as e:
            logger.error(
                f"Error fetching sections from section repository: {str(e)}",
                exc_info=True
            )
            return []


# Singleton instance
_section_repository_service: Optional[SectionRepositoryServiceWrapper] = None


def get_section_repository_service() -> SectionRepositoryServiceWrapper:
    """
    Get the singleton SectionRepositoryServiceWrapper instance.
    
    Returns:
        SectionRepositoryServiceWrapper instance
    """
    global _section_repository_service
    if _section_repository_service is None:
        _section_repository_service = SectionRepositoryServiceWrapper()
    return _section_repository_service
