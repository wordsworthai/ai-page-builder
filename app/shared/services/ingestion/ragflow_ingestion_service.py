"""RAGFlow document ingestion — upload files to datasets and trigger parsing."""

import logging
from typing import Any, Dict, List, Optional, Tuple

import httpx

from app.core.config import config

logger = logging.getLogger(__name__)

SUPPORTED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  # .xlsx
    "text/plain",
    "text/markdown",
    "text/csv",
    "text/html",
}

# Google Workspace types that need export (not direct download)
GOOGLE_EXPORT_MIME_MAP = {
    "application/vnd.google-apps.document": "application/pdf",
    "application/vnd.google-apps.spreadsheet": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.google-apps.presentation": "application/pdf",
}


class RagflowIngestionService:
    """Handles uploading documents to RAGFlow datasets and triggering parsing.

    Provider-agnostic — accepts raw file bytes, doesn't know about Nango/Google/Dropbox.
    """

    def __init__(self):
        self.base_url = config.ragflow_base_url.rstrip("/")
        self.api_key = config.ragflow_api_key
        self.dataset_id = config.ragflow_dataset_ids.split(",")[0].strip()

    def _headers(self) -> Dict[str, str]:
        return {"Authorization": f"Bearer {self.api_key}"}

    async def upload_document(
        self,
        filename: str,
        file_bytes: bytes,
        content_type: str = "application/octet-stream",
        dataset_id: Optional[str] = None,
    ) -> Tuple[bool, Optional[str], str]:
        """Upload a file to a RAGFlow dataset.

        Returns (success, ragflow_doc_id, message).
        """
        ds_id = dataset_id or self.dataset_id
        if not ds_id:
            return False, None, "No RAGFlow dataset_id configured"

        url = f"{self.base_url}/api/v1/datasets/{ds_id}/documents"

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                url,
                headers=self._headers(),
                files={"file": (filename, file_bytes, content_type)},
            )

        if resp.status_code != 200:
            msg = f"RAGFlow upload HTTP {resp.status_code}: {resp.text[:200]}"
            logger.error(msg)
            return False, None, msg

        data = resp.json()
        if data.get("code") != 0:
            msg = data.get("message", "Unknown RAGFlow error")
            logger.error("RAGFlow upload failed: %s", msg)
            return False, None, msg

        doc_id = data["data"][0]["id"]
        logger.info("Uploaded '%s' to RAGFlow dataset=%s doc_id=%s", filename, ds_id, doc_id)
        return True, doc_id, "ok"

    async def trigger_parsing(
        self,
        doc_ids: List[str],
        dataset_id: Optional[str] = None,
    ) -> Tuple[bool, str]:
        """Trigger parsing for uploaded documents. Returns (success, message)."""
        ds_id = dataset_id or self.dataset_id
        url = f"{self.base_url}/api/v1/datasets/{ds_id}/chunks"

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                url,
                headers={**self._headers(), "Content-Type": "application/json"},
                json={"document_ids": doc_ids},
            )

        data = resp.json()
        if data.get("code") != 0:
            msg = data.get("message", "Parse trigger failed")
            logger.error("RAGFlow trigger_parsing failed: %s", msg)
            return False, msg

        logger.info("Triggered parsing for %d documents in dataset=%s", len(doc_ids), ds_id)
        return True, "ok"

    async def get_document_status(
        self,
        dataset_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Get parsing status for all documents in a dataset."""
        ds_id = dataset_id or self.dataset_id
        url = f"{self.base_url}/api/v1/datasets/{ds_id}/documents"

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                url,
                headers=self._headers(),
                params={"limit": 100},
            )

        if resp.status_code != 200:
            logger.error("RAGFlow get_document_status failed: %s", resp.text[:200])
            return []

        data = resp.json()
        return data.get("data", {}).get("docs", [])

    @staticmethod
    def is_ingestable_mime_type(mime_type: Optional[str]) -> bool:
        """Check if a mime type can be ingested into RAGFlow."""
        if not mime_type:
            return False
        return mime_type in SUPPORTED_MIME_TYPES or mime_type in GOOGLE_EXPORT_MIME_MAP

    @staticmethod
    def needs_google_export(mime_type: Optional[str]) -> bool:
        """Check if this is a Google Workspace file that needs export."""
        return mime_type in GOOGLE_EXPORT_MIME_MAP if mime_type else False

    @staticmethod
    def get_export_mime_type(google_mime_type: str) -> str:
        """Get the export format for a Google Workspace file."""
        return GOOGLE_EXPORT_MIME_MAP.get(google_mime_type, "application/pdf")
