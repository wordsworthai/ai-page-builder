import React from 'react';
import { Box, Typography, styled, keyframes } from '@mui/material';

const colorize = keyframes`
  0% { filter: grayscale(100%); opacity: 0.6; }
  50% { filter: grayscale(50%); opacity: 0.8; }
  100% { filter: grayscale(0%); opacity: 1; }
`;

const sparkle = keyframes`
  0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
  50% { transform: scale(1) rotate(180deg); opacity: 1; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const revealOverlay = keyframes`
  0% { clip-path: inset(0 100% 0 0); }
  100% { clip-path: inset(0 0 0 0); }
`;

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '24px',
});

const PageContainer = styled(Box)({
  position: 'relative',
  width: '340px',
  height: '440px',
});

const PageFrame = styled(Box)<{ colored?: boolean }>(({ colored }) => ({
  position: 'absolute',
  inset: 0,
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: colored 
    ? '0 20px 60px rgba(139, 92, 246, 0.15), 0 8px 24px rgba(0, 0, 0, 0.08)'
    : '0 20px 60px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid #e5e7eb',
  ...(colored && {
    animation: `${revealOverlay} 3s ease-out 1s forwards`,
    clipPath: 'inset(0 100% 0 0)',
  }),
  ...(!colored && {
    filter: 'grayscale(100%)',
    opacity: 0.7,
  }),
}));

const Header = styled(Box)<{ colored?: boolean }>(({ colored }) => ({
  height: '56px',
  background: colored 
    ? 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)'
    : '#9ca3af',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 20px',
}));

const Logo = styled(Box)({
  width: '80px',
  height: '24px',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  borderRadius: '4px',
});

const NavItems = styled(Box)({
  display: 'flex',
  gap: '16px',
});

const NavItem = styled(Box)({
  width: '48px',
  height: '8px',
  backgroundColor: 'rgba(255, 255, 255, 0.6)',
  borderRadius: '4px',
});

const Hero = styled(Box)<{ colored?: boolean }>(({ colored }) => ({
  height: '160px',
  margin: '20px',
  borderRadius: '12px',
  background: colored
    ? 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 50%, #ddd6fe 100%)'
    : '#e5e7eb',
  backgroundSize: '200% 200%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '12px',
  animation: colored ? `${float} 3s ease-in-out infinite, ${gradientShift} 4s ease infinite` : 'none',
}));

const HeroTitle = styled(Box)<{ colored?: boolean }>(({ colored }) => ({
  width: '180px',
  height: '20px',
  backgroundColor: colored ? '#7c3aed' : '#9ca3af',
  borderRadius: '4px',
}));

const HeroSubtitle = styled(Box)<{ colored?: boolean }>(({ colored }) => ({
  width: '140px',
  height: '12px',
  backgroundColor: colored ? '#a78bfa' : '#d1d5db',
  borderRadius: '4px',
}));

const Button = styled(Box)<{ colored?: boolean }>(({ colored }) => ({
  width: '100px',
  height: '32px',
  borderRadius: '16px',
  backgroundColor: colored ? '#8b5cf6' : '#9ca3af',
  marginTop: '8px',
}));

const ContentSection = styled(Box)({
  padding: '0 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
});

const FeatureCard = styled(Box)<{ colored?: boolean; index: number }>(
  ({ colored, index }) => ({
    height: '60px',
    borderRadius: '8px',
    backgroundColor: colored ? '#faf5ff' : '#f3f4f6',
    border: colored ? '1px solid #e9d5ff' : '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: '12px',
    animation: colored ? `${colorize} 1s ease-out ${1.5 + index * 0.3}s both` : 'none',
  })
);

const FeatureIcon = styled(Box)<{ colored?: boolean; hue: number }>(
  ({ colored, hue }) => ({
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: colored
      ? `linear-gradient(135deg, hsl(${hue}, 80%, 70%) 0%, hsl(${hue}, 80%, 60%) 100%)`
      : '#d1d5db',
    flexShrink: 0,
  })
);

const FeatureLines = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  flex: 1,
});

const FeatureLine = styled(Box)<{ width: string; colored?: boolean }>(
  ({ width, colored }) => ({
    height: '8px',
    width,
    borderRadius: '4px',
    backgroundColor: colored ? '#c4b5fd' : '#d1d5db',
  })
);

const Sparkle = styled(Box)<{ top: string; left: string; delay: number; size: number }>(
  ({ top, left, delay, size }) => ({
    position: 'absolute',
    top,
    left,
    width: size,
    height: size,
    animation: `${sparkle} 2s ease-in-out ${delay}s infinite`,
    '&::before': {
      content: '"✦"',
      fontSize: size,
      color: '#a78bfa',
    },
  })
);

const Label = styled(Typography)({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#6b7280',
  marginTop: '8px',
});

interface DesignPolishProps {
  isActive: boolean;
}

export const DesignPolish: React.FC<DesignPolishProps> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <Container>
      <PageContainer>
        {/* Grayscale base layer */}
        <PageFrame colored={false}>
          <Header colored={false}>
            <Logo />
            <NavItems>
              <NavItem />
              <NavItem />
              <NavItem />
            </NavItems>
          </Header>
          <Hero colored={false}>
            <HeroTitle colored={false} />
            <HeroSubtitle colored={false} />
            <Button colored={false} />
          </Hero>
          <ContentSection>
            <FeatureCard colored={false} index={0}>
              <FeatureIcon colored={false} hue={0} />
              <FeatureLines>
                <FeatureLine width="80%" colored={false} />
                <FeatureLine width="60%" colored={false} />
              </FeatureLines>
            </FeatureCard>
            <FeatureCard colored={false} index={1}>
              <FeatureIcon colored={false} hue={0} />
              <FeatureLines>
                <FeatureLine width="70%" colored={false} />
                <FeatureLine width="85%" colored={false} />
              </FeatureLines>
            </FeatureCard>
          </ContentSection>
        </PageFrame>

        {/* Colored overlay that reveals */}
        <PageFrame colored={true}>
          <Header colored={true}>
            <Logo />
            <NavItems>
              <NavItem />
              <NavItem />
              <NavItem />
            </NavItems>
          </Header>
          <Hero colored={true}>
            <HeroTitle colored={true} />
            <HeroSubtitle colored={true} />
            <Button colored={true} />
          </Hero>
          <ContentSection>
            <FeatureCard colored={true} index={0}>
              <FeatureIcon colored={true} hue={270} />
              <FeatureLines>
                <FeatureLine width="80%" colored={true} />
                <FeatureLine width="60%" colored={true} />
              </FeatureLines>
            </FeatureCard>
            <FeatureCard colored={true} index={1}>
              <FeatureIcon colored={true} hue={220} />
              <FeatureLines>
                <FeatureLine width="70%" colored={true} />
                <FeatureLine width="85%" colored={true} />
              </FeatureLines>
            </FeatureCard>
          </ContentSection>
        </PageFrame>

        {/* Sparkles */}
        <Sparkle top="15%" left="85%" delay={2} size={16} />
        <Sparkle top="35%" left="10%" delay={2.5} size={12} />
        <Sparkle top="60%" left="90%" delay={3} size={14} />
        <Sparkle top="80%" left="5%" delay={3.5} size={10} />
      </PageContainer>

      <Label>Polishing design...</Label>
    </Container>
  );
};

export default DesignPolish;