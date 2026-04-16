import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { Close, ConfirmationNumber } from '@mui/icons-material';
import { format } from 'date-fns';
import { useSupportTickets, SupportTicket } from '@/hooks/api/Shared/Support/useSupportTickets';

interface SupportTicketsModalProps {
  open: boolean;
  onClose: () => void;
}

const SupportTicketsModal: React.FC<SupportTicketsModalProps> = ({ open, onClose }) => {
  const { data, isLoading, isError, error } = useSupportTickets();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return { backgroundColor: '#E3F2FD', color: '#1976D2' };
      case 'in_progress':
        return { backgroundColor: '#FFF3E0', color: '#F57C00' };
      case 'resolved':
        return { backgroundColor: '#E8F5E9', color: '#2E7D32' };
      case 'closed':
        return { backgroundColor: '#F5F5F5', color: '#616161' };
      default:
        return { backgroundColor: '#F5F5F5', color: '#616161' };
    }
  };

  const renderTicketCard = (ticket: SupportTicket) => {
    const statusStyle = getStatusColor(ticket.status);
    
    return (
      <Card
        key={ticket.ticket_id}
        sx={{
          mb: 2,
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-2px)',
          },
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ConfirmationNumber sx={{ fontSize: 18, color: '#8067E6' }} />
                <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.75rem' }}>
                  #{ticket.ticket_id.slice(-8)}
                </Typography>
              </Box>
              {ticket.subject && (
                <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                  {ticket.subject}
                </Typography>
              )}
              {ticket.category && (
                <Chip
                  label={ticket.category}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.75rem',
                    backgroundColor: '#F3F4F6',
                    color: '#374151'
                  }}
                />
              )}
            </Box>
            <Chip
              label={ticket.status.replace('_', ' ').toUpperCase()}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.75rem',
                fontWeight: 600,
                ...statusStyle,
              }}
            />
          </Box>

          <Typography
            variant="body2"
            color="text.primary"
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {ticket.message}
          </Typography>

          {ticket.screenshot_url && (
            <Box
              component="img"
              src={ticket.screenshot_url}
              alt="Screenshot"
              sx={{
                width: '100%',
                maxHeight: 150,
                objectFit: 'cover',
                borderRadius: '8px',
                mb: 1,
                border: '1px solid #E5E7EB',
              }}
            />
          )}

          <Divider sx={{ mb: 1 }} />
          
          <Typography variant="caption" color="text.primary">
            Submitted on {format(new Date(ticket.created_at), 'MMM dd, yyyy hh:mm a')}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          maxHeight: '85vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <Typography variant="h4" fontWeight={600}>
          My Support Tickets
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            color: '#9E9E9E',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
            },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          padding: '24px',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#F5F5F5',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#E0E0E0',
            borderRadius: '4px',
          },
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#8067E6' }} />
          </Box>
        ) : isError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error instanceof Error ? error.message : 'Failed to load support tickets. Please try again.'}
          </Alert>
        ) : data && data.tickets.length > 0 ? (
          <Box>
            <Box sx={{ mb: 2, mt: 2}}>
              <Typography variant="body2" color="text.primary">
                Showing {data.total_count} ticket{data.total_count !== 1 ? 's' : ''}
              </Typography>
            </Box>
            {data.tickets.map(renderTicketCard)}
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
            }}
          >
            <ConfirmationNumber sx={{ fontSize: 64, color: '#E0E0E0', mb: 2 }} />
            <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>
              No support tickets yet
            </Typography>
            <Typography variant="body2" color="text.primary" textAlign="center">
              When you submit a support request, it will appear here.
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SupportTicketsModal;
