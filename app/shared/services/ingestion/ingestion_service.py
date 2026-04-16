"""Connector ingestion orchestrator — downloads files from connectors, uploads to RAGFlow."""

import logging
import uuid
from typing import Dict, List

from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.db import get_async_db_session
from app.shared.models import NangoConnection, SyncedDocument, SyncStatus
from app.shared.services.connectors.nango_service import NangoService, get_nango_service
from app.shared.services.ingestion.ragflow_ingestion_service import RagflowIngestionService
from app.shared.utils.helpers import get_utcnow

logger = logging.getLogger(__name__)

# File extension mapping for Google Workspace exports
GOOGLE_EXPORT_EXTENSIONS = {
    "application/vnd.google-apps.document": ".pdf",
    "application/vnd.google-apps.spreadsheet": ".xlsx",
    "application/vnd.google-apps.presentation": ".pdf",
}


class IngestionService:
    """Orchestrates: download from connector → upload to RAGFlow → update status.

    Works with any connector that provides file bytes. Currently supports
    Nango-backed connectors (Google Drive, Dropbox, etc.).
    """

    def __init__(self, db: AsyncSession, nango: NangoService):
        self.db = db
        self.nango = nango
        self.ragflow = RagflowIngestionService()

    async def ingest_documents(
        self,
        connection_db_id: uuid.UUID,
        user_id: uuid.UUID,
        document_ids: List[str],
    ) -> Dict[str, str]:
        """Ingest selected documents: download from source → upload to RAGFlow → parse.

        Args:
            connection_db_id: Our DB UUID for the NangoConnection
            user_id: Requesting user's ID (for ownership check)
            document_ids: List of SyncedDocument DB IDs to ingest

        Returns:
            Dict mapping document_id → status ("ok" / error message)
        """
        # Verify ownership
        result = await self.db.execute(
            select(NangoConnection).where(
                NangoConnection.id == connection_db_id,
                NangoConnection.user_id == user_id,
            )
        )
        conn = result.scalar_one_or_none()
        if not conn:
            raise HTTPException(status_code=404, detail="Connection not found")

        # Load selected documents
        result = await self.db.execute(
            select(SyncedDocument).where(
                SyncedDocument.id.in_([uuid.UUID(d) for d in document_ids]),
                SyncedDocument.nango_connection_id == connection_db_id,
            )
        )
        docs = list(result.scalars().all())
        if not docs:
            raise HTTPException(status_code=400, detail="No valid documents selected")

        # Filter out already-ingested documents (defense-in-depth)
        docs = [d for d in docs if d.sync_status != SyncStatus.INGESTED]
        if not docs:
            raise HTTPException(status_code=400, detail="All selected documents are already ingested")

        # Mark all as ingesting
        for doc in docs:
            doc.sync_status = SyncStatus.INGESTING
            doc.updated_at = get_utcnow()
        await self.db.commit()

        # Process each document
        results: Dict[str, str] = {}
        ragflow_doc_ids: List[str] = []

        for doc in docs:
            doc_id_str = str(doc.id)
            try:
                # Check if ingestable
                if not RagflowIngestionService.is_ingestable_mime_type(doc.mime_type):
                    doc.sync_status = SyncStatus.INGEST_FAILED
                    doc.updated_at = get_utcnow()
                    results[doc_id_str] = f"Unsupported file type: {doc.mime_type}"
                    continue

                # Download file bytes
                file_bytes, filename, content_type = await self._download_file(
                    conn, doc
                )

                # Upload to RAGFlow
                success, ragflow_id, msg = await self.ragflow.upload_document(
                    filename=filename,
                    file_bytes=file_bytes,
                    content_type=content_type,
                )

                if success and ragflow_id:
                    ragflow_doc_ids.append(ragflow_id)
                    results[doc_id_str] = "ok"
                else:
                    doc.sync_status = SyncStatus.INGEST_FAILED
                    doc.updated_at = get_utcnow()
                    results[doc_id_str] = msg

            except Exception as e:
                logger.error("Ingestion failed for doc=%s: %s", doc_id_str, e, exc_info=True)
                doc.sync_status = SyncStatus.INGEST_FAILED
                doc.updated_at = get_utcnow()
                results[doc_id_str] = str(e)

        # Trigger parsing for all successfully uploaded documents
        if ragflow_doc_ids:
            parse_ok, parse_msg = await self.ragflow.trigger_parsing(ragflow_doc_ids)
            if not parse_ok:
                logger.warning("Parse trigger failed: %s", parse_msg)

        # Mark successful ones as ingested
        for doc in docs:
            if results.get(str(doc.id)) == "ok":
                doc.sync_status = SyncStatus.INGESTED
                doc.updated_at = get_utcnow()

        await self.db.commit()

        succeeded = sum(1 for v in results.values() if v == "ok")
        failed = len(results) - succeeded
        logger.info(
            "Ingestion complete: %d succeeded, %d failed for connection=%s",
            succeeded, failed, conn.connection_id,
        )
        return results

    async def _download_file(
        self,
        conn: NangoConnection,
        doc: SyncedDocument,
    ) -> tuple[bytes, str, str]:
        """Download a file from the connector. Returns (bytes, filename, content_type)."""
        title = doc.title or "untitled"

        if RagflowIngestionService.needs_google_export(doc.mime_type):
            # Google Workspace file → export to PDF/XLSX
            export_mime = RagflowIngestionService.get_export_mime_type(doc.mime_type)
            ext = GOOGLE_EXPORT_EXTENSIONS.get(doc.mime_type, ".pdf")
            resp = await self.nango.export_google_workspace_file(
                conn.connection_id, doc.external_id, export_mime
            )
            filename = f"{title}{ext}" if not title.endswith(ext) else title
            return resp.content, filename, export_mime
        else:
            # Regular file → direct download
            resp = await self.nango.proxy_file_download(
                conn.connection_id, doc.external_id
            )
            content_type = doc.mime_type or "application/octet-stream"
            return resp.content, title, content_type


async def get_ingestion_service(
    db: AsyncSession = Depends(get_async_db_session),
    nango: NangoService = Depends(get_nango_service),
) -> IngestionService:
    return IngestionService(db, nango)
