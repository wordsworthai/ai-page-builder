import React from 'react';
import { Box, Typography, styled, keyframes } from '@mui/material';

const typewriter = keyframes`
  0% { width: 0; }
  100% { width: 100%; }
`;

const blink = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
`;

const fadeInUp = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const scaleIn = keyframes`
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '24px',
});

const PageFrame = styled(Box)({
  width: '360px',
  height: '440px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1), 0 8px 24px rgba(0, 0, 0, 0.08)',
  overflow: 'hidden',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  border: '1px solid #e5e7eb',
});

const HeadlineContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

const TypewriterLine = styled(Box)<{ delay: number; duration: number }>(
  ({ delay, duration }) => ({
    height: '24px',
    background: 'linear-gradient(90deg, #1f2937 0%, #374151 100%)',
    borderRadius: '4px',
    overflow: 'hidden',
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100%',
      width: '100%',
      backgroundColor: '#ffffff',
      animation: `${typewriter} ${duration}s ease-out ${delay}s forwards`,
      transformOrigin: 'right',
    },
  })
);

const Cursor = styled(Box)({
  display: 'inline-block',
  width: '2px',
  height: '20px',
  backgroundColor: '#a78bfa',
  marginLeft: '4px',
  animation: `${blink} 1s infinite`,
});

const ParagraphLine = styled(Box)<{ width: string; delay: number }>(
  ({ width, delay }) => ({
    height: '10px',
    width,
    borderRadius: '5px',
    background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
    backgroundSize: '200% 100%',
    animation: `${fadeInUp} 0.5s ease-out ${delay}s both, ${shimmer} 2s linear infinite`,
  })
);

const ImagePlaceholder = styled(Box)<{ delay: number }>(({ delay }) => ({
  width: '100%',
  height: '120px',
  borderRadius: '8px',
  background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 50%, #f3e8ff 100%)',
  backgroundSize: '200% 200%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: `${scaleIn} 0.6s ease-out ${delay}s both, ${shimmer} 3s linear infinite`,
}));

const ImageIcon = styled(Box)({
  width: '48px',
  height: '48px',
  borderRadius: '8px',
  backgroundColor: 'rgba(139, 92, 246, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#8b5cf6',
  fontSize: '24px',
});

const CardRow = styled(Box)({
  display: 'flex',
  gap: '12px',
});

const Card = styled(Box)<{ delay: number }>(({ delay }) => ({
  flex: 1,
  padding: '16px',
  borderRadius: '8px',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  animation: `${fadeInUp} 0.6s ease-out ${delay}s both`,
}));

const CardIcon = styled(Box)({
  width: '32px',
  height: '32px',
  borderRadius: '6px',
  background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
});

const CardLine = styled(Box)<{ width: string }>(({ width }) => ({
  height: '8px',
  width,
  borderRadius: '4px',
  backgroundColor: '#e5e7eb',
}));

const Label = styled(Typography)({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#6b7280',
  marginTop: '8px',
});

interface ContentFlowingProps {
  isActive: boolean;
}

export const ContentFlowing: React.FC<ContentFlowingProps> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <Container>
      <PageFrame>
        {/* Headline with typewriter effect */}
        <HeadlineContainer>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TypewriterLine delay={0} duration={1.5} sx={{ width: '85%' }} />
            <Cursor />
          </Box>
          <TypewriterLine delay={1.5} duration={1} sx={{ width: '60%', height: '16px' }} />
        </HeadlineContainer>

        {/* Paragraph lines */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <ParagraphLine width="100%" delay={2.5} />
          <ParagraphLine width="95%" delay={2.7} />
          <ParagraphLine width="88%" delay={2.9} />
          <ParagraphLine width="70%" delay={3.1} />
        </Box>

        {/* Image placeholder */}
        <ImagePlaceholder delay={3.5}>
          <ImageIcon>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </ImageIcon>
        </ImagePlaceholder>

        {/* Feature cards */}
        <CardRow>
          <Card delay={4.5}>
            <CardIcon />
            <CardLine width="80%" />
            <CardLine width="60%" />
          </Card>
          <Card delay={4.8}>
            <CardIcon />
            <CardLine width="70%" />
            <CardLine width="85%" />
          </Card>
          <Card delay={5.1}>
            <CardIcon />
            <CardLine width="75%" />
            <CardLine width="55%" />
          </Card>
        </CardRow>
      </PageFrame>

      <Label>Filling in content...</Label>
    </Container>
  );
};

export default ContentFlowing;