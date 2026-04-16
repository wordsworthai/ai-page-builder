"""
Unit tests for plan upgrade and generation quota updates.
Tests the functionality added for updating generation quotas when user plans change.

SKIPPED: This test file was written for a multi-tier plan system (STARTER, PRO,
PREMIUM, ENTERPRISE) with a `get_generation_quota_for_plan` helper that never
existed in the current codebase.  The live PlanType enum only has FREE, BASIC,
and CUSTOM; there is no quota-per-plan mapping function.  Re-enable this file
once the generation-quota feature is implemented.
"""

import pytest
import uuid
from unittest.mock import AsyncMock, Mock, patch

pytestmark = pytest.mark.skip(
    reason=(
        "get_generation_quota_for_plan does not exist in app.core.permissions. "
        "PlanType only has FREE/BASIC/CUSTOM — STARTER/PRO/PREMIUM/ENTERPRISE "
        "plan tiers have not been implemented yet."
    )
)

# Imports kept for reference; the symbols below do not all exist yet.
# They are imported lazily inside tests (not at module level) to avoid
# collection errors while the whole file is skip-marked.
import uuid  # noqa: F811 (re-import, already imported above)


@pytest.mark.unit
class TestPlanQuotaMapping:
    """Test the plan to quota mapping configuration."""
    
    def test_free_plan_quota(self):
        """Test that FREE plan has quota of 1."""
        quota = get_generation_quota_for_plan(PlanType.FREE)
        assert quota == 1
    
    def test_starter_plan_quota(self):
        """Test that STARTER plan has quota of 3."""
        quota = get_generation_quota_for_plan(PlanType.STARTER)
        assert quota == 3
    
    def test_pro_plan_quota(self):
        """Test that PRO plan has quota of 5."""
        quota = get_generation_quota_for_plan(PlanType.PRO)
        assert quota == 5
    
    def test_premium_plan_quota(self):
        """Test that PREMIUM plan has quota of 10."""
        quota = get_generation_quota_for_plan(PlanType.PREMIUM)
        assert quota == 10
    
    def test_enterprise_plan_quota(self):
        """Test that ENTERPRISE plan has quota of 20."""
        quota = get_generation_quota_for_plan(PlanType.ENTERPRISE)
        assert quota == 20


@pytest.mark.unit
@pytest.mark.asyncio
class TestBusinessServiceQuotaUpdate:
    """Test the BusinessService quota update functionality."""
    
    async def test_update_quotas_no_businesses(self):
        """Test updating quotas when user has no businesses."""
        mock_db = AsyncMock()
        mock_result = Mock()
        mock_result.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)
        
        service = BusinessService(mock_db)
        user_id = uuid.uuid4()
        
        count = await service.update_generation_quotas_for_user(
            user_id=user_id,
            new_limit=3,
            plan_type="starter"
        )
        
        assert count == 0
    
    async def test_update_quotas_single_business(self):
        """Test updating quotas when user has one business."""
        mock_db = AsyncMock()
        business_id = uuid.uuid4()
        
        # Mock the select query for business IDs
        mock_result = Mock()
        mock_result.all.return_value = [(business_id,)]
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.flush = AsyncMock()
        
        service = BusinessService(mock_db)
        user_id = uuid.uuid4()
        
        count = await service.update_generation_quotas_for_user(
            user_id=user_id,
            new_limit=3,
            plan_type="starter"
        )
        
        assert count == 1
        assert mock_db.execute.call_count == 2  # One for select, one for update
        assert mock_db.flush.called
    
    async def test_update_quotas_multiple_businesses(self):
        """Test updating quotas when user has multiple businesses."""
        mock_db = AsyncMock()
        business_ids = [uuid.uuid4(), uuid.uuid4(), uuid.uuid4()]
        
        # Mock the select query for business IDs
        mock_result = Mock()
        mock_result.all.return_value = [(bid,) for bid in business_ids]
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.flush = AsyncMock()
        
        service = BusinessService(mock_db)
        user_id = uuid.uuid4()
        
        count = await service.update_generation_quotas_for_user(
            user_id=user_id,
            new_limit=5,
            plan_type="pro"
        )
        
        assert count == 3
        assert mock_db.execute.call_count == 2
        assert mock_db.flush.called


@pytest.mark.unit
@pytest.mark.asyncio
class TestUpdateUserPlanWithQuota:
    """Test the update_user_plan function that updates both plan and quotas."""
    
    async def test_update_plan_updates_quota(self):
        """Test that updating user plan also updates generation quotas."""
        # Create mock user with starter purchase
        user_id = uuid.uuid4()
        mock_user = Mock(spec=User)
        mock_user.id = user_id
        mock_user.current_plan = PlanType.FREE
        mock_user.subscription = None
        mock_user.purchases = [
            Mock(product_type="starter", is_successful=True)
        ]
        
        # Mock database session
        mock_db = AsyncMock()
        mock_db.add = Mock()
        mock_db.commit = AsyncMock()
        mock_db.flush = AsyncMock()
        
        # Mock the business service execution
        mock_result = Mock()
        mock_result.all.return_value = [(uuid.uuid4(),)]  # One business
        mock_db.execute = AsyncMock(return_value=mock_result)
        
        # Call update_user_plan
        with patch('app.core.access_control.logger'):
            result_plan = await update_user_plan(mock_user, mock_db)
        
        # Verify plan was updated to STARTER
        assert result_plan == PlanType.STARTER
        assert mock_user.current_plan == PlanType.STARTER
        
        # Verify database operations were called
        assert mock_db.commit.call_count == 2  # Once for user, once for quotas
        assert mock_db.execute.call_count >= 1  # At least for finding businesses


@pytest.mark.unit
def test_plan_hierarchy():
    """Test that plan quotas follow expected hierarchy."""
    quotas = [
        (PlanType.FREE, 1),
        (PlanType.STARTER, 3),
        (PlanType.PRO, 5),
        (PlanType.PREMIUM, 10),
        (PlanType.ENTERPRISE, 20),
    ]
    
    for i in range(len(quotas) - 1):
        current_plan, current_quota = quotas[i]
        next_plan, next_quota = quotas[i + 1]
        
        assert next_quota > current_quota, (
            f"{next_plan.value} quota ({next_quota}) should be greater than "
            f"{current_plan.value} quota ({current_quota})"
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

