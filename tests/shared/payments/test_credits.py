"""
Unit tests for credit-based pricing system.
Tests credit operations, balance checks, and transaction logging.
"""

import pytest
import uuid
from unittest.mock import AsyncMock, Mock

from app.core.permissions import PlanType
from app.shared.config.credits import (
    WorkflowTriggerType,
    get_credit_cost,
    get_credit_operation_for_scope,
    get_signup_credits,
    get_subscription_credits,
)
from app.shared.models import User
from app.shared.config.credits import CreditTransactionType
from app.core.access_control import get_user_current_plan


@pytest.mark.unit
class TestCreditCosts:
    """Test credit cost configuration."""
    
    def test_full_page_generation_cost(self):
        """Test that create-site generation costs 10 credits."""
        cost = get_credit_cost(WorkflowTriggerType.CREATE_SITE)
        assert cost == 10
    
    def test_section_regeneration_cost(self):
        """Test section regeneration cost."""
        cost = get_credit_cost(WorkflowTriggerType.SECTION_REGENERATION)
        assert cost == 2

    def test_regenerate_content_cost(self):
        """Test content regeneration cost."""
        cost = get_credit_cost(WorkflowTriggerType.REGENERATE_CONTENT)
        assert cost == 5

    def test_unknown_scope_defaults_to_create_site_cost(self):
        """Test that unknown generation_scope resolves to CREATE_SITE and costs 10 credits."""
        operation = get_credit_operation_for_scope("unknown_operation")
        assert operation == WorkflowTriggerType.CREATE_SITE
        cost = get_credit_cost(operation)
        assert cost == 10


@pytest.mark.unit
class TestCreditGrants:
    """Test credit grant amounts."""
    
    def test_signup_credits(self):
        """Test that signup grants 20 credits."""
        credits = get_signup_credits()
        assert credits == 20
    
    def test_subscription_credits(self):
        """Test that subscription grants 100 credits."""
        credits = get_subscription_credits()
        assert credits == 100


@pytest.mark.unit
class TestPlanTypes:
    """Test simplified plan type configuration."""
    
    def test_plan_types_are_limited(self):
        """Test that only FREE, BASIC, CUSTOM plans exist."""
        plan_values = [p.value for p in PlanType]
        assert "free" in plan_values
        assert "basic" in plan_values
        assert "custom" in plan_values
        # Old plans should not exist
        assert "starter" not in plan_values
        assert "pro" not in plan_values
        assert "premium" not in plan_values
        assert "enterprise" not in plan_values


