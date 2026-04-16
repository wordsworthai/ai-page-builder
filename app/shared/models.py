import datetime
import uuid
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import ConfigDict
from sqlalchemy import BigInteger, Column, JSON, String
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import registry
from sqlmodel import Field, Relationship, SQLModel
from app.core.permissions import AccountType, PlanType
from app.shared.utils.helpers import get_utcnow, get_one_month_from_now

mapper_registry = registry()
Base = mapper_registry.generate_base()


class UUIDModelBase(SQLModel, AsyncAttrs):
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    model_config = ConfigDict(arbitrary_types_allowed=True)


class Article(UUIDModelBase, table=True):
    __tablename__ = "article"
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    content: str
    author: str
    published_at: Optional[datetime.datetime] = Field(
        default_factory=get_utcnow,
        nullable=True,
    )
    is_published: Optional[bool] = Field(default=False)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    user: "User" = Relationship(back_populates="articles")


class User(UUIDModelBase, table=True):
    __tablename__ = "user"
    email: str = Field(sa_column_kwargs={"unique": True})
    password_hash: Optional[str] = Field(default=None, nullable=True)
    full_name: str
    created_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
    )
    last_login: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
    )

    # Email verification (verified = email_verified for backward compatibility)
    verified: bool = Field(default=False)
    email_verification_token: Optional[str] = Field(default=None, nullable=True)
    email_verification_expires_at: Optional[datetime.datetime] = Field(default=None, nullable=True)

    # Authentication provider tracking
    auth_provider: str = Field(default="email")  # 'email', 'google', 'merged'
    google_id: Optional[str] = Field(default=None, nullable=True, index=True)

    # Password reset
    password_reset_token: Optional[str] = Field(default=None, nullable=True)
    password_reset_expires_at: Optional[datetime.datetime] = Field(default=None, nullable=True)

    # Soft delete
    deleted: bool = Field(default=False, index=True)
    deleted_at: Optional[datetime.datetime] = Field(default=None, nullable=True)
    deletion_reason: Optional[str] = Field(default=None, nullable=True)

    # Account & billing
    account_type: AccountType = AccountType.free
    current_plan: PlanType = PlanType.FREE
    stripe_customer_id: Optional[str] = Field(nullable=True, index=True)
    is_superuser: bool = Field(default=False, nullable=False)

    # Relationships
    articles: List[Article] = Relationship(back_populates="user", sa_relationship_kwargs={"lazy": "selectin"})
    purchases: List["Purchase"] = Relationship(back_populates="user", sa_relationship_kwargs={"lazy": "selectin"})
    subscription: Optional["Subscription"] = Relationship(back_populates="user", sa_relationship_kwargs={"lazy": "selectin"})
    business_users: List["BusinessUser"] = Relationship(back_populates="user", sa_relationship_kwargs={"lazy": "selectin"})


class Purchase(UUIDModelBase, table=True):
    __tablename__ = "purchase"
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    product_type: str
    price_id: str
    transaction_id: str = Field(unique=True)
    purchase_date: datetime.datetime = Field(default_factory=get_utcnow)
    amount: float
    currency: str = Field(default="USD")
    is_successful: bool = Field(default=False)
    download_link: Optional[str] = None

    user: Optional["User"] = Relationship(back_populates="purchases")


class SubscriptionStatus(str, Enum):
    ACTIVE = "ACTIVE"
    TRIALING = "TRIALING"
    CANCELED = "CANCELED"
    EXPIRED = "EXPIRED"
    PAST_DUE = "PAST_DUE"
    UNPAID = "UNPAID"
    INCOMPLETE = "INCOMPLETE"
    INCOMPLETE_EXPIRED = "INCOMPLETE_EXPIRED"


class BusinessType(str, Enum):
    INDIVIDUAL = "individual"
    SERVICES = "services"
    ECOMMERCE = "ecommerce"


class BusinessRole(str, Enum):
    OWNER = "owner"
    EDITOR = "editor"
    VIEWER = "viewer"


class Subscription(UUIDModelBase, table=True):
    __tablename__ = "subscription"
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True, unique=True)
    stripe_subscription_id: Optional[str] = Field(nullable=True, index=True)
    plan: str
    status: SubscriptionStatus = Field(default=SubscriptionStatus.ACTIVE)
    start_date: datetime.datetime = Field(default_factory=get_utcnow)
    end_date: Optional[datetime.datetime] = None

    user: Optional["User"] = Relationship(back_populates="subscription")


class Business(SQLModel, table=True):
    __tablename__ = "businesses"

    business_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False
    )
    business_type: Optional[BusinessType] = Field(default=None, nullable=True)
    business_subtype: Optional[str] = Field(default=None, nullable=True)
    business_name: str = Field(max_length=255, nullable=False)
    created_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False
    )

    business_users: List["BusinessUser"] = Relationship(
        back_populates="business",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "lazy": "selectin"}
    )
    credits: Optional["BusinessCredits"] = Relationship(
        back_populates="business",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "lazy": "selectin", "uselist": False}
    )
    service_profile: Optional["ServiceBusinessProfile"] = Relationship(
        back_populates="business",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "lazy": "selectin", "uselist": False}
    )


