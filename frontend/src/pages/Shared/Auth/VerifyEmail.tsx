import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';
import { AuthService } from '@/client';
import { AuthCard } from '@/components/Shared';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  // ✅ Prevent multiple simultaneous requests
  const verificationAttempted = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }

      // ✅ Skip if already attempted
      if (verificationAttempted.current) {
        return;
      }
      verificationAttempted.current = true;

      try {
        const response = await AuthService.verifyEmailApiAuthVerifyEmailPost({
          token
        });
        setStatus('success');
        setMessage(response.message);
      } catch (error: any) {
        setStatus('error');
        const errorDetail = error.body?.detail;
        
        // ✅ Better error handling
        if (typeof errorDetail === 'string') {
          setMessage(errorDetail);
        } else if (errorDetail?.message) {
          setMessage(errorDetail.message);
        } else {
          setMessage('Verification failed. Token may be invalid or expired.');
        }
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <AuthCard>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            {status === 'loading' && (
              <>
                <CircularProgress size={60} sx={{ mb: 3 }} />
                <Typography variant="h5" gutterBottom>
                  Verifying Your Email...
                </Typography>
                <Typography color="text.secondary">
                  Please wait while we verify your email address
                </Typography>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle 
                  sx={{ fontSize: 80, color: 'success.main', mb: 2 }} 
                />
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                  Email Verified! ✅
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  {message}
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/dashboard?verified=true')}
                >
                  Go to Dashboard
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <Error 
                  sx={{ fontSize: 80, color: 'error.main', mb: 2 }} 
                />
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                  Verification Failed ❌
                </Typography>
                <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                  {message}
                </Alert>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/login')}
                  >
                    Go to Login
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/signup')}
                  >
                    Sign Up Again
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </AuthCard>
      </Container>
    </Box>
  );
}
