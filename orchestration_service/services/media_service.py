import logging
import asyncio

from orchestration_service.schemas.media_schemas import (
    MediaMatchRequest,
    MediaMatchResponse,
    BusinessImagesRequest,
    BusinessImagesResponse,
    MediaType
)

# Import from orchestration package (no MediaType in package - use our schema)
from wwai_agent_orchestration.data.providers.logo_provider import LogoProvider
from wwai_agent_orchestration.data.providers.review_photos_provider import ReviewPhotosProvider
from wwai_agent_orchestration.data.providers.business_photos_provider import BusinessPhotosProvider
from wwai_agent_orchestration.data.providers.models.logo import LogoInput
from wwai_agent_orchestration.data.providers.models.scraped_photos import ReviewPhotosInput, BusinessPhotosInput
from wwai_agent_orchestration.data.services.media.media_service import media_service as internal_media_service
from wwai_agent_orchestration.data.services.models.media import (
    MediaSlot,
    MediaSlotIdentity,
    MediaMatchRequest as InternalMediaMatchRequest,
)

logger = logging.getLogger(__name__)

class MediaService:
    def __init__(self):
        self.logo_provider = LogoProvider()
        self.review_photos_provider = ReviewPhotosProvider()
        self.business_photos_provider = BusinessPhotosProvider()
    
    async def match_media(self, request: MediaMatchRequest) -> MediaMatchResponse:
        """
        Match media items to the requested slots using the orchestration logic.
        Package uses element_id, block_type, block_index, section_id and required width/height.
        """
        internal_slots = []
        for slot in request.slots:
            width = slot.width if slot.width and slot.width > 0 else 800
            height = slot.height if slot.height and slot.height > 0 else 600
            internal_slots.append(
                MediaSlot(
                    width=width,
                    height=height,
                    slot_identity=MediaSlotIdentity(
                        element_id=getattr(slot.identity, "element_id", None),
                        block_type=getattr(slot.identity, "block_type", None),
                        block_index=getattr(slot.identity, "block_index", None),
                        section_id=getattr(slot.identity, "section_id", None),
                    ),
                )
            )
        internal_request = InternalMediaMatchRequest(
            business_id=request.business_id,
            slots=internal_slots,
        )
        loop = asyncio.get_event_loop()
        if request.media_type == MediaType.VIDEO:
            response = await loop.run_in_executor(
                None, lambda: internal_media_service.match_videos(internal_request)
            )
        else:
            response = await loop.run_in_executor(
                None, lambda: internal_media_service.match_images(internal_request)
            )
        results = getattr(response, "results", [])
        serialized_matches = [
            r.model_dump() if hasattr(r, "model_dump") else (r.dict() if hasattr(r, "dict") else r)
            for r in results
        ]
        return MediaMatchResponse(matches=serialized_matches)

    async def get_business_images(self, request: BusinessImagesRequest) -> BusinessImagesResponse:
        """
        Retrieve logos, review photos, and business photos from providers.
        Providers use .get() (sync); run in executor and serialize outputs to list-of-dicts.
        """
        loop = asyncio.get_event_loop()

        def _logos():
            out = self.logo_provider.get(LogoInput(business_id=request.business_id))
            if out and getattr(out, "all_logos", None):
                return [{"url": getattr(l, "url", ""), "source": getattr(l, "source", "")} for l in out.all_logos]
            return []

        def _reviews():
            out = self.review_photos_provider.get(ReviewPhotosInput(business_id=request.business_id))
            if out and getattr(out, "items", None):
                return [{"url": getattr(p, "url", ""), "source": getattr(p, "source", "")} for p in out.items]
            return []

        def _business():
            out = self.business_photos_provider.get(BusinessPhotosInput(business_id=request.business_id))
            if out and getattr(out, "items", None):
                return [{"url": getattr(p, "url", ""), "source": getattr(p, "source", "google_maps")} for p in out.items]
            return []

        logos, review_results, business_results = await asyncio.gather(
            loop.run_in_executor(None, _logos),
            loop.run_in_executor(None, _reviews),
            loop.run_in_executor(None, _business),
            return_exceptions=True,
        )
        final_logos = logos if not isinstance(logos, Exception) else []
        final_reviews = review_results if not isinstance(review_results, Exception) else []
        final_business = business_results if not isinstance(business_results, Exception) else []
        return BusinessImagesResponse(
            logos=final_logos,
            review_photos=final_reviews,
            business_photos=final_business,
        )

media_service = MediaService()
