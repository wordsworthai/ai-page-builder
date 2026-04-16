"""add_preview_link_to_generation_versions

Revision ID: a1b2c3d4e5f6
Revises: c7dbc495d092
Create Date: 2026-02-05 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'c7dbc495d092'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add preview_link column to generation_versions table
    op.add_column('generation_versions', sa.Column('preview_link', sqlmodel.sql.sqltypes.AutoString(), nullable=True))


def downgrade() -> None:
    # Remove preview_link column from generation_versions table
    op.drop_column('generation_versions', 'preview_link')
