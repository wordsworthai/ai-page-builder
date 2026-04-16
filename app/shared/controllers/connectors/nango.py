"""Nango connector controller — Connect UI sessions, webhooks, connections, documents."""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response

from app.shared.schemas.auth.auth import CurrentUserResponse
from app.shared.schemas.connectors.nango import (
    ConnectionListResponse,
    ConnectSessionResponse,
    CreateConnectSessionRequest,
    DriveFileListResponse,
    DriveFileResponse,
    DriveFolderResponse,
    FolderListResponse,
    IngestDocumentsRequest,
    IngestDocumentsResponse,
    NangoConnectionResponse,
    SyncedDocumentListResponse,
    SyncedDocumentResponse,
    UpdateMetadataRequest,
)
from app.shared.services.auth.users_service import get_current_user
from app.shared.services.ingestion.ingestion_service import IngestionService, get_ingestion_service
from app.shared.services.connectors.nango_service import NangoService, get_nango_service

logger = logging.getLogger(__name__)

nango_router = APIRouter(prefix="/api/connectors/nango", tags=["connectors"])


@nango_router.post("/connect-session", response_model=ConnectSessionResponse)
async def create_connect_session(
    body: CreateConnectSessionRequest,
    current_user: CurrentUserResponse = Depends(get_current_user),
    service: NangoService = Depends(get_nango_service),
):
    """Create a Nango Connect session token for the frontend Connect UI."""
    token = await service.create_connect_session(
        user_id=current_user.user_id,
        email=current_user.email,
        business_id=current_user.business_id or current_user.user_id,
        integration_id=body.integration_id,
    )
    return ConnectSessionResponse(session_token=token)


