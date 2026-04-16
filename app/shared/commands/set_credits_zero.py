"""
Set credits to 0 and plan to FREE for all businesses (testing only).

Also cancels active subscriptions so the frontend shows FREE plan.
The frontend determines "current plan" from Subscription status, not BusinessCredits.

Usage: task payments:credits-reset
"""
import asyncio
import logging

from sqlalchemy import select, update

from app.core.db import AsyncSessionLocal
from app.shared.models import Business, BusinessCredits, Subscription, SubscriptionStatus, User
from app.shared.services.payments.credit_service import CreditService

logger = logging.getLogger(__name__)


async def set_credits_zero_for_all() -> None:
    """Set credits to 0, plan to FREE for all businesses, and cancel subscriptions."""
    async with AsyncSessionLocal() as db:
        stmt = select(BusinessCredits, Business).join(
            Business, BusinessCredits.business_id == Business.business_id
        )
        result = await db.execute(stmt)
        rows = result.all()

        if not rows:
            print("No businesses found in database.")
            return

        credit_service = CreditService(db)
        count = 0

        for credits, business in rows:
            business_id = credits.business_id
            business_name = business.business_name
            old_balance = credits.credits_balance
            old_plan = credits.plan_type

            try:
                if old_balance > 0:
                    await credit_service.admin_adjust_credits(
                        business_id=business_id,
                        amount=-old_balance,
                        description="Test: reset to 0 credits",
                    )
                await credit_service.update_plan_type(
                    business_id=business_id,
                    plan_type="FREE",
                )
                await db.commit()

                print(
                    f"  {business_name} ({business_id}): "
                    f"credits {old_balance} -> 0, plan {old_plan} -> FREE"
                )
                count += 1
            except Exception as e:
                await db.rollback()
                logger.exception("Failed to reset credits for business %s", business_id)
                print(f"  [ERROR] {business_name} ({business_id}): {e}")

        # Cancel all subscriptions so frontend shows FREE (plan comes from Subscription, not BusinessCredits)
        try:
            sub_stmt = (
                update(Subscription)
                .where(Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING]))
                .values(status=SubscriptionStatus.CANCELED)
            )
            sub_result = await db.execute(sub_stmt)
            sub_count = sub_result.rowcount if sub_result.rowcount is not None else 0

            if sub_count > 0:
                # Update User.current_plan to FREE for users whose subscriptions were just canceled
                user_stmt = (
                    update(User)
                    .where(
                        User.id.in_(
                            select(Subscription.user_id).where(
                                Subscription.status == SubscriptionStatus.CANCELED
                            )
                        )
                    )
                    .values(current_plan="FREE")
                )
                await db.execute(user_stmt)
                print(f"Cancelled {sub_count} subscription(s); frontend will now show FREE plan.")

            await db.commit()
        except Exception as e:
            await db.rollback()
            logger.exception("Failed to cancel subscriptions")
            print(f"  [ERROR] Subscription cancel failed: {e}")

        print(f"\nReset {count} business(es) to 0 credits and FREE plan.")


if __name__ == "__main__":
    asyncio.run(set_credits_zero_for_all())