@pytest.mark.unit
@pytest.mark.asyncio
class TestCreditService:
    """Test CreditService operations."""
    
    async def test_get_balance_returns_correct_value(self):
        """Test getting credit balance."""
        from app.shared.services.payments.credit_service import CreditService
        
        mock_db = AsyncMock()
        business_id = uuid.uuid4()
        
        # Mock the credits record
        mock_credits = Mock()
        mock_credits.credits_balance = 50
        
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = mock_credits
        mock_db.execute = AsyncMock(return_value=mock_result)
        
        service = CreditService(mock_db)
        balance = await service.get_balance(business_id)
        
        assert balance == 50
    
    async def test_get_balance_returns_zero_if_no_record(self):
        """Test that balance returns 0 if no record exists."""
        from app.shared.services.payments.credit_service import CreditService
        
        mock_db = AsyncMock()
        business_id = uuid.uuid4()
        
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)
        
        service = CreditService(mock_db)
        balance = await service.get_balance(business_id)
        
        assert balance == 0
    
    async def test_has_sufficient_credits_true(self):
        """Test sufficient credits check returns True."""
        from app.shared.services.payments.credit_service import CreditService
        
        mock_db = AsyncMock()
        business_id = uuid.uuid4()
        
        mock_credits = Mock()
        mock_credits.credits_balance = 15
        
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = mock_credits
        mock_db.execute = AsyncMock(return_value=mock_result)
        
        service = CreditService(mock_db)
        has_credits = await service.has_sufficient_credits(business_id, required=10)
        
        assert has_credits is True
    
    async def test_has_sufficient_credits_false(self):
        """Test sufficient credits check returns False when not enough."""
        from app.shared.services.payments.credit_service import CreditService
        
        mock_db = AsyncMock()
        business_id = uuid.uuid4()
        
        mock_credits = Mock()
        mock_credits.credits_balance = 5
        
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = mock_credits
        mock_db.execute = AsyncMock(return_value=mock_result)
        
        service = CreditService(mock_db)
        has_credits = await service.has_sufficient_credits(business_id, required=10)
        
        assert has_credits is False
    
    async def test_add_credits_increases_balance(self):
        """Test adding credits increases balance."""
        from app.shared.services.payments.credit_service import CreditService
        
        mock_db = AsyncMock()
        business_id = uuid.uuid4()
        
        mock_credits = Mock()
        mock_credits.credits_balance = 10
        mock_credits.last_credit_grant_at = None
        mock_credits.updated_at = None
        
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = mock_credits
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.add = Mock()
        mock_db.flush = AsyncMock()
        
        service = CreditService(mock_db)
        new_balance = await service.add_credits(
            business_id=business_id,
            amount=100,
            transaction_type=CreditTransactionType.SUBSCRIPTION_GRANT
        )
        
        assert new_balance == 110
        assert mock_credits.credits_balance == 110
        assert mock_db.add.call_count == 2  # Credits record + transaction
    
    async def test_deduct_credits_decreases_balance(self):
        """Test deducting credits decreases balance."""
        from app.shared.services.payments.credit_service import CreditService
        
        mock_db = AsyncMock()
        business_id = uuid.uuid4()
        
        mock_credits = Mock()
        mock_credits.credits_balance = 50
        mock_credits.updated_at = None
        
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = mock_credits
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.add = Mock()
        mock_db.flush = AsyncMock()
        
        service = CreditService(mock_db)
        new_balance = await service.deduct_credits(
            business_id=business_id,
            amount=10,
            transaction_type=CreditTransactionType.GENERATION_FULL_PAGE
        )
        
        assert new_balance == 40
        assert mock_credits.credits_balance == 40
    
    async def test_deduct_credits_raises_on_insufficient(self):
        """Test that deducting more credits than available raises error."""
        from app.shared.services.payments.credit_service import CreditService, InsufficientCreditsError
        
        mock_db = AsyncMock()
        business_id = uuid.uuid4()
        
        mock_credits = Mock()
        mock_credits.credits_balance = 5
        
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = mock_credits
        mock_db.execute = AsyncMock(return_value=mock_result)
        
        service = CreditService(mock_db)
        
        with pytest.raises(InsufficientCreditsError) as exc_info:
            await service.deduct_credits(
                business_id=business_id,
                amount=10,
                transaction_type=CreditTransactionType.GENERATION_FULL_PAGE
            )
        
        assert exc_info.value.available == 5
        assert exc_info.value.required == 10


@pytest.mark.unit
@pytest.mark.asyncio
class TestPlanDetermination:
    """Test plan determination logic."""
    
    async def test_free_plan_for_no_subscription(self):
        """Test that users without subscription get FREE plan."""
        mock_user = Mock(spec=User)
        mock_user.id = uuid.uuid4()

        # get_user_current_plan queries the DB directly; mock scalar_one_or_none
        # as a regular Mock so it returns None (no subscription), not a coroutine.
        mock_result = Mock()
        mock_result.scalar_one_or_none = Mock(return_value=None)
        mock_db = AsyncMock()
        mock_db.execute = AsyncMock(return_value=mock_result)

        plan = await get_user_current_plan(mock_user, mock_db)

        assert plan == PlanType.FREE

    async def test_basic_plan_for_active_subscription(self):
        """Test that users with active subscription get BASIC plan."""
        mock_subscription = Mock()
        mock_subscription.status = "ACTIVE"
        mock_subscription.plan = "basic"

        mock_user = Mock(spec=User)
        mock_user.id = uuid.uuid4()

        # Return a real-ish subscription object from the DB query mock.
        mock_result = Mock()
        mock_result.scalar_one_or_none = Mock(return_value=mock_subscription)
        mock_db = AsyncMock()
        mock_db.execute = AsyncMock(return_value=mock_result)

        plan = await get_user_current_plan(mock_user, mock_db)

        assert plan == PlanType.BASIC


@pytest.mark.unit
def test_credit_transaction_types():
    """Test that all expected transaction types exist."""
    expected_types = [
        "signup_bonus",
        "subscription_grant",
        "generation_full_page",
        "generation_section",
        "addon_purchase",
        "admin_adjustment",
        "plan_downgrade",
    ]
    
    actual_types = [t.value for t in CreditTransactionType]
    
    for expected in expected_types:
        assert expected in actual_types, f"Missing transaction type: {expected}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
