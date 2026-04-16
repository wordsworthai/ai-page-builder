"""add ingestion sync statuses

Revision ID: 02b5a3c7d1e9
Revises: 01aff4b7d352
Create Date: 2026-03-10 11:30:00.000000

"""
from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = '02b5a3c7d1e9'
down_revision: Union[str, None] = '01aff4b7d352'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # synced_documents.sync_status is VARCHAR (f3a8b1c2d4e5), not a PostgreSQL ENUM named syncstatus.
    # App SyncStatus values (ingesting, ingested, ingest_failed) are stored as strings; no DDL required.
    pass


def downgrade() -> None:
    pass
