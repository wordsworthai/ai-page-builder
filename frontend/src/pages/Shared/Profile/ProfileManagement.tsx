import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  TextField,
  Grid2 as Grid,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Edit,
  Delete,

  Support,
  CheckCircle,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import DashboardV2Layout from '@/components/PageBuilder/Layouts/DashboardV2Layout';
import { useCurrentUser } from '@/hooks/api/Shared/Auth/useCurrentUser';
import { useUserPlan } from '@/hooks/api/Shared/Billing/usePlans';
import { useUpdateProfile } from '@/hooks/api/Shared/Profile/useUpdateProfile';

import { useDeleteAccount } from '@/hooks/api/Shared/Profile/useDeleteAccount';
import { useCreditsBalance } from '@/hooks/api/Shared/Billing/useCredits';
import { useSupportTickets } from '@/hooks/api/Shared/Support/useSupportTickets';
import { useSnackBarContext } from '@/context/SnackBarContext';
import ContactDialog from '@/components/Shared/Dialogs/ContactDialog';
import SupportTicketsModal from '@/components/Shared/Dialogs/SupportTicketsModal';

const ProfileManagement: React.FC = () => {
  const navigate = useNavigate();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: planData, isLoading: planLoading } = useUserPlan();
  const { data: creditsBalance, isLoading: creditsLoading } = useCreditsBalance();
  const { data: supportTickets, isLoading: supportTicketsLoading } = useSupportTickets();
  const { mutate: updateProfile } = useUpdateProfile();
  const { createSnackBar } = useSnackBarContext();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTicketsModal, setShowTicketsModal] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);

  // Delete account state
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  // Delete account mutation
  const { mutateAsync: deleteAccount, isPending: isDeletingAccount } = useDeleteAccount();

  // Initialize edited name
  React.useEffect(() => {
    if (currentUser?.full_name) {
      setEditedName(currentUser.full_name);
    }
  }, [currentUser]);

  const handleSaveName = () => {
    if (editedName.trim() && editedName !== currentUser?.full_name) {
      updateProfile(
        { full_name: editedName },
        {
          onSuccess: () => {
            setIsEditingName(false);
          },
        }
      );
    } else {
      setIsEditingName(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      createSnackBar({
        content: 'Please type DELETE to confirm',
        severity: 'error',
        autoHide: true,
      });
      return;
    }

    // Check if password is required (for email/merged users)
    const requiresPassword = currentUser?.auth_provider !== 'google';
    if (requiresPassword && !deletePassword) {
      createSnackBar({
        content: 'Please enter your password to confirm deletion',
        severity: 'error',
        autoHide: true,
      });
      return;
    }

    try {
      await deleteAccount({
        confirmation: deleteConfirmation,
        password: requiresPassword ? deletePassword : undefined,
        reason: deleteReason || undefined,
      });
      
      createSnackBar({
        content: 'Account scheduled for deletion. Your data will be permanently removed after 30 days.',
        severity: 'success',
        autoHide: false,
      });
      
      // Redirect to home/login page after account deletion
      navigate('/');
    } catch (error: any) {
      const errorMessage = error?.body?.detail || 'Failed to delete account. Please try again.';
      createSnackBar({
        content: errorMessage,
        severity: 'error',
        autoHide: true,
      });
    }
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeleteConfirmation('');
    setDeletePassword('');
    setDeleteReason('');
  };

  const getInitials = (name: string) => {
    return name?.charAt(0).toUpperCase()+name?.charAt(1).toUpperCase();
  };

  const getAccountCreationDate = () => {
    // Since we don't have creation date in CurrentUserResponse, we'll show a placeholder
    // In production, this would come from the API
    return '2024';
  };

  const currentPlan = planData?.current_plan || 'Free';
  const planFeatures = planData?.plan_features || {};
  const subscription = planData?.subscription;

  // Support data from API
  const totalTickets = supportTickets?.total_count || 0;
  const averageResponseTime = supportTickets?.average_response_time || '2 hours';
  const latestTicket = supportTickets?.tickets?.[0] || null;

  if (userLoading) {
    return (
      <DashboardV2Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress sx={{ color: '#8067E6' }} />
        </Box>
      </DashboardV2Layout>
    );
  }

  return (
    <DashboardV2Layout>
      <Box sx={{ maxWidth: 'xl', mx: 'auto', width: '100%', padding: '30px', marginTop: '3vh' }}>
        {/* Page Title */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Profile Management
          </Typography>
        </Box>

        {/* Responsive card layout */}
        <Grid container spacing={3}>
          {/* Top Left - User Details */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{
                minHeight: 320,
                borderRadius: '12px',
                padding: 3,
                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto',
              }}
            >
              {/* User Profile Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    backgroundColor: '#8067E6',
                    fontSize: '2rem',
                    fontWeight: 700,
                  }}
                >
                  {getInitials(currentUser?.full_name || 'User')}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight={600} sx={{ mb: 0.5 }}>
                    {currentUser?.full_name || 'User'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" color="text.primary">
                      {currentUser?.email || 'N/A'}
                    </Typography>
                    {currentUser?.verified && (
                      <Chip
                        icon={<CheckCircle />}
                        label="Verified"
                        size="small"
                        sx={{
                          backgroundColor: '#E8F5E9',
                          color: '#2E7D32',
                          height: 24,
                          fontSize: '0.75rem',
                          borderColor: '#0BB623'
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => setIsEditingName(true)}
                  fullWidth
                  sx={{
                    borderColor: '#8067E6',
                    color: '#8067E6',
                    '&:hover': {
                      borderColor: '#8067E6',
                      backgroundColor: 'rgba(128, 103, 230, 0.08)',
                    },
                  }}
                >
                  Edit Name
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => setShowDeleteDialog(true)}
                  fullWidth
                  sx={{
                    borderColor: '#C62828',
                    color: '#C62828',
                    '&:hover': {
                      borderColor: '#B71C1C',
                      backgroundColor: 'rgba(198, 40, 40, 0.08)',
                    },
                  }}
                >
                  Delete Account
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Top Right - Billing and Usage */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{
                minHeight: 320,
                borderRadius: '12px',
                padding: 3,
                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto',
              }}
            >
              <Typography variant="h2" fontWeight={600} sx={{ mb: 4, color: '#8067E6' }}>
                Billing and Usage
              </Typography>

              {/* Credits, Plan, and Next Due Date */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2.5, mb: 1 }}>
                {/* Credits Available and Plan Type - Same Row */}
                <Box sx={{ display: 'flex', gap: 3 }}>
                  {/* Credits Available */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                      Credits Available
                    </Typography>
                    {creditsLoading ? (
                      <CircularProgress size={24} sx={{ color: '#8067E6' }} />
                    ) : (
                      <Typography variant="h4" fontWeight={700} sx={{ color: '#8067E6' }}>
                        {creditsBalance?.balance?.toLocaleString() || 0}
                      </Typography>
                    )}
                  </Box>

                  {/* Plan Type */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                      Plan Type
                    </Typography>
                    {planLoading ? (
                      <CircularProgress size={24} sx={{ color: '#8067E6' }} />
                    ) : (
                      <Typography variant="h5" fontWeight={600}>
                        {currentPlan}
                      </Typography>
                    )}
                  </Box>
                  {/* Next Due Date */}
                <Box>
                  <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                    Next Due Date
                  </Typography>
                  {planLoading ? (
                    <CircularProgress size={24} sx={{ color: '#8067E6' }} />
                  ) : subscription?.end_date ? (
                    <Typography variant="h6" fontWeight={500}>
                      {format(new Date(subscription.end_date), 'MMM dd, yyyy')}
                    </Typography>
                  ) : (
                    <Typography variant="h6" fontWeight={500} color="text.primary">
                      N/A
                    </Typography>
                  )}
                </Box>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 'auto' }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/dashboard/billing')}
                  fullWidth
                  sx={{
                    backgroundColor: '#8067E6',
                    '&:hover': {
                      backgroundColor: '#6B5AC8',
                    },
                  }}
                >
                  Manage Subscription
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/dashboard/usage')}
                  fullWidth
                  sx={{
                    borderColor: '#8067E6',
                    color: '#8067E6',
                    '&:hover': {
                      borderColor: '#8067E6',
                      backgroundColor: 'rgba(128, 103, 230, 0.08)',
                    },
                  }}
                >
                  Check Usage
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Bottom - Support */}
          <Grid size={{ xs: 12 }}>
            <Paper
              sx={{
                minHeight: 320,
                borderRadius: '12px',
                padding: 3,
                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto',
              }}
            >
              <Typography variant="h2" fontWeight={600} sx={{ mb: 3, color: '#8067E6' }}>
                Support
              </Typography>

              {/* Quick Stats */}
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 6 }}>
                    <Box>
                      <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                        Total Tickets Submitted
                      </Typography>
                      {supportTicketsLoading ? (
                        <CircularProgress size={24} sx={{ color: '#8067E6' }} />
                      ) : (
                        <Typography variant="h4" fontWeight={700} color="#8067E6">
                          {totalTickets}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box>
                      <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                        Avg. Response Time
                      </Typography>
                      {supportTicketsLoading ? (
                        <CircularProgress size={24} sx={{ color: '#8067E6' }} />
                      ) : (
                        <Typography variant="h4" fontWeight={700} color="#8067E6">
                          {averageResponseTime}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Box>


              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 'auto' }}>
                <Button
                  variant="contained"
                  onClick={() => setShowTicketsModal(true)}
                  fullWidth
                  sx={{
                    backgroundColor: '#8067E6',
                    '&:hover': {
                      backgroundColor: '#6B5AC8',
                    },
                  }}
                >
                  View Tickets
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Support />}
                  onClick={() => setShowContactDialog(true)}
                  fullWidth
                  sx={{
                    borderColor: '#8067E6',
                    color: '#8067E6',
                    '&:hover': {
                      borderColor: '#8067E6',
                      backgroundColor: 'rgba(128, 103, 230, 0.08)',
                    },
                  }}
                >
                  Contact Support
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Edit Name Dialog */}
        <Dialog open={isEditingName} onClose={() => setIsEditingName(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Name</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                label="Full Name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                fullWidth
                autoFocus
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setIsEditingName(false);
              setEditedName(currentUser?.full_name || '');
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveName}
              variant="contained"
              sx={{
                backgroundColor: '#8067E6',
                '&:hover': { backgroundColor: '#6B5AC8' },
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Account Dialog */}
        <Dialog open={showDeleteDialog} onClose={handleCloseDeleteDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ color: '#C62828' }}>Delete Account</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Alert severity="warning">
                This will schedule your account for deletion. Your data will be permanently removed after 30 days.
              </Alert>
              
              <Typography variant="body2" color="text.primary">
                All your websites, data, and settings will be permanently deleted after the 30-day retention period.
                If you change your mind, contact support within 30 days to recover your account.
              </Typography>

              {/* Password field for email/merged users */}
              {currentUser?.auth_provider !== 'google' && (
                <TextField
                  label="Enter your password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  fullWidth
                  required
                  helperText="Password required to confirm deletion"
                />
              )}

              {/* Confirmation field */}
              <TextField
                label="Type DELETE to confirm"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value.toUpperCase())}
                fullWidth
                required
                error={deleteConfirmation !== '' && deleteConfirmation !== 'DELETE'}
                helperText={deleteConfirmation !== '' && deleteConfirmation !== 'DELETE' ? 'Please type DELETE exactly' : ''}
              />

              {/* Optional reason */}
              <TextField
                label="Why are you leaving? (optional)"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                fullWidth
                multiline
                rows={2}
                placeholder="Your feedback helps us improve..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog} disabled={isDeletingAccount}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              variant="contained"
              color="error"
              disabled={
                isDeletingAccount || 
                deleteConfirmation !== 'DELETE' || 
                (currentUser?.auth_provider !== 'google' && !deletePassword)
              }
              sx={{
                backgroundColor: '#C62828',
                '&:hover': { backgroundColor: '#B71C1C' },
              }}
            >
              {isDeletingAccount ? 'Deleting...' : 'Delete My Account'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Support Tickets Modal */}
        <SupportTicketsModal
          open={showTicketsModal}
          onClose={() => setShowTicketsModal(false)}
        />

        {/* Contact Support Dialog */}
        <ContactDialog
          open={showContactDialog}
          onClose={() => setShowContactDialog(false)}
          currentUser={currentUser}
        />
      </Box>
    </DashboardV2Layout>
  );
};

export default ProfileManagement;
