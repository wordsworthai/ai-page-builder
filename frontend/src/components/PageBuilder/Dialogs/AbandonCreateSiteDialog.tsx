import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

interface AbandonCreateSiteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirmAbandon: () => void;
}

const AbandonCreateSiteDialog: React.FC<AbandonCreateSiteDialogProps> = ({
  open,
  onClose,
  onConfirmAbandon,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Abandon Site Creation?</DialogTitle>
      <DialogContent>
        <DialogContentText color='text.primary' >
          You have a website creation in progress. If you leave this page without
          upgrading, your progress will be lost and you'll need to start over.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Stay on Page
        </Button>
        <Button onClick={onConfirmAbandon} variant="contained" color="error">
          Abandon & Leave
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AbandonCreateSiteDialog;
