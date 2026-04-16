import datetime
from typing import List, Optional

from pydantic import BaseModel


class CreateConnectSessionRequest(BaseModel):
    integration_id: str = "google-drive"


class ConnectSessionResponse(BaseModel):
    session_token: str


class NangoConnectionResponse(BaseModel):
    id: str
    connection_id: str
    integration_id: str
    provider: str
    status: str
    last_sync_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    document_count: int = 0


class SyncedDocumentResponse(BaseModel):
    id: str
    external_id: str
    title: str
    mime_type: Optional[str] = None
    url: Optional[str] = None
    last_modified_at: Optional[datetime.datetime] = None
    size_bytes: Optional[int] = None
    sync_status: str


class ConnectionListResponse(BaseModel):
    connections: List[NangoConnectionResponse]


class SyncedDocumentListResponse(BaseModel):
    documents: List[SyncedDocumentResponse]


class DriveFolderResponse(BaseModel):
    id: str
    name: str
    parents: Optional[List[str]] = None


class FolderListResponse(BaseModel):
    folders: List[DriveFolderResponse]


class DriveFileResponse(BaseModel):
    id: str
    name: str
    mime_type: Optional[str] = None
    size: Optional[int] = None
    modified_time: Optional[str] = None


class DriveFileListResponse(BaseModel):
    files: List[DriveFileResponse]


class UpdateMetadataRequest(BaseModel):
    folder_ids: List[str]


class IngestDocumentsRequest(BaseModel):
    document_ids: List[str]


class IngestDocumentsResponse(BaseModel):
    results: dict[str, str]
    succeeded: int
    failed: int
