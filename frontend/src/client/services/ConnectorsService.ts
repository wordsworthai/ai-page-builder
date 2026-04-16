/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConnectionListResponse } from '../models/ConnectionListResponse';
import type { ConnectSessionResponse } from '../models/ConnectSessionResponse';
import type { CreateConnectSessionRequest } from '../models/CreateConnectSessionRequest';
import type { DriveFileListResponse } from '../models/DriveFileListResponse';
import type { FolderListResponse } from '../models/FolderListResponse';
import type { IngestDocumentsRequest } from '../models/IngestDocumentsRequest';
import type { IngestDocumentsResponse } from '../models/IngestDocumentsResponse';
import type { SyncedDocumentListResponse } from '../models/SyncedDocumentListResponse';
import type { UpdateMetadataRequest } from '../models/UpdateMetadataRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ConnectorsService {
    /**
     * Create Connect Session
     * Create a Nango Connect session token for the frontend Connect UI.
     * @param requestBody
     * @returns ConnectSessionResponse Successful Response
     * @throws ApiError
     */
    public static createConnectSessionApiConnectorsNangoConnectSessionPost(
        requestBody: CreateConnectSessionRequest,
    ): CancelablePromise<ConnectSessionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/connectors/nango/connect-session',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Receive Webhook
     * Receive Nango webhooks (auth + sync). Verified by HMAC signature.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static receiveWebhookApiConnectorsNangoWebhooksPost(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/connectors/nango/webhooks',
        });
    }
    /**
     * List Connections
     * List all Nango connections for the current user.
     * @returns ConnectionListResponse Successful Response
     * @throws ApiError
     */
    public static listConnectionsApiConnectorsNangoConnectionsGet(): CancelablePromise<ConnectionListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/connectors/nango/connections',
        });
    }
    /**
     * Delete Connection
     * Delete a Nango connection and its synced documents.
     * @param connectionId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteConnectionApiConnectorsNangoConnectionsConnectionIdDelete(
        connectionId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/connectors/nango/connections/{connection_id}',
            path: {
                'connection_id': connectionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Documents
     * List synced documents for a connection.
     * @param connectionId
     * @returns SyncedDocumentListResponse Successful Response
     * @throws ApiError
     */
    public static listDocumentsApiConnectorsNangoConnectionsConnectionIdDocumentsGet(
        connectionId: string,
    ): CancelablePromise<SyncedDocumentListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/connectors/nango/connections/{connection_id}/documents',
            path: {
                'connection_id': connectionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Trigger Sync
     * Manually pull latest records from Nango for this connection.
     * @param connectionId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static triggerSyncApiConnectorsNangoConnectionsConnectionIdSyncPost(
        connectionId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/connectors/nango/connections/{connection_id}/sync',
            path: {
                'connection_id': connectionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Folders
     * List Google Drive folders for a connection (used by folder picker).
     * @param connectionId
     * @param parentId
     * @returns FolderListResponse Successful Response
     * @throws ApiError
     */
    public static listFoldersApiConnectorsNangoConnectionsConnectionIdFoldersGet(
        connectionId: string,
        parentId: string = 'root',
    ): CancelablePromise<FolderListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/connectors/nango/connections/{connection_id}/folders',
            path: {
                'connection_id': connectionId,
            },
            query: {
                'parent_id': parentId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Folder Files
     * List files (non-folders) inside a Google Drive folder.
     * @param connectionId
     * @param parentId
     * @returns DriveFileListResponse Successful Response
     * @throws ApiError
     */
    public static listFolderFilesApiConnectorsNangoConnectionsConnectionIdFolderFilesGet(
        connectionId: string,
        parentId: string = 'root',
    ): CancelablePromise<DriveFileListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/connectors/nango/connections/{connection_id}/folder-files',
            path: {
                'connection_id': connectionId,
            },
            query: {
                'parent_id': parentId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Connection Metadata
     * Update Nango connection metadata with selected folder IDs.
     * @param connectionId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static updateConnectionMetadataApiConnectorsNangoConnectionsConnectionIdMetadataPatch(
        connectionId: string,
        requestBody: UpdateMetadataRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/connectors/nango/connections/{connection_id}/metadata',
            path: {
                'connection_id': connectionId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Reset Document Status
     * Reset a document's status to 'synced' so it can be re-ingested.
     * @param connectionId
     * @param documentId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static resetDocumentStatusApiConnectorsNangoConnectionsConnectionIdDocumentsDocumentIdResetPost(
        connectionId: string,
        documentId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/connectors/nango/connections/{connection_id}/documents/{document_id}/reset',
            path: {
                'connection_id': connectionId,
                'document_id': documentId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Ingest Documents
     * Download selected documents from connector and ingest into RAGFlow.
     * @param connectionId
     * @param requestBody
     * @returns IngestDocumentsResponse Successful Response
     * @throws ApiError
     */
    public static ingestDocumentsApiConnectorsNangoConnectionsConnectionIdIngestPost(
        connectionId: string,
        requestBody: IngestDocumentsRequest,
    ): CancelablePromise<IngestDocumentsResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/connectors/nango/connections/{connection_id}/ingest',
            path: {
                'connection_id': connectionId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Proxy File
     * Proxy file download from Google Drive via Nango.
     * @param connectionId
     * @param fileId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static proxyFileApiConnectorsNangoConnectionsConnectionIdFilesFileIdGet(
        connectionId: string,
        fileId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/connectors/nango/connections/{connection_id}/files/{file_id}',
            path: {
                'connection_id': connectionId,
                'file_id': fileId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
