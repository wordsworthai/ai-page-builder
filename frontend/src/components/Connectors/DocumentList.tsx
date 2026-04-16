import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  IconButton,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNangoDocuments, useIngestDocuments, useResetDocumentStatus, SyncedDocument } from '@/hooks/api/Connectors';

interface DocumentListProps {
  connectionId: string | null;
}

const INGESTABLE_MIMES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/html',
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.spreadsheet',
  'application/vnd.google-apps.presentation',
]);

function isIngestable(doc: SyncedDocument): boolean {
  if (doc.sync_status === 'ingested' || doc.sync_status === 'ingesting') return false;
  return !!doc.mime_type && INGESTABLE_MIMES.has(doc.mime_type);
}

function formatBytes(bytes: number | null): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function friendlyType(mimeType: string | null): string {
  if (!mimeType) return '—';
  const map: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'application/vnd.google-apps.document': 'Google Doc',
    'application/vnd.google-apps.spreadsheet': 'Google Sheet',
    'application/vnd.google-apps.presentation': 'Google Slides',
    'text/plain': 'Text',
    'text/markdown': 'Markdown',
    'text/csv': 'CSV',
    'text/html': 'HTML',
    'application/vnd.google.colaboratory': 'Colab',
  };
  return map[mimeType] || mimeType.split('/').pop() || '—';
}

function statusChip(status: string) {
  const colorMap: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    synced: 'default',
    ingesting: 'info',
    ingested: 'success',
    ingest_failed: 'error',
    pending: 'warning',
    error: 'error',
  };
  return (
    <Chip
      label={status}
      size="small"
      color={colorMap[status] || 'default'}
      variant="outlined"
    />
  );
}

const DocumentList: React.FC<DocumentListProps> = ({ connectionId }) => {
  const { data: documents, isLoading, error } = useNangoDocuments(connectionId);
  const { mutate: ingestDocs, isPending: isIngesting } = useIngestDocuments();
  const { mutate: resetDoc, isPending: isResetting } = useResetDocumentStatus();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const ingestableFiles = useMemo(
    () => (documents || []).filter(isIngestable),
    [documents],
  );

  if (!connectionId) return <Typography color="text.secondary">Select a connection to view documents.</Typography>;
  if (isLoading) return <CircularProgress size={24} />;
  if (error) return <Typography color="error">Failed to load documents</Typography>;
  if (!documents?.length) {
    return (
      <Typography color="text.secondary">
        No files synced yet. Use the gear icon to configure folders, then sync.
      </Typography>
    );
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === ingestableFiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ingestableFiles.map((d) => d.id)));
    }
  };

  const handleIngest = () => {
    if (!connectionId || selectedIds.size === 0) return;
    ingestDocs(
      { connectionId, documentIds: Array.from(selectedIds) },
      { onSuccess: () => setSelectedIds(new Set()) },
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Button
          variant="contained"
          size="small"
          startIcon={isIngesting ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
          onClick={handleIngest}
          disabled={selectedIds.size === 0 || isIngesting}
        >
          {isIngesting ? 'Ingesting...' : `Ingest Selected (${selectedIds.size})`}
        </Button>
        {selectedIds.size > 0 && (
          <Typography variant="caption" color="text.secondary">
            Files will be uploaded to the knowledge base for AI search.
          </Typography>
        )}
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  checked={selectedIds.size === ingestableFiles.length && ingestableFiles.length > 0}
                  indeterminate={selectedIds.size > 0 && selectedIds.size < ingestableFiles.length}
                  onChange={toggleSelectAll}
                />
              </TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Size</TableCell>
              <TableCell>Last Modified</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((doc: SyncedDocument) => {
              const canIngest = isIngestable(doc);
              return (
                <TableRow key={doc.id}>
                  <TableCell padding="checkbox">
                    {canIngest ? (
                      <Checkbox
                        size="small"
                        checked={selectedIds.has(doc.id)}
                        onChange={() => toggleSelect(doc.id)}
                        disabled={isIngesting}
                      />
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {doc.url ? (
                      <Link href={doc.url} target="_blank" rel="noopener">
                        {doc.title}
                      </Link>
                    ) : (
                      doc.title
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {friendlyType(doc.mime_type)}
                    </Typography>
                  </TableCell>
                  <TableCell>{statusChip(doc.sync_status)}</TableCell>
                  <TableCell align="right">{formatBytes(doc.size_bytes)}</TableCell>
                  <TableCell>
                    {doc.last_modified_at
                      ? new Date(doc.last_modified_at).toLocaleString()
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {doc.sync_status === 'ingested' && connectionId && (
                      <Tooltip title="Re-sync (allow re-ingestion)">
                        <IconButton
                          size="small"
                          onClick={() => resetDoc({ connectionId, documentId: doc.id })}
                          disabled={isResetting}
                        >
                          <RefreshIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DocumentList;
