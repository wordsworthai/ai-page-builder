"""change size_bytes to bigint

Revision ID: 01aff4b7d352
Revises: f3a8b1c2d4e5
Create Date: 2026-03-10 11:21:35.194959

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '01aff4b7d352'
down_revision: Union[str, None] = 'f3a8b1c2d4e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('synced_documents', 'size_bytes',
               existing_type=sa.INTEGER(),
               type_=sa.BigInteger(),
               existing_nullable=True)


def downgrade() -> None:
    op.alter_column('synced_documents', 'size_bytes',
               existing_type=sa.BigInteger(),
               type_=sa.INTEGER(),
               existing_nullable=True)
