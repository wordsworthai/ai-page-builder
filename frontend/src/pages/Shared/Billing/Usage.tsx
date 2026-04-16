import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
  CircularProgress,
  Button,
  styled,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DashboardV2Layout from '@/components/PageBuilder/Layouts/DashboardV2Layout';
import { useCreditsInfo, useCreditTransactions } from '@/hooks/api/Shared/Billing/useCredits';
import { AccountBalanceWallet, ShoppingCart, Payment } from '@mui/icons-material';

const CreditsDisplay = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(2),
  backgroundColor: 'rgba(142, 148, 242, 0.1)',
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

/** Display label for a transaction. Backend always sets description; fallback for legacy rows only. */
function getTransactionDisplayLabel(tx: { description?: string | null }): string {
  return tx.description?.trim() || 'Credit activity';
}

const Usage: React.FC = () => {
  const { data: transactions, isLoading } = useCreditTransactions(50);
  const { data: creditsInfo, isLoading: creditsLoading } = useCreditsInfo();
  const navigate = useNavigate();

  const currentCredits = creditsInfo?.balance ?? 0;
  const generationsAvailable = creditsInfo?.generations_available ?? 0;

  const handleBuyCredits = () => {
    navigate('/dashboard/billing');
  };

  return (
    <DashboardV2Layout>
      <Box
        sx={{
          maxWidth: 'xl',
          mx: 'auto',
          width: '100%',
          padding: '30px',
          marginTop: '3vh',
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Usage & Credit Activity
          </Typography>
        </Box>

        {/* Credit Balance Section */}
        <Box sx={{ marginTop: 2, mb: 3 }}>
          <CreditsDisplay gap={4}>
            <AccountBalanceWallet sx={{ color: '#8E94F2', fontSize: 32 }} />
            <Box>
              <Typography variant="h4" fontWeight={600} color="primary.main">
                {currentCredits.toLocaleString()} credits available • {generationsAvailable} generation{generationsAvailable !== 1 ? 's' : ''} remaining
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, ml: 'auto', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<Payment />}
                onClick={() => navigate('/dashboard/billing')}
              >
                Billing & Plans
              </Button>
              <Button
                variant="outlined"
                startIcon={<ShoppingCart />}
                onClick={handleBuyCredits}
                sx={{ 
                  color: 'white', 
                  backgroundColor: "#8E94F2",
                  '&:hover': {
                    color: 'white',
                    backgroundColor: "#8E94F2",
                  }
                }}
              >
                Buy Credits
              </Button>
            </Box>
          </CreditsDisplay>
        </Box>

        {/* Recent Credit Activity */}
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : transactions && transactions.transactions && transactions.transactions.length > 0 ? (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Recent Credit Activity
            </Typography>
            <Card sx={{ borderRadius: 2, boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
              <CardContent
                sx={{
                  maxHeight: '60vh',
                  overflowY: 'auto',
                  padding: 2,
                }}
              >
                {transactions.transactions.map((tx: any, index: number) => (
                  <Box key={tx.transaction_id || index}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" py={1.5}>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {getTransactionDisplayLabel(tx)}
                        </Typography>
                        <Typography variant="caption" color="text.primary">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${tx.credits_change > 0 ? '+' : ''}${tx.credits_change}`}
                        color={tx.credits_change > 0 ? 'success' : 'default'}
                        size="medium"
                      />
                    </Box>
                    {index < transactions.transactions.length - 1 && <Divider />}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Recent Credit Activity
            </Typography>
            <Card sx={{ borderRadius: 2, boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                  No credit transactions found
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>
    </DashboardV2Layout>
  );
};

export default Usage;