@nango_router.post("/webhooks")
async def receive_webhook(
    request: Request,
    service: NangoService = Depends(get_nango_service),
):
    """Receive Nango webhooks (auth + sync). Verified by HMAC signature."""
    body_bytes = await request.body()
    signature = request.headers.get("x-nango-signature", "")

    if not service.verify_webhook_signature(body_bytes, signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    payload = await request.json()
    event_type = payload.get("type", "")

    if event_type in ("auth", "auth.new_connection"):
        await service.handle_auth_webhook(payload)
    elif event_type in ("sync", "sync.completed"):
        await service.handle_sync_webhook(payload)
    else:
        logger.info("Unhandled Nango webhook type: %s", event_type)

    return {"status": "ok"}


@nango_router.get("/connections", response_model=ConnectionListResponse)
async def list_connections(
    current_user: CurrentUserResponse = Depends(get_current_user),
    service: NangoService = Depends(get_nango_service),
):
    """List all Nango connections for the current user."""
    user_id = uuid.UUID(current_user.user_id)
    connections = await service.get_connections_for_user(user_id)

    items = []
    for conn in connections:
        doc_count = await service.get_document_count(conn.id)
        items.append(
            NangoConnectionResponse(
                id=str(conn.id),
                connection_id=conn.connection_id,
                integration_id=conn.integration_id,
                provider=conn.provider,
                status=conn.status.value,
                last_sync_at=conn.last_sync_at,
                created_at=conn.created_at,
                document_count=doc_count,
            )
        )

    return ConnectionListResponse(connections=items)


@nango_router.delete("/connections/{connection_id}")
async def delete_connection(
    connection_id: uuid.UUID,
    current_user: CurrentUserResponse = Depends(get_current_user),
    service: NangoService = Depends(get_nango_service),
):
    """Delete a Nango connection and its synced documents."""
    user_id = uuid.UUID(current_user.user_id)
    await service.delete_connection(connection_id, user_id)
    return {"status": "deleted"}


@nango_router.get(
    "/connections/{connection_id}/documents",
    response_model=SyncedDocumentListResponse,
)
async def list_documents(
    connection_id: uuid.UUID,
    current_user: CurrentUserResponse = Depends(get_current_user),
    service: NangoService = Depends(get_nango_service),
):
    """List synced documents for a connection."""
    # Verify ownership
    user_id = uuid.UUID(current_user.user_id)
    connections = await service.get_connections_for_user(user_id)
    if not any(c.id == connection_id for c in connections):
        raise HTTPException(status_code=404, detail="Connection not found")

    docs = await service.get_documents_for_connection(connection_id)
    return SyncedDocumentListResponse(
        documents=[
            SyncedDocumentResponse(
                id=str(d.id),
                external_id=d.external_id,
                title=d.title,
                mime_type=d.mime_type,
                url=d.url,
                last_modified_at=d.last_modified_at,
                size_bytes=d.size_bytes,
                sync_status=d.sync_status.value,
            )
            for d in docs
        ]
    )


@nango_router.post("/connections/{connection_id}/sync")
async def trigger_sync(
    connection_id: uuid.UUID,
    current_user: CurrentUserResponse = Depends(get_current_user),
    service: NangoService = Depends(get_nango_service),
):
    """Manually pull latest records from Nango for this connection."""
    user_id = uuid.UUID(current_user.user_id)
    count = await service.trigger_manual_sync(connection_id, user_id)
    return {"status": "synced", "records_synced": count}


@nango_router.get(
    "/connections/{connection_id}/folders",
    response_model=FolderListResponse,
)
async def list_folders(
    connection_id: uuid.UUID,
    parent_id: str = "root",
    current_user: CurrentUserResponse = Depends(get_current_user),
    service: NangoService = Depends(get_nango_service),
):
    """List Google Drive folders for a connection (used by folder picker)."""
    user_id = uuid.UUID(current_user.user_id)
    connections = await service.get_connections_for_user(user_id)
    conn = next((c for c in connections if c.id == connection_id), None)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    raw_folders = await service.list_drive_folders(
        conn.connection_id, conn.integration_id, parent_id
    )
    return FolderListResponse(
        folders=[
            DriveFolderResponse(
                id=f["id"],
                name=f["name"],
                parents=f.get("parents"),
            )
            for f in raw_folders
        ]
    )


@nango_router.get(
    "/connections/{connection_id}/folder-files",
    response_model=DriveFileListResponse,
)
async def list_folder_files(
    connection_id: uuid.UUID,
    parent_id: str = "root",
    current_user: CurrentUserResponse = Depends(get_current_user),
    service: NangoService = Depends(get_nango_service),
):
    """List files (non-folders) inside a Google Drive folder."""
    user_id = uuid.UUID(current_user.user_id)
    connections = await service.get_connections_for_user(user_id)
    conn = next((c for c in connections if c.id == connection_id), None)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    raw_files = await service.list_drive_files(
        conn.connection_id, conn.integration_id, parent_id
    )
    return DriveFileListResponse(
        files=[
            DriveFileResponse(
                id=f["id"],
                name=f.get("name", "Untitled"),
                mime_type=f.get("mimeType"),
                size=int(f["size"]) if f.get("size") else None,
                modified_time=f.get("modifiedTime"),
            )
            for f in raw_files
        ]
    )


@nango_router.patch("/connections/{connection_id}/metadata")
async def update_connection_metadata(
    connection_id: uuid.UUID,
    body: UpdateMetadataRequest,
    current_user: CurrentUserResponse = Depends(get_current_user),
    service: NangoService = Depends(get_nango_service),
):
    """Update Nango connection metadata with selected folder IDs."""
    user_id = uuid.UUID(current_user.user_id)
    await service.update_connection_folder_metadata(connection_id, user_id, body.folder_ids)
    return {"status": "updated"}


@nango_router.post("/connections/{connection_id}/documents/{document_id}/reset")
async def reset_document_status(
    connection_id: uuid.UUID,
    document_id: uuid.UUID,
    current_user: CurrentUserResponse = Depends(get_current_user),
    service: NangoService = Depends(get_nango_service),
):
    """Reset a document's status to 'synced' so it can be re-ingested."""
    user_id = uuid.UUID(current_user.user_id)
    await service.reset_document_status(connection_id, document_id, user_id)
    return {"status": "reset"}


@nango_router.post(
    "/connections/{connection_id}/ingest",
    response_model=IngestDocumentsResponse,
)
async def ingest_documents(
    connection_id: uuid.UUID,
    body: IngestDocumentsRequest,
    current_user: CurrentUserResponse = Depends(get_current_user),
    ingestion: IngestionService = Depends(get_ingestion_service),
):
    """Download selected documents from connector and ingest into RAGFlow."""
    user_id = uuid.UUID(current_user.user_id)
    results = await ingestion.ingest_documents(connection_id, user_id, body.document_ids)
    succeeded = sum(1 for v in results.values() if v == "ok")
    return IngestDocumentsResponse(
        results=results,
        succeeded=succeeded,
        failed=len(results) - succeeded,
    )


@nango_router.get("/connections/{connection_id}/files/{file_id}")
async def proxy_file(
    connection_id: uuid.UUID,
    file_id: str,
    current_user: CurrentUserResponse = Depends(get_current_user),
    service: NangoService = Depends(get_nango_service),
):
    """Proxy file download from Google Drive via Nango."""
    # Verify ownership
    user_id = uuid.UUID(current_user.user_id)
    connections = await service.get_connections_for_user(user_id)
    conn = next((c for c in connections if c.id == connection_id), None)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    resp = await service.proxy_file_download(conn.connection_id, file_id)
    return Response(
        content=resp.content,
        media_type=resp.headers.get("content-type", "application/octet-stream"),
        headers={
            "Content-Disposition": resp.headers.get(
                "content-disposition", f'attachment; filename="{file_id}"'
            )
        },
    )
