"""
Credit operations, costs, transaction types, and plan grants.
Single place for all credit-related configuration and enums.
WorkflowTriggerType is the single enum for both workflow trigger and credit operation.
"""
from dataclasses import dataclass
from enum import Enum

# Initial credits granted for each plan event
class PlanCreditGrant(int, Enum):
    """Credits granted for plan events. Value is the credit amount."""
    SIGNUP = 20              # FREE plan signup
    BASIC_SUBSCRIBE = 100    # First BASIC subscription


def get_signup_credits() -> int:
    """Get credits granted on signup (FREE plan)."""
    return PlanCreditGrant.SIGNUP


def get_subscription_credits() -> int:
    """Get credits granted on BASIC subscription."""
    return PlanCreditGrant.BASIC_SUBSCRIBE


# ---------------------------------------------------------------------------
# Transaction types for audit trail (stored in credit_transactions table)
# ---------------------------------------------------------------------------

class CreditTransactionTypeBase(str, Enum):
    """Base transaction types: grants, purchases, adjustments (non-generation)."""
    SIGNUP_BONUS = "signup_bonus"              # +20 on signup
    SUBSCRIPTION_GRANT = "subscription_grant"  # +100 on Basic subscribe
    ADDON_PURCHASE = "addon_purchase"           # +N for purchased credits
    ADMIN_ADJUSTMENT = "admin_adjustment"       # Manual admin changes
    PLAN_DOWNGRADE = "plan_downgrade"           # Reset to 20 on cancel/expiry


class CreditTransactionType(str, Enum):
    """All transaction types for audit trail (base + generation operations)."""
    # Base (grants, purchases, adjustments)
    SIGNUP_BONUS = "signup_bonus"
    SUBSCRIPTION_GRANT = "subscription_grant"
    ADDON_PURCHASE = "addon_purchase"
    ADMIN_ADJUSTMENT = "admin_adjustment"
    PLAN_DOWNGRADE = "plan_downgrade"
    
    # Generation operations
    GENERATION_FULL_PAGE = "generation_full_page"           # -10 per full page
    GENERATION_TEMPLATE = "generation_template"              # -10 per template (use-section-ids)
    GENERATION_COLOR_REGENERATION = "generation_color_regeneration"  # -5
    GENERATION_CONTENT_REGENERATION = "generation_content_regeneration"  # -3
    GENERATION_SECTION = "generation_section"                 # -2 per section regen


class WorkflowTriggerType(str, Enum):
    """Workflow trigger type and credit operation. One enum for both."""
    CREATE_SITE = "create-site"
    USE_SECTION_IDS = "use-section-ids"
    REGENERATE_COLOR_THEME = "regenerate-color-theme"
    REGENERATE_CONTENT = "regenerate-content"
    SECTION_REGENERATION = "section_regeneration"  # Credit cost API only


@dataclass
class CreditOperationConfig:
    """Single config per workflow trigger: cost, audit transaction type, and default label."""
    cost: int
    transaction_type: CreditTransactionType
    label: str


# Single source of truth for credit operations. Used for GET /api/credits/info costs map.
CREDIT_OPERATIONS: dict[WorkflowTriggerType, CreditOperationConfig] = {
    WorkflowTriggerType.CREATE_SITE: CreditOperationConfig(
        10, CreditTransactionType.GENERATION_FULL_PAGE, "Full site creation"
    ),
    WorkflowTriggerType.USE_SECTION_IDS: CreditOperationConfig(
        10, CreditTransactionType.GENERATION_TEMPLATE, "Template generation"
    ),
    WorkflowTriggerType.REGENERATE_COLOR_THEME: CreditOperationConfig(
        5, CreditTransactionType.GENERATION_COLOR_REGENERATION, "Color theme regeneration"
    ),
    WorkflowTriggerType.REGENERATE_CONTENT: CreditOperationConfig(
        5, CreditTransactionType.GENERATION_CONTENT_REGENERATION, "Content regeneration"
    ),
    WorkflowTriggerType.SECTION_REGENERATION: CreditOperationConfig(
        2, CreditTransactionType.GENERATION_SECTION, "Section regeneration"
    ),
}


def get_credit_operation_for_scope(scope: str) -> WorkflowTriggerType:
    """Resolve WorkflowTriggerType from generation_scope. Defaults to CREATE_SITE on unknown scope."""
    try:
        return WorkflowTriggerType(scope or "")
    except ValueError:
        return WorkflowTriggerType.CREATE_SITE


def get_credit_cost(operation: WorkflowTriggerType) -> int:
    """Get credit cost for a specific operation."""
    config = CREDIT_OPERATIONS.get(operation)
    return config.cost if config else 10


def get_transaction_type_for_operation(operation: WorkflowTriggerType) -> CreditTransactionType:
    """Resolve audit transaction type for a workflow trigger. Defaults to GENERATION_FULL_PAGE."""
    config = CREDIT_OPERATIONS.get(operation)
    return config.transaction_type if config else CreditTransactionType.GENERATION_FULL_PAGE


def get_operation_display_label(operation: WorkflowTriggerType) -> str:
    """Human-readable label for a workflow operation (for credit statements)."""
    config = CREDIT_OPERATIONS.get(operation)
    return config.label if config else operation.value.replace("-", " ").title()
