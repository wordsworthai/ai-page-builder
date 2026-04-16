"""add session_id to conversations

Revision ID: 92e3d4a1a553
Revises: 67d116028783
Create Date: 2026-03-13 16:31:37.560041

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '92e3d4a1a553'
down_revision: Union[str, None] = '67d116028783'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('conversations', sa.Column('session_id', sa.Uuid(), nullable=True))
    op.create_foreign_key(
        'fk_conversations_session_id',
        'conversations', 'sessions',
        ['session_id'], ['id'],
    )
    op.create_index(
        'ix_conversations_session_id',
        'conversations',
        ['session_id'],
        postgresql_where=sa.text('session_id IS NOT NULL'),
    )


def downgrade() -> None:
    op.drop_index('ix_conversations_session_id', table_name='conversations')
    op.drop_constraint('fk_conversations_session_id', 'conversations', type_='foreignkey')
    op.drop_column('conversations', 'session_id')