class BusinessUser(SQLModel, table=True):
    __tablename__ = "business_users"

    business_id: uuid.UUID = Field(
        foreign_key="businesses.business_id",
        primary_key=True,
        nullable=False
    )
    user_id: uuid.UUID = Field(
        foreign_key="user.id",
        primary_key=True,
        nullable=False
    )
    role: str = Field(
        default=BusinessRole.OWNER.value,
        sa_column=Column(String, nullable=False)
    )
    joined_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False
    )

    business: Optional["Business"] = Relationship(back_populates="business_users")
    user: Optional["User"] = Relationship(back_populates="business_users")


class BusinessCredits(SQLModel, table=True):
    __tablename__ = "business_credits"

    business_id: uuid.UUID = Field(
        foreign_key="businesses.business_id",
        primary_key=True,
        nullable=False
    )
    plan_type: str = Field(default="FREE", max_length=50, nullable=False)
    credits_balance: int = Field(default=20, nullable=False)
    subscription_ends_at: Optional[datetime.datetime] = Field(default=None, nullable=True)
    last_credit_grant_at: Optional[datetime.datetime] = Field(default=None, nullable=True)
    period_start: datetime.datetime = Field(default_factory=get_utcnow, nullable=False)
    period_end: datetime.datetime = Field(default_factory=get_one_month_from_now, nullable=False)
    last_reset_at: datetime.datetime = Field(default_factory=get_utcnow, nullable=False)
    updated_at: datetime.datetime = Field(default_factory=get_utcnow, nullable=False)

    business: Optional["Business"] = Relationship(back_populates="credits")


class CreditTransaction(SQLModel, table=True):
    __tablename__ = "credit_transactions"

    transaction_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False
    )
    business_id: uuid.UUID = Field(
        foreign_key="businesses.business_id",
        nullable=False,
        index=True
    )
    transaction_type: str = Field(max_length=50, nullable=False)
    credits_change: int = Field(nullable=False)
    credits_balance_after: int = Field(nullable=False)
    reference_id: Optional[str] = Field(default=None, max_length=255, nullable=True)
    description: Optional[str] = Field(default=None, nullable=True)
    created_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
        index=True
    )


class ServiceBusinessProfile(SQLModel, table=True):
    __tablename__ = "service_business_profiles"

    business_id: uuid.UUID = Field(
        foreign_key="businesses.business_id",
        primary_key=True,
        nullable=False
    )
    yelp_url: Optional[str] = Field(default=None, nullable=True)
    google_maps_url: Optional[str] = Field(default=None, nullable=True)
    updated_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False
    )

    business: Optional["Business"] = Relationship(back_populates="service_profile")


class ConnectionStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"


class SyncStatus(str, Enum):
    SYNCED = "synced"
    PENDING = "pending"
    ERROR = "error"
    INGESTING = "ingesting"
    INGESTED = "ingested"
    INGEST_FAILED = "ingest_failed"


class NangoConnection(UUIDModelBase, table=True):
    __tablename__ = "nango_connections"

    user_id: uuid.UUID = Field(foreign_key="user.id", index=True, nullable=False)
    business_id: uuid.UUID = Field(foreign_key="businesses.business_id", index=True, nullable=False)
    connection_id: str = Field(unique=True, index=True, nullable=False)
    integration_id: str = Field(nullable=False)
    provider: str = Field(nullable=False)
    status: ConnectionStatus = Field(default=ConnectionStatus.ACTIVE)
    last_sync_at: Optional[datetime.datetime] = Field(default=None, nullable=True)
    created_at: datetime.datetime = Field(default_factory=get_utcnow, nullable=False)

    documents: List["SyncedDocument"] = Relationship(
        back_populates="nango_connection",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "lazy": "selectin"},
    )


class SyncedDocument(UUIDModelBase, table=True):
    __tablename__ = "synced_documents"

    nango_connection_id: uuid.UUID = Field(
        foreign_key="nango_connections.id", index=True, nullable=False
    )
    external_id: str = Field(index=True, nullable=False)
    title: str = Field(nullable=False)
    mime_type: Optional[str] = Field(default=None, nullable=True)
    url: Optional[str] = Field(default=None, nullable=True)
    last_modified_at: Optional[datetime.datetime] = Field(default=None, nullable=True)
    size_bytes: Optional[int] = Field(default=None, sa_column=Column(BigInteger, nullable=True))
    sync_status: SyncStatus = Field(default=SyncStatus.SYNCED)
    raw_metadata: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON, nullable=True))
    created_at: datetime.datetime = Field(default_factory=get_utcnow, nullable=False)
    updated_at: datetime.datetime = Field(default_factory=get_utcnow, nullable=False)

    nango_connection: Optional["NangoConnection"] = Relationship(back_populates="documents")
