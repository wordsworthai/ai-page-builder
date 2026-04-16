"""
Plan Upgrade Controller - Simplified for Credit-based System

Handles:
- FREE → BASIC upgrade
- Credit pack purchases (BASIC+ only)
"""

from typing import Dict, Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.shared.services.payments.upgrade_service import UpgradeService, get_upgrade_service
from app.shared.services.auth.users_service import get_current_user
from app.shared.schemas.auth.auth import CurrentUserResponse

# Create router
upgrades_router = APIRouter(prefix="/api/upgrades", tags=["upgrades"])


# Request/Response schemas
class UpgradeRequest(BaseModel):
    target_plan: str = "basic"


class CreditPackRequest(BaseModel):
    pack_id: str = "credits-100"


@upgrades_router.get("/options")
async def get_upgrade_options(
    current_user: CurrentUserResponse = Depends(get_current_user),
    upgrade_service: UpgradeService = Depends(get_upgrade_service),
) -> Dict[str, Any]:
    """
    Get available upgrade options for the current user.
    
    Returns:
    - For FREE users: BASIC subscription option
    - For BASIC+ users: Credit pack purchase options
    """
    return await upgrade_service.get_upgrade_options()


@upgrades_router.post("/checkout")
async def create_upgrade_checkout(
    request: UpgradeRequest = UpgradeRequest(),
    current_user: CurrentUserResponse = Depends(get_current_user),
    upgrade_service: UpgradeService = Depends(get_upgrade_service),
) -> Dict[str, Any]:
    """
    Create checkout session for upgrading to BASIC plan.
    
    Only available for FREE users. BASIC+ users should use /credits/purchase instead.
    """
    return await upgrade_service.create_upgrade_checkout(request.target_plan)


@upgrades_router.post("/credits")
async def purchase_credit_pack(
    request: CreditPackRequest = CreditPackRequest(),
    current_user: CurrentUserResponse = Depends(get_current_user),
    upgrade_service: UpgradeService = Depends(get_upgrade_service),
) -> Dict[str, Any]:
    """
    Purchase a credit pack.
    
    Only available for BASIC+ subscribers. FREE users should upgrade first.
    """
    return await upgrade_service.create_credit_pack_checkout(request.pack_id)
