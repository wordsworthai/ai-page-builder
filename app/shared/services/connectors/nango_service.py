import hashlib
import hmac
import logging
import uuid
from typing import Any, Dict, List, Optional

import httpx
from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func

from app.core.config import config
from app.core.db import get_async_db_session
from app.shared.models import (
    BusinessUser,
    ConnectionStatus,
    NangoConnection,
    SyncedDocument,
    SyncStatus,
)
from app.shared.utils.helpers import get_utcnow

logger = logging.getLogger(__name__)


class NangoService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.base_url = config.nango_base_url.rstrip("/")
        self.secret_key = config.nango_secret_key
        self.webhook_secret = config.nango_webhook_secret

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }

    async def create_connect_session(
        self, user_id: str, email: str, business_id: str, integration_id: str = "google-drive"
    ) -> str:
        """Create a Nango Connect session and return the session token.

        Uses the REST method: POST https://api.nango.dev/connect/sessions
        with end_user for attribution (per current Nango API).
        """
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/connect/sessions",
                headers=self._headers(),
                json={
                    "end_user": {
                        "id": user_id,
                        "email": email,
                    },
                    "allowed_integrations": [integration_id],
                },
            )
            if resp.status_code not in (200, 201):
                logger.error("Nango create session failed: %s %s", resp.status_code, resp.text)
                raise HTTPException(status_code=502, detail="Failed to create Nango connect session")
            data = resp.json()
            return data["data"]["token"]

    def verify_webhook_signature(self, payload_bytes: bytes, signature: str) -> bool:
        """Verify Nango webhook HMAC SHA-256 signature."""
        if not self.webhook_secret:
            logger.warning("NANGO_WEBHOOK_SECRET not configured, skipping verification")
            return True
        expected = hmac.new(
            self.webhook_secret.encode(), payload_bytes, hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

    async def handle_auth_webhook(self, payload: Dict[str, Any]) -> None:
        """Handle Nango auth webhook — upsert NangoConnection.

        Webhook payload format:
        {
            "type": "auth",
            "operation": "creation",
            "connectionId": "<CONNECTION-ID>",
            "providerConfigKey": "google-drive",
            "provider": "google-drive",
            "endUser": { "id": "<USER-ID>", "email": "..." },
            ...
        }

        Also handles older format with "tags" instead of "endUser".
        """
        connection_id = payload.get("connectionId", "")
        integration_id = payload.get("providerConfigKey", "")
        provider = payload.get("provider", integration_id)

        # Try endUser (current API) then tags (older format)
        end_user = payload.get("endUser") or payload.get("end_user") or {}
        tags = payload.get("tags") or {}
        user_id_str = end_user.get("id") or tags.get("end_user_id", "")

        if not connection_id or not user_id_str:
            logger.warning("Auth webhook missing connectionId or user id: %s", payload)
            return

        user_id = uuid.UUID(user_id_str)

        # Determine business_id: from webhook payload, existing connections, or user's business
        biz_id_str = end_user.get("organization_id") or tags.get("organization_id")
        if biz_id_str:
            business_id = uuid.UUID(biz_id_str)
        else:
            # Try existing connections first
            result = await self.db.execute(
                select(NangoConnection.business_id).where(NangoConnection.user_id == user_id).limit(1)
            )
            existing_biz = result.scalar_one_or_none()
            if existing_biz:
                business_id = existing_biz
            else:
                # Look up from business_users table
                result = await self.db.execute(
                    select(BusinessUser.business_id).where(BusinessUser.user_id == user_id).limit(1)
                )
                user_biz = result.scalar_one_or_none()
                if not user_biz:
                    logger.warning("Cannot determine business_id for auth webhook user=%s", user_id_str)
                    return
                business_id = user_biz

        # Upsert
        result = await self.db.execute(
            select(NangoConnection).where(NangoConnection.connection_id == connection_id)
        )
        conn = result.scalar_one_or_none()
        if conn:
            conn.status = ConnectionStatus.ACTIVE
            conn.integration_id = integration_id
            conn.provider = provider
        else:
            conn = NangoConnection(
                user_id=user_id,
                business_id=business_id,
                connection_id=connection_id,
                integration_id=integration_id,
                provider=provider,
                status=ConnectionStatus.ACTIVE,
            )
            self.db.add(conn)

        await self.db.commit()
        logger.info("Upserted NangoConnection connection_id=%s", connection_id)

        # Auto-set connection metadata so the documents sync starts immediately
        try:
            await self.set_connection_metadata(
                connection_id=connection_id,
                integration_id=integration_id,
                metadata={"files": ["root"], "folders": ["root"]},
            )
        except Exception:
            logger.warning(
                "Failed to auto-set metadata for connection_id=%s (non-fatal)",
                connection_id,
                exc_info=True,
            )

    async def get_connection_metadata(
        self, connection_id: str, integration_id: str
    ) -> Dict[str, Any]:
        """GET connection metadata from Nango."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/connection/{connection_id}",
                headers=self._headers(),
                params={"provider_config_key": integration_id},
            )
            if resp.status_code != 200:
                logger.warning("Failed to get connection metadata: %s", resp.status_code)
                return {}
            data = resp.json()
            return data.get("metadata", {}) or {}

    async def set_connection_metadata(
        self,
        connection_id: str,
        integration_id: str,
        metadata: Dict[str, Any],
    ) -> None:
        """PATCH connection metadata on Nango so syncs pick up the right scope."""
        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                f"{self.base_url}/connection/{connection_id}/metadata",
                headers=self._headers(),
                params={"provider_config_key": integration_id},
                json=metadata,
            )
            if resp.status_code not in (200, 201, 204):
                logger.error(
                    "Nango set_connection_metadata failed: %s %s",
                    resp.status_code,
                    resp.text,
                )
                raise HTTPException(status_code=502, detail="Failed to set connection metadata")
        logger.info("Set metadata for connection_id=%s: %s", connection_id, metadata)

    async def _query_drive_files(
        self,
        connection_id: str,
        integration_id: str,
        query: str,
        fields: str = "files(id,name,mimeType,parents,size,modifiedTime,webViewLink)",
        page_size: int = 200,
    ) -> List[Dict[str, Any]]:
        """Query Google Drive API via Nango Proxy with pagination."""
        all_files: List[Dict[str, Any]] = []
        page_token: Optional[str] = None

        async with httpx.AsyncClient(timeout=60.0) as client:
            while True:
                params: Dict[str, Any] = {
                    "q": query,
                    "fields": f"nextPageToken,{fields}",
                    "orderBy": "name",
                    "pageSize": page_size,
                }
                if page_token:
                    params["pageToken"] = page_token

                resp = await client.get(
                    f"{self.base_url}/proxy/drive/v3/files",
                    headers={
                        **self._headers(),
                        "Connection-Id": connection_id,
                        "Provider-Config-Key": integration_id,
                    },
                    params=params,
                )
                if resp.status_code != 200:
                    logger.error("Nango proxy Drive query failed: %s %s", resp.status_code, resp.text)
                    break

                data = resp.json()
                all_files.extend(data.get("files", []))
                page_token = data.get("nextPageToken")
                if not page_token:
                    break

        return all_files

    async def list_drive_folders(
        self,
        connection_id: str,
        integration_id: str,
        parent_id: str = "root",
    ) -> List[Dict[str, Any]]:
        """List Google Drive folders under a parent via the Nango Proxy."""
        query = (
            f"mimeType='application/vnd.google-apps.folder' "
            f"and '{parent_id}' in parents "
            f"and trashed=false"
        )
        return await self._query_drive_files(
            connection_id, integration_id, query,
            fields="files(id,name,parents)",
        )

    async def list_drive_files(
        self,
        connection_id: str,
        integration_id: str,
        parent_id: str = "root",
    ) -> List[Dict[str, Any]]:
        """List non-folder files under a parent via the Nango Proxy."""
        query = (
            f"mimeType!='application/vnd.google-apps.folder' "
            f"and '{parent_id}' in parents "
            f"and trashed=false"
        )
        return await self._query_drive_files(connection_id, integration_id, query)

    async def list_drive_files_recursive(
        self,
        connection_id: str,
        integration_id: str,
        folder_ids: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """List all files inside given folders (recursively).

        If folder_ids is None or contains 'root', lists all non-trashed files.
        """
        if not folder_ids or "root" in folder_ids:
            # List ALL non-folder files in the entire drive
            query = "mimeType!='application/vnd.google-apps.folder' and trashed=false"
            return await self._query_drive_files(connection_id, integration_id, query)

        # For specific folders, query each one
        all_files: List[Dict[str, Any]] = []
        seen_ids: set = set()
        folders_to_scan = list(folder_ids)

        while folders_to_scan:
            parent_id = folders_to_scan.pop(0)

            # Get files in this folder
            files = await self.list_drive_files(connection_id, integration_id, parent_id)
            for f in files:
                if f["id"] not in seen_ids:
                    seen_ids.add(f["id"])
                    all_files.append(f)

            # Get subfolders to recurse into
            subfolders = await self.list_drive_folders(connection_id, integration_id, parent_id)
            for sf in subfolders:
                if sf["id"] not in seen_ids:
                    folders_to_scan.append(sf["id"])

        return all_files

    async def update_connection_folder_metadata(
        self,
        connection_db_id: uuid.UUID,
        user_id: uuid.UUID,
        folder_ids: List[str],
    ) -> None:
        """Update Nango connection metadata with selected folder IDs."""
        result = await self.db.execute(
            select(NangoConnection).where(
                NangoConnection.id == connection_db_id,
                NangoConnection.user_id == user_id,
            )
        )
        conn = result.scalar_one_or_none()
        if not conn:
            raise HTTPException(status_code=404, detail="Connection not found")

        metadata = {"files": folder_ids, "folders": folder_ids}
        await self.set_connection_metadata(conn.connection_id, conn.integration_id, metadata)

    async def handle_sync_webhook(self, payload: Dict[str, Any]) -> None:
        """Handle Nango sync webhook — fetch records and upsert SyncedDocuments."""
        connection_id = payload.get("connectionId") or payload.get("connection_id", "")
        model = payload.get("model", "")

        if not connection_id:
            return

        # Find the local connection
        result = await self.db.execute(
            select(NangoConnection).where(NangoConnection.connection_id == connection_id)
        )
        conn = result.scalar_one_or_none()
        if not conn:
            logger.warning("Sync webhook for unknown connection_id=%s", connection_id)
            return

        # Fetch records from Nango
        records = await self._fetch_nango_records(connection_id, model or "Document", conn.integration_id)
        for record in records:
            await self._upsert_synced_document(conn.id, record)

        conn.last_sync_at = get_utcnow()
        await self.db.commit()
        logger.info("Synced %d records for connection_id=%s", len(records), connection_id)

    async def _fetch_nango_records(
        self, connection_id: str, model: str, integration_id: str = "google-drive", limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Fetch all records from Nango Records API with cursor pagination."""
        all_records: List[Dict[str, Any]] = []
        cursor: Optional[str] = None

        async with httpx.AsyncClient() as client:
            while True:
                params: Dict[str, Any] = {
                    "model": model,
                    "limit": limit,
                }
                if cursor:
                    params["cursor"] = cursor

                resp = await client.get(
                    f"{self.base_url}/records",
                    headers={
                        **self._headers(),
                        "Connection-Id": connection_id,
                        "Provider-Config-Key": integration_id,
                    },
                    params=params,
                )
                if resp.status_code != 200:
                    logger.error("Nango records fetch failed: %s %s", resp.status_code, resp.text)
                    break

                data = resp.json()
                records = data.get("records", [])
                all_records.extend(records)

                cursor = data.get("next_cursor")
                if not cursor or len(records) < limit:
                    break

        return all_records

    async def _upsert_synced_document(
        self, nango_connection_id: uuid.UUID, record: Dict[str, Any]
    ) -> None:
        """Upsert a single SyncedDocument from a Nango record."""
        external_id = record.get("id", "")
        if not external_id:
            return

        result = await self.db.execute(
            select(SyncedDocument).where(
                SyncedDocument.nango_connection_id == nango_connection_id,
                SyncedDocument.external_id == external_id,
            )
        )
        doc = result.scalar_one_or_none()

        title = record.get("name") or record.get("title") or "Untitled"
        mime_type = record.get("mimeType") or record.get("mime_type")
        url = record.get("url") or record.get("webViewLink")
        size_bytes = record.get("size")
        if size_bytes is not None:
            try:
                size_bytes = int(size_bytes)
            except (ValueError, TypeError):
                size_bytes = None
        last_modified = record.get("last_modified_date") or record.get("modifiedTime")
        parsed_modified_at = None
        if last_modified:
            try:
                from dateutil.parser import parse as parse_dt
                dt = parse_dt(last_modified)
                # Strip timezone — DB column is TIMESTAMP WITHOUT TIME ZONE
                parsed_modified_at = dt.replace(tzinfo=None)
            except Exception:
                pass

        now = get_utcnow()
        if doc:
            doc.title = title
            doc.mime_type = mime_type
            doc.url = url
            doc.size_bytes = size_bytes
            doc.raw_metadata = record
            doc.sync_status = SyncStatus.SYNCED
            doc.updated_at = now
            if parsed_modified_at:
                doc.last_modified_at = parsed_modified_at
        else:
            doc = SyncedDocument(
                nango_connection_id=nango_connection_id,
                external_id=external_id,
                title=title,
                mime_type=mime_type,
                url=url,
                size_bytes=size_bytes,
                raw_metadata=record,
                sync_status=SyncStatus.SYNCED,
                created_at=now,
                updated_at=now,
                last_modified_at=parsed_modified_at,
            )
            self.db.add(doc)

    async def trigger_manual_sync(self, connection_db_id: uuid.UUID, user_id: uuid.UUID) -> int:
        """Manually fetch records and list files from Google Drive.

        Two-pronged approach:
        1. Fetch Nango Records (Document + Folder models) for metadata
        2. List actual files from Google Drive API directly (catches files Nango missed)

        Returns the number of records synced.
        """
        result = await self.db.execute(
            select(NangoConnection).where(
                NangoConnection.id == connection_db_id,
                NangoConnection.user_id == user_id,
            )
        )
        conn = result.scalar_one_or_none()
        if not conn:
            raise HTTPException(status_code=404, detail="Connection not found")

        total = 0

        # Clear existing synced documents so stale files from old folder config are removed
        await self.db.execute(
            select(SyncedDocument).where(SyncedDocument.nango_connection_id == conn.id)
        )
        from sqlmodel import delete
        await self.db.execute(
            delete(SyncedDocument).where(SyncedDocument.nango_connection_id == conn.id)
        )

        # 1. Nango Records (documents only — folders handled by folder picker)
        records = await self._fetch_nango_records(
            conn.connection_id, "Document", conn.integration_id
        )
        for record in records:
            await self._upsert_synced_document(conn.id, record)
        total += len(records)

        # 2. Direct Drive API listing — respect configured folders
        try:
            metadata = await self.get_connection_metadata(conn.connection_id, conn.integration_id)
            configured_folders = metadata.get("folders") or metadata.get("files") or ["root"]
            logger.info("Syncing files from configured folders: %s", configured_folders)

            drive_files = await self.list_drive_files_recursive(
                conn.connection_id, conn.integration_id, folder_ids=configured_folders
            )
            for f in drive_files:
                record = {
                    "id": f["id"],
                    "name": f.get("name", "Untitled"),
                    "mimeType": f.get("mimeType"),
                    "webViewLink": f.get("webViewLink"),
                    "size": f.get("size"),
                    "modifiedTime": f.get("modifiedTime"),
                }
                await self._upsert_synced_document(conn.id, record)
            total += len(drive_files)
            logger.info("Drive API listed %d files for connection_id=%s", len(drive_files), conn.connection_id)
        except Exception:
            logger.warning(
                "Drive API file listing failed for connection_id=%s (non-fatal, Nango records still synced)",
                conn.connection_id,
                exc_info=True,
            )

        conn.last_sync_at = get_utcnow()
        await self.db.commit()
        logger.info("Manual sync: %d total records for connection_id=%s", total, conn.connection_id)
        return total

    async def get_connections_for_user(self, user_id: uuid.UUID) -> List[NangoConnection]:
        """Get all NangoConnections for a user."""
        result = await self.db.execute(
            select(NangoConnection).where(NangoConnection.user_id == user_id)
        )
        return list(result.scalars().all())

    FOLDER_MIME = "application/vnd.google-apps.folder"

    async def get_document_count(self, connection_id: uuid.UUID) -> int:
        """Get count of synced documents (excluding folders)."""
        result = await self.db.execute(
            select(func.count()).where(
                SyncedDocument.nango_connection_id == connection_id,
                SyncedDocument.mime_type != self.FOLDER_MIME,
            )
        )
        return result.scalar_one()

    async def get_documents_for_connection(
        self, connection_db_id: uuid.UUID
    ) -> List[SyncedDocument]:
        """Get all SyncedDocuments for a connection (excluding folders)."""
        result = await self.db.execute(
            select(SyncedDocument).where(
                SyncedDocument.nango_connection_id == connection_db_id,
                SyncedDocument.mime_type != self.FOLDER_MIME,
            )
        )
        return list(result.scalars().all())

    async def reset_document_status(
        self,
        connection_db_id: uuid.UUID,
        document_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        """Reset a document's sync_status back to SYNCED so it can be re-ingested."""
        result = await self.db.execute(
            select(NangoConnection).where(
                NangoConnection.id == connection_db_id,
                NangoConnection.user_id == user_id,
            )
        )
        conn = result.scalar_one_or_none()
        if not conn:
            raise HTTPException(status_code=404, detail="Connection not found")

        result = await self.db.execute(
            select(SyncedDocument).where(
                SyncedDocument.id == document_id,
                SyncedDocument.nango_connection_id == connection_db_id,
            )
        )
        doc = result.scalar_one_or_none()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        doc.sync_status = SyncStatus.SYNCED
        doc.updated_at = get_utcnow()
        await self.db.commit()
        logger.info("Reset document %s to SYNCED for connection %s", document_id, connection_db_id)

    async def delete_connection(self, connection_db_id: uuid.UUID, user_id: uuid.UUID) -> None:
        """Delete a NangoConnection locally and on Nango side."""
        result = await self.db.execute(
            select(NangoConnection).where(
                NangoConnection.id == connection_db_id,
                NangoConnection.user_id == user_id,
            )
        )
        conn = result.scalar_one_or_none()
        if not conn:
            raise HTTPException(status_code=404, detail="Connection not found")

        # Delete on Nango side
        try:
            async with httpx.AsyncClient() as client:
                await client.delete(
                    f"{self.base_url}/connection/{conn.connection_id}",
                    headers=self._headers(),
                    params={"provider_config_key": conn.integration_id},
                )
        except Exception:
            logger.warning("Failed to delete connection on Nango side: %s", conn.connection_id)

        # Delete locally (cascade deletes synced_documents)
        await self.db.delete(conn)
        await self.db.commit()

    async def proxy_file_download(self, connection_id: str, file_id: str) -> httpx.Response:
        """Proxy a file download from Google Drive via Nango."""
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.get(
                f"{self.base_url}/proxy/drive/v3/files/{file_id}",
                headers={
                    **self._headers(),
                    "Connection-Id": connection_id,
                    "Provider-Config-Key": "google-drive",
                },
                params={"alt": "media"},
                follow_redirects=True,
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail="Failed to download file")
            return resp

    async def export_google_workspace_file(
        self, connection_id: str, file_id: str, export_mime_type: str
    ) -> httpx.Response:
        """Export a Google Workspace file (Docs/Sheets/Slides) to a downloadable format."""
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.get(
                f"{self.base_url}/proxy/drive/v3/files/{file_id}/export",
                headers={
                    **self._headers(),
                    "Connection-Id": connection_id,
                    "Provider-Config-Key": "google-drive",
                },
                params={"mimeType": export_mime_type},
                follow_redirects=True,
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail="Failed to export file")
            return resp


async def get_nango_service(
    db: AsyncSession = Depends(get_async_db_session),
) -> NangoService:
    return NangoService(db)
