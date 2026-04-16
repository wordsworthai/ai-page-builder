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
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FolderIcon from '@mui/icons-material/Folder';
import { useNangoFolders, useUpdateConnectionMetadata, useTriggerSync, DriveFolder } from '@/hooks/api/Connectors';

interface FolderPickerDialogProps {
  open: boolean;
  onClose: () => void;
  connectionId: string;
}

interface FolderNodeProps {
  connectionId: string;
  folder: DriveFolder;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}

const FolderNode: React.FC<FolderNodeProps> = ({ connectionId, folder, selectedIds, onToggle }) => {
  const [expanded, setExpanded] = useState(false);
  const { data: children, isLoading } = useNangoFolders(connectionId, folder.id, expanded);

  return (
    <>
      <ListItem disablePadding sx={{ pl: 1 }}>
        <IconButton
          size="small"
          onClick={() => setExpanded((prev) => !prev)}
          sx={{ mr: 0.5 }}
        >
          {expanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
        </IconButton>
        <Checkbox
          size="small"
          checked={selectedIds.has(folder.id)}
          onChange={() => onToggle(folder.id)}
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
            />
          ))}
        </Box>
      </Collapse>
    </>
  );
};

const FolderPickerDialog: React.FC<FolderPickerDialogProps> = ({ open, onClose, connectionId }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(['root']));
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
      // If specific folders are selected, remove "root"
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
          // Trigger sync after metadata update so files from new folders are fetched
          triggerSync(connectionId);
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Configure Sync Folders</DialogTitle>
      <DialogContent dividers sx={{ minHeight: 300, maxHeight: 500, p: 0 }}>
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
              />
            ))}
          </List>
        )}
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

export default FolderPickerDialog;
