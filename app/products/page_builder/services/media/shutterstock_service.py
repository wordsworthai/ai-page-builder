from typing import Optional
import httpx
from app.products.page_builder.config.shutterstock import shutterstock_config
from app.core.exceptions import ExternalServiceException


class ShutterstockService:
    """Service for interacting with Shutterstock API."""

    def __init__(self):
        self.base_url = shutterstock_config.base_url
        self.headers = {
            "Authorization": f"Bearer {shutterstock_config.api_token}",
            "Accept": "application/json"
        }

    async def search_images(
        self,
        query: str,
        page: int = 1,
        per_page: int = 20,
        added_date: Optional[str] = None,
        added_date_end: Optional[str] = None,
        added_date_start: Optional[str] = None,
        aspect_ratio: Optional[float] = None,
        aspect_ratio_max: Optional[float] = None,
        aspect_ratio_min: Optional[float] = None,
        category: Optional[str] = None,
        color: Optional[str] = None,
        contributor: Optional[list[str]] = None,
        contributor_country: Optional[list[str]] = None,
        fields: Optional[str] = None,
        height_from: Optional[int] = None,
        height_to: Optional[int] = None,
        image_type: Optional[list[str]] = None,
        keyword_safe_search: bool = True,
        language: Optional[str] = None,
        library: Optional[list[str]] = None,
        license: Optional[list[str]] = None,
        model: Optional[list[str]] = None,
        orientation: Optional[str] = None,
        people_age: Optional[str] = None,
        people_ethnicity: Optional[list[str]] = None,
        people_gender: Optional[str] = None,
        people_model_released: Optional[bool] = None,
        people_number: Optional[int] = None,
        region: Optional[str] = None,
        safe: bool = True,
        sort: str = "popular",
        spellcheck_query: bool = True,
        view: str = "minimal",
        width_from: Optional[int] = None,
        width_to: Optional[int] = None,
    ) -> dict:
        """
        Search for images on Shutterstock.
        Args:
            query: Search terms (required)
            page: Page number (default: 1)
            per_page: Results per page (default: 20, max: 500)
            added_date: Show images added on specified date (YYYY-MM-DD)
            added_date_end: Show images added before specified date (YYYY-MM-DD)
            added_date_start: Show images added on/after specified date (YYYY-MM-DD)
            aspect_ratio: Show images with specified aspect ratio
            aspect_ratio_max: Show images with aspect ratio or lower
            aspect_ratio_min: Show images with aspect ratio or higher
            category: Shutterstock category name or ID
            color: Hex color ('4F21EA') or 'grayscale'
            contributor: List of contributor names or IDs
            contributor_country: List of country codes (ISO 3166 Alpha-2)
            fields: Fields to display in response
            height_from: Show images with specified height or larger (pixels)
            height_to: Show images with specified height or smaller (pixels)
            image_type: List of image types (photo, illustration, vector)
            keyword_safe_search: Hide results with unsafe keywords (default: True)
            language: Set query and result language
            library: Search within libraries (shutterstock, offset)
            license: Show images with specified license (commercial, editorial, enhanced)
            model: List of model IDs
            orientation: Image orientation (horizontal, vertical)
            people_age: Age category (infants, children, teenagers, 20s, 30s, 40s, 50s, 60s, older)
            people_ethnicity: List of ethnicities or NOT filters
            people_gender: Gender (male, female, both)
            people_model_released: Show images with signed model release
            people_number: Number of people (max: 4)
            region: Country code or IP for relevance ranking
            safe: Enable safe search (default: True)
            sort: Sort order (newest, popular, relevance, random, oldest)
            spellcheck_query: Spellcheck and suggest spellings (default: True)
            view: Detail level (minimal, full)
            width_from: Show images with specified width or larger (pixels)
            width_to: Show images with specified width or smaller (pixels)
        Returns:
            dict: Shutterstock API response with search results
        Raises:
            ExternalServiceException: If API request fails
        """
        params = {
            "query": query,
            "page": page,
            "per_page": per_page,
            "keyword_safe_search": keyword_safe_search,
            "safe": safe,
            "sort": sort,
            "spellcheck_query": spellcheck_query,
            "view": view,
        }
        # Add optional parameters if provided
        if added_date:
            params["added_date"] = added_date
        if added_date_end:
            params["added_date_end"] = added_date_end
        if added_date_start:
            params["added_date_start"] = added_date_start
        if aspect_ratio is not None:
            params["aspect_ratio"] = aspect_ratio
        if aspect_ratio_max is not None:
            params["aspect_ratio_max"] = aspect_ratio_max
        if aspect_ratio_min is not None:
            params["aspect_ratio_min"] = aspect_ratio_min
        if category:
            params["category"] = category
        if color:
            params["color"] = color
        if contributor:
            params["contributor"] = contributor
        if contributor_country:
            params["contributor_country"] = contributor_country
        if fields:
            params["fields"] = fields
        if height_from is not None:
            params["height_from"] = height_from
        if height_to is not None:
            params["height_to"] = height_to
        if image_type:
            params["image_type"] = image_type
        if language:
            params["language"] = language
        if library:
            params["library"] = library
        if license:
            params["license"] = license
        if model:
            params["model"] = model
        if orientation:
            params["orientation"] = orientation
        if people_age:
            params["people_age"] = people_age
        if people_ethnicity:
            params["people_ethnicity"] = people_ethnicity
        if people_gender:
            params["people_gender"] = people_gender
        if people_model_released is not None:
            params["people_model_released"] = people_model_released
        if people_number is not None:
            params["people_number"] = people_number
        if region:
            params["region"] = region
        if width_from is not None:
            params["width_from"] = width_from
        if width_to is not None:
            params["width_to"] = width_to
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/images/search",
                    headers=self.headers,
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            raise ExternalServiceException(
                f"Shutterstock API error: {e.response.status_code} - {e.response.text}"
            )
        except httpx.RequestError as e:
            raise ExternalServiceException(f"Failed to connect to Shutterstock API: {str(e)}")
   
    async def get_image_details(
        self,
        image_id: str,
        language: Optional[str] = None,
        view: str = "full",
        search_id: Optional[str] = None
    ) -> dict:
        """
        Get detailed information about a specific image.
        Args:
            image_id: Shutterstock image ID (required)
            language: Language for keywords and categories
            view: Detail level (minimal, full) - default: full
            search_id: ID of related search
        Returns:
            dict: Image details
        Raises:
            ExternalServiceException: If API request fails
        """
        params = {"view": view}
        if language:
            params["language"] = language
        if search_id:
            params["search_id"] = search_id
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/images/{image_id}",
                    headers=self.headers,
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            raise ExternalServiceException(
                f"Shutterstock API error: {e.response.status_code} - {e.response.text}"
            )
        except httpx.RequestError as e:
            raise ExternalServiceException(f"Failed to connect to Shutterstock API: {str(e)}")


    async def search_videos(
        self,
        query: str,
        page: int = 1,
        per_page: int = 20,
        duration_from: Optional[int] = None,
        duration_to: Optional[int] = None,
        fps: Optional[int] = None,
        resolution: Optional[str] = None,
        codec: Optional[str] = None,
        aspect_ratio: Optional[str] = None,
        safe: bool = True,
        sort: str = "popular",
        view: str = "minimal",
    ) -> dict:
        """
        Search for videos on Shutterstock.
        """
        params = {
            "query": query,
            "page": page,
            "per_page": per_page,
            "safe": safe,
            "sort": sort,
            "view": view,
        }

        if duration_from is not None:
            params["duration_from"] = duration_from
        if duration_to is not None:
            params["duration_to"] = duration_to
        if fps is not None:
            params["fps"] = fps
        if resolution:
            params["resolution"] = resolution
        if codec:
            params["codec"] = codec
        if aspect_ratio:
            params["aspect_ratio"] = aspect_ratio
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/videos/search",
                    headers=self.headers,
                    params=params,
                    timeout=30.0,
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            raise ExternalServiceException(
                f"Shutterstock API error: {e.response.status_code} - {e.response.text}"
            )
        except httpx.RequestError as e:
            raise ExternalServiceException(
                f"Failed to connect to Shutterstock API: {str(e)}"
            )


    async def get_video_details(
        self,
        video_id: str,
        view: str = "full",
        search_id: Optional[str] = None,
    ) -> dict:
        """
        Get detailed information about a specific video.
        """
        params = {"view": view}
        if search_id:
            params["search_id"] = search_id
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/videos/{video_id}",
                    headers=self.headers,
                    params=params,
                    timeout=30.0,
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            raise ExternalServiceException(
                f"Shutterstock API error: {e.response.status_code} - {e.response.text}"
            )
        except httpx.RequestError as e:
            raise ExternalServiceException(
                f"Failed to connect to Shutterstock API: {str(e)}"
            )


def get_shutterstock_service() -> ShutterstockService:
    """Dependency to get ShutterstockService instance."""
    return ShutterstockService()