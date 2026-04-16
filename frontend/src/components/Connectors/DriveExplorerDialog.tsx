import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FolderIcon from '@mui/icons-material/Folder';
import {
  useNangoFolders,
  useUpdateConnectionMetadata,
  useTriggerSync,
  useDriveFolderFiles,
  DriveFolder,
  DriveFile,
} from '@/hooks/api/Connectors';

interface DriveExplorerDialogProps {
  open: boolean;
  onClose: () => void;
  connectionId: string;
}

interface FolderNodeProps {
  connectionId: string;
  folder: DriveFolder;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  highlightedFolderId: string;
  onHighlight: (id: string) => void;
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
  };
  return map[mimeType] || mimeType.split('/').pop() || '—';
}

const FolderNode: React.FC<FolderNodeProps> = ({
  connectionId,
  folder,
  selectedIds,
  onToggle,
  highlightedFolderId,
  onHighlight,
}) => {
  const [expanded, setExpanded] = useState(false);
  const { data: children, isLoading } = useNangoFolders(connectionId, folder.id, expanded);
  const isHighlighted = highlightedFolderId === folder.id;

  return (
    <>
      <ListItem
        disablePadding
        sx={{
          pl: 1,
          bgcolor: isHighlighted ? 'action.selected' : 'transparent',
          cursor: 'pointer',
        }}
        onClick={() => onHighlight(folder.id)}
      >
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((prev) => !prev);
          }}
          sx={{ mr: 0.5 }}
        >
          {expanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
        </IconButton>
        <Checkbox
          size="small"
          checked={selectedIds.has(folder.id)}
          onChange={(e) => {
            e.stopPropagation();
            onToggle(folder.id);
          }}
          onClick={(e) => e.stopPropagation()}
          sx={{ p: 0.5 }}
        />
        <ListItemIcon sx={{ minWidth: 28 }}>
          <FolderIcon fontSize="small" color="action" />
        </ListItemIcon>
        <ListItemText
          primary={folder.name}
          primaryTypographyProps={{ variant: 'body2', noWrap: true }}
        />
      </ListItem>
      <Collapse in={expanded} unmountOnExit>
        <Box sx={{ pl: 3 }}>
          {isLoading && (
            <Box sx={{ py: 1, pl: 2 }}>
              <CircularProgress size={16} />
            </Box>
          )}
          {children && children.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ pl: 2, py: 0.5 }}>
              No subfolders
            </Typography>
          )}
          {children?.map((child) => (
            <FolderNode
              key={child.id}
              connectionId={connectionId}
              folder={child}
              selectedIds={selectedIds}
              onToggle={onToggle}
              highlightedFolderId={highlightedFolderId}
              onHighlight={onHighlight}
            />
          ))}
        </Box>
      </Collapse>
    </>
  );
};

const FilePreviewPanel: React.FC<{ connectionId: string; folderId: string }> = ({
  connectionId,
  folderId,
}) => {
  const { data: files, isLoading } = useDriveFolderFiles(connectionId, folderId, true);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!files?.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
        No files in this folder.
      </Typography>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="right">Size</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {files.map((file: DriveFile) => (
            <TableRow key={file.id}>
              <TableCell>
                <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                  {file.name}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="caption" color="text.secondary">
                  {friendlyType(file.mime_type)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="caption">{formatBytes(file.size)}</Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const DriveExplorerDialog: React.FC<DriveExplorerDialogProps> = ({ open, onClose, connectionId }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(['root']));
  const [highlightedFolderId, setHighlightedFolderId] = useState('root');
  const { data: rootFolders, isLoading } = useNangoFolders(connectionId, 'root', open);
  const { mutate: updateMetadata, isPending: isSaving } = useUpdateConnectionMetadata();
  const { mutate: triggerSync } = useTriggerSync();

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      if (id !== 'root' && next.size > 0) {
        next.delete('root');
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(['root']));
  }, []);

  const handleSave = () => {
    const folderIds = selectedIds.size === 0 ? ['root'] : Array.from(selectedIds);
    updateMetadata(
      { connectionId, folderIds },
      {
        onSuccess: () => {
          triggerSync(connectionId);
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Browse & Select Folders</DialogTitle>
      <DialogContent dividers sx={{ p: 0, display: 'flex', minHeight: 400, maxHeight: 500 }}>
        {/* Left panel: folder tree */}
        <Box sx={{ width: 260, minWidth: 260, borderRight: 1, borderColor: 'divider', overflowY: 'auto' }}>
          <Box sx={{ px: 2, pt: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={selectedIds.has('root')}
                  onChange={handleSelectAll}
                  sx={{ p: 0.5 }}
                />
              }
              label={
                <Typography variant="body2" fontWeight={500}>
                  All Files (Root)
                </Typography>
              }
            />
          </Box>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List dense disablePadding>
              {rootFolders?.map((folder) => (
                <FolderNode
                  key={folder.id}
                  connectionId={connectionId}
                  folder={folder}
                  selectedIds={selectedIds}
                  onToggle={handleToggle}
                  highlightedFolderId={highlightedFolderId}
                  onHighlight={setHighlightedFolderId}
                />
              ))}
            </List>
          )}
        </Box>

        {/* Right panel: file preview */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <Typography variant="subtitle2" sx={{ px: 2, pt: 1.5, pb: 0.5, color: 'text.secondary' }}>
            Files in {highlightedFolderId === 'root' ? 'Root' : 'selected folder'}
          </Typography>
          <FilePreviewPanel connectionId={connectionId} folderId={highlightedFolderId} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving || selectedIds.size === 0}
        >
          {isSaving ? 'Saving...' : 'Save & Sync'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DriveExplorerDialog;
