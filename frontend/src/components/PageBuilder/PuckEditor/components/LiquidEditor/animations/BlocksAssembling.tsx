import React from 'react';
import { Box, Typography, styled, keyframes } from '@mui/material';

// Changed to scale/fade animations instead of slide from sides
const scaleIn = keyframes`
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

const fadeInUp = keyframes`
  0% { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

const fadeInDown = keyframes`
  0% { transform: translateY(-20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
`;

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '24px',
});

const PageFrame = styled(Box)({
  width: '320px',
  height: '420px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1), 0 8px 24px rgba(0, 0, 0, 0.08)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid #e5e7eb',
});

const NavBlock = styled(Box)({
  height: '48px',
  backgroundColor: '#f8fafc',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  alignItems: 'center',
  padding: '0 16px',
  gap: '12px',
  animation: `${fadeInDown} 0.5s ease-out forwards`,
});

const NavDot = styled(Box)({
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  backgroundColor: '#d1d5db',
});

const NavLine = styled(Box)({
  height: '8px',
  borderRadius: '4px',
  backgroundColor: '#e5e7eb',
});

const HeroBlock = styled(Box)({
  height: '140px',
  margin: '16px',
  borderRadius: '8px',
  background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '12px',
  animation: `${scaleIn} 0.6s ease-out 0.2s both`,
});

const HeroLine = styled(Box)({
  height: '12px',
  borderRadius: '6px',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
});

const ContentRow = styled(Box)({
  display: 'flex',
  gap: '12px',
  padding: '0 16px',
  marginBottom: '12px',
});

const ContentBlock = styled(Box)<{ delay: number }>(({ delay }) => ({
  flex: 1,
  height: '80px',
  borderRadius: '8px',
  backgroundColor: '#f3f4f6',
  display: 'flex',
  flexDirection: 'column',
  padding: '12px',
  gap: '8px',
  animation: `${fadeInUp} 0.5s ease-out ${delay}s both`,
}));

const ContentLine = styled(Box)<{ width: string }>(({ width }) => ({
  height: '8px',
  width,
  borderRadius: '4px',
  backgroundColor: '#d1d5db',
  animation: `${pulse} 2s ease-in-out infinite`,
}));

const FooterBlock = styled(Box)({
  marginTop: 'auto',
  height: '48px',
  backgroundColor: '#1f2937',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '24px',
  animation: `${fadeInUp} 0.5s ease-out 0.9s both`,
});

const FooterLine = styled(Box)({
  height: '6px',
  width: '48px',
  borderRadius: '3px',
  backgroundColor: '#4b5563',
});

const Label = styled(Typography)({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#6b7280',
  marginTop: '8px',
});

interface BlocksAssemblingProps {
  isActive: boolean;
}

export const BlocksAssembling: React.FC<BlocksAssemblingProps> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <Container>
      <PageFrame>
        {/* Navigation */}
        <NavBlock>
          <NavDot />
          <NavDot />
          <NavDot />
          <Box sx={{ flex: 1 }} />
          <NavLine sx={{ width: '40px' }} />
          <NavLine sx={{ width: '40px' }} />
          <NavLine sx={{ width: '40px' }} />
        </NavBlock>

        {/* Hero Section */}
        <HeroBlock>
          <HeroLine sx={{ width: '180px' }} />
          <HeroLine sx={{ width: '120px' }} />
        </HeroBlock>

        {/* Content Blocks - now fade up instead of slide from sides */}
        <ContentRow>
          <ContentBlock delay={0.4}>
            <ContentLine width="80%" />
            <ContentLine width="60%" />
            <ContentLine width="70%" />
          </ContentBlock>
          <ContentBlock delay={0.5}>
            <ContentLine width="70%" />
            <ContentLine width="90%" />
            <ContentLine width="50%" />
          </ContentBlock>
        </ContentRow>

        <ContentRow>
          <ContentBlock delay={0.6}>
            <ContentLine width="60%" />
            <ContentLine width="80%" />
            <ContentLine width="40%" />
          </ContentBlock>
          <ContentBlock delay={0.7}>
            <ContentLine width="75%" />
            <ContentLine width="55%" />
            <ContentLine width="85%" />
          </ContentBlock>
        </ContentRow>

        {/* Footer */}
        <FooterBlock>
          <FooterLine />
          <FooterLine />
          <FooterLine />
        </FooterBlock>
      </PageFrame>

      <Label>Building page structure...</Label>
    </Container>
  );
};

export default BlocksAssembling;