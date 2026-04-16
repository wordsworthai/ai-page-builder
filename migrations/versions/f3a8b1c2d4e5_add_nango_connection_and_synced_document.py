"""add nango connection and synced document

Revision ID: f3a8b1c2d4e5
Revises: e1ad7ed5d633
Create Date: 2026-03-06 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = 'f3a8b1c2d4e5'
down_revision: Union[str, None] = 'e1ad7ed5d633'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'nango_connections',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('business_id', sa.Uuid(), nullable=False),
        sa.Column('connection_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('integration_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('provider', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('status', sa.VARCHAR(), nullable=False, server_default='active'),
        sa.Column('last_sync_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.business_id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_nango_connections_id'), 'nango_connections', ['id'], unique=False)
    op.create_index(op.f('ix_nango_connections_user_id'), 'nango_connections', ['user_id'], unique=False)
    op.create_index(op.f('ix_nango_connections_business_id'), 'nango_connections', ['business_id'], unique=False)
    op.create_index(op.f('ix_nango_connections_connection_id'), 'nango_connections', ['connection_id'], unique=True)

    op.create_table(
        'synced_documents',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('nango_connection_id', sa.Uuid(), nullable=False),
        sa.Column('external_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('mime_type', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('url', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('last_modified_at', sa.DateTime(), nullable=True),
        sa.Column('size_bytes', sa.Integer(), nullable=True),
        sa.Column('sync_status', sa.VARCHAR(), nullable=False, server_default='synced'),
        sa.Column('raw_metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['nango_connection_id'], ['nango_connections.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_synced_documents_id'), 'synced_documents', ['id'], unique=False)
    op.create_index(op.f('ix_synced_documents_nango_connection_id'), 'synced_documents', ['nango_connection_id'], unique=False)
    op.create_index(op.f('ix_synced_documents_external_id'), 'synced_documents', ['external_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_synced_documents_external_id'), table_name='synced_documents')
    op.drop_index(op.f('ix_synced_documents_nango_connection_id'), table_name='synced_documents')
    op.drop_index(op.f('ix_synced_documents_id'), table_name='synced_documents')
    op.drop_table('synced_documents')

    op.drop_index(op.f('ix_nango_connections_connection_id'), table_name='nango_connections')
    op.drop_index(op.f('ix_nango_connections_business_id'), table_name='nango_connections')
    op.drop_index(op.f('ix_nango_connections_user_id'), table_name='nango_connections')
    op.drop_index(op.f('ix_nango_connections_id'), table_name='nango_connections')
    op.drop_table('nango_connections')
