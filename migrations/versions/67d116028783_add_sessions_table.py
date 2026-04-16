"""add sessions table

Revision ID: 67d116028783
Revises: 02b5a3c7d1e9
Create Date: 2026-03-13 16:19:33.414929

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '67d116028783'
down_revision: Union[str, None] = '02b5a3c7d1e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("business_id", sa.Uuid(), nullable=False),
        sa.Column("created_by", sa.Uuid(), nullable=False),
        sa.Column("name", sa.VARCHAR(length=255), nullable=False),
        sa.Column("status", sa.VARCHAR(length=20), nullable=False),
        sa.Column("document_tabs", postgresql.JSONB(), server_default="[]", nullable=False),
        sa.Column("active_document_tab_index", sa.Integer(), nullable=False),
        sa.Column("active_chat_tab_index", sa.Integer(), nullable=False),
        sa.Column("access_level", sa.VARCHAR(length=20), nullable=False),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.business_id"]),
        sa.ForeignKeyConstraint(["created_by"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_sessions_business_user_deleted",
        "sessions",
        ["business_id", "created_by", "deleted_at"],
    )
    op.create_index(
        "ix_sessions_business_updated",
        "sessions",
        ["business_id", "updated_at"],
        postgresql_where=sa.text("deleted_at IS NULL"),
    )


def downgrade() -> None:
    op.drop_index("ix_sessions_business_updated", table_name="sessions")
    op.drop_index("ix_sessions_business_user_deleted", table_name="sessions")
    op.drop_table("sessions")
