import React, { useState } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import SyncIcon from '@mui/icons-material/Sync';
import {
  useNangoConnections,
  useDeleteConnection,
  useTriggerSync,
  NangoConnection,
} from '@/hooks/api/Connectors';
import DriveExplorerDialog from './DriveExplorerDialog';

interface ConnectionListProps {
  onSelectConnection: (connectionId: string) => void;
  selectedConnectionId: string | null;
}

const ConnectionList: React.FC<ConnectionListProps> = ({
  onSelectConnection,
  selectedConnectionId,
}) => {
  const { data: connections, isLoading, error } = useNangoConnections();
  const { mutate: deleteConnection, isPending: isDeleting } = useDeleteConnection();
  const { mutate: triggerSync, isPending: isSyncing } = useTriggerSync();
  const [configuringConnectionId, setConfiguringConnectionId] = useState<string | null>(null);

  if (isLoading) return <CircularProgress size={24} />;
  if (error) return <Typography color="error">Failed to load connections</Typography>;
  if (!connections?.length) return <Typography color="text.secondary">No connections yet.</Typography>;

  return (
    <>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Provider</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Documents</TableCell>
              <TableCell>Last Sync</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {connections.map((conn: NangoConnection) => (
              <TableRow
                key={conn.id}
                hover
                selected={conn.id === selectedConnectionId}
                onClick={() => onSelectConnection(conn.id)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{conn.provider || conn.integration_id}</TableCell>
                <TableCell>
                  <Chip
                    label={conn.status}
                    size="small"
                    color={conn.status === 'active' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="right">{conn.document_count}</TableCell>
                <TableCell>
                  {conn.last_sync_at
                    ? new Date(conn.last_sync_at).toLocaleString()
                    : '—'}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Sync now">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerSync(conn.id);
                        }}
                        disabled={isSyncing}
                      >
                        <SyncIcon
                          fontSize="small"
                          sx={isSyncing ? { animation: 'spin 1s linear infinite', '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } } } : undefined}
                        />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Configure folders">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfiguringConnectionId(conn.id);
                        }}
                      >
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConnection(conn.id);
                      }}
                      disabled={isDeleting}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {configuringConnectionId && (
        <DriveExplorerDialog
          open={!!configuringConnectionId}
          onClose={() => setConfiguringConnectionId(null)}
          connectionId={configuringConnectionId}
        />
      )}
    </>
  );
};

export default ConnectionList;
