import React from 'react';
import { Box, Typography, styled, keyframes } from '@mui/material';

const shrinkToBrowser = keyframes`
  0% { transform: scale(1); }
  100% { transform: scale(0.7); }
`;

const browserAppear = keyframes`
  0% { opacity: 0; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
`;

const urlType = keyframes`
  0% { width: 0; }
  100% { width: 140px; }
`;

const rocketLaunch = keyframes`
  0% { transform: translateY(0) rotate(-45deg); opacity: 1; }
  50% { transform: translateY(-100px) rotate(-45deg); opacity: 1; }
  100% { transform: translateY(-200px) rotate(-45deg); opacity: 0; }
`;

const trailFade = keyframes`
  0% { opacity: 0; height: 0; }
  30% { opacity: 1; height: 60px; }
  100% { opacity: 0; height: 100px; }
`;

const confetti = keyframes`
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100px) rotate(720deg); opacity: 0; }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  50% { transform: scale(1.02); box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
`;

const checkmarkDraw = keyframes`
  0% { stroke-dashoffset: 24; }
  100% { stroke-dashoffset: 0; }
`;

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '24px',
  position: 'relative',
});

const BrowserWindow = styled(Box)({
  width: '400px',
  height: '320px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 25px 80px rgba(0, 0, 0, 0.15), 0 10px 30px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid #e5e7eb',
  animation: `${browserAppear} 0.8s ease-out forwards`,
});

const BrowserHeader = styled(Box)({
  height: '40px',
  backgroundColor: '#f3f4f6',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  alignItems: 'center',
  padding: '0 12px',
  gap: '8px',
});

const TrafficLights = styled(Box)({
  display: 'flex',
  gap: '6px',
});

const TrafficLight = styled(Box)<{ color: string }>(({ color }) => ({
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  backgroundColor: color,
}));

const UrlBar = styled(Box)({
  flex: 1,
  height: '24px',
  backgroundColor: '#ffffff',
  borderRadius: '6px',
  border: '1px solid #e5e7eb',
  marginLeft: '12px',
  display: 'flex',
  alignItems: 'center',
  padding: '0 10px',
  gap: '6px',
  overflow: 'hidden',
});

const LockIcon = styled(Box)({
  width: '12px',
  height: '12px',
  color: '#22c55e',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '10px',
});

const UrlText = styled(Box)({
  height: '8px',
  backgroundColor: '#d1d5db',
  borderRadius: '4px',
  overflow: 'hidden',
  animation: `${urlType} 1.5s ease-out 0.5s forwards`,
  width: 0,
});

const BrowserContent = styled(Box)({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#fafafa',
  position: 'relative',
  overflow: 'hidden',
});

const MiniPage = styled(Box)({
  width: '280px',
  height: '200px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  animation: `${shrinkToBrowser} 1s ease-out forwards, ${pulse} 2s ease-in-out 2s infinite`,
  display: 'flex',
  flexDirection: 'column',
});

const MiniHeader = styled(Box)({
  height: '28px',
  background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
});

const MiniHero = styled(Box)({
  height: '60px',
  margin: '8px',
  borderRadius: '4px',
  background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const MiniContent = styled(Box)({
  padding: '0 8px',
  display: 'flex',
  gap: '6px',
});

const MiniCard = styled(Box)({
  flex: 1,
  height: '40px',
  borderRadius: '4px',
  backgroundColor: '#f3f4f6',
});

const SuccessBadge = styled(Box)({
  position: 'absolute',
  bottom: '20px',
  right: '20px',
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  backgroundColor: '#22c55e',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)',
  animation: `${browserAppear} 0.5s ease-out 2.5s both`,
});

const Checkmark = styled('svg')({
  width: '24px',
  height: '24px',
  '& path': {
    fill: 'none',
    stroke: '#ffffff',
    strokeWidth: 3,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeDasharray: 24,
    animation: `${checkmarkDraw} 0.4s ease-out 2.8s forwards`,
    strokeDashoffset: 24,
  },
});

const Rocket = styled(Box)({
  position: 'absolute',
  top: '50%',
  left: '30%',
  fontSize: '32px',
  animation: `${rocketLaunch} 2s ease-out 1s forwards`,
  opacity: 0,
  animationFillMode: 'backwards',
  animationDelay: '1.5s',
});

const RocketTrail = styled(Box)({
  position: 'absolute',
  top: '55%',
  left: '32%',
  width: '8px',
  background: 'linear-gradient(to bottom, rgba(251, 191, 36, 0.8), transparent)',
  borderRadius: '4px',
  animation: `${trailFade} 1.5s ease-out 1.7s forwards`,
  opacity: 0,
});

const ConfettiPiece = styled(Box)<{ color: string; left: string; delay: number }>(
  ({ color, left, delay }) => ({
    position: 'absolute',
    top: '20%',
    left,
    width: '8px',
    height: '8px',
    backgroundColor: color,
    borderRadius: '2px',
    animation: `${confetti} 2s ease-out ${delay}s forwards`,
    opacity: 0,
    animationFillMode: 'backwards',
  })
);

const Label = styled(Typography)({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#6b7280',
  marginTop: '8px',
});

interface LaunchSequenceProps {
  isActive: boolean;
}

export const LaunchSequence: React.FC<LaunchSequenceProps> = ({ isActive }) => {
  if (!isActive) return null;

  const confettiColors = ['#a78bfa', '#f472b6', '#22c55e', '#fbbf24', '#60a5fa'];

  return (
    <Container>
      <BrowserWindow>
        <BrowserHeader>
          <TrafficLights>
            <TrafficLight color="#ef4444" />
            <TrafficLight color="#fbbf24" />
            <TrafficLight color="#22c55e" />
          </TrafficLights>
          <UrlBar>
            <LockIcon>🔒</LockIcon>
            <UrlText />
          </UrlBar>
        </BrowserHeader>

        <BrowserContent>
          <MiniPage>
            <MiniHeader />
            <MiniHero>
              <Box sx={{ 
                width: '60px', 
                height: '8px', 
                backgroundColor: '#c4b5fd', 
                borderRadius: '4px' 
              }} />
            </MiniHero>
            <MiniContent>
              <MiniCard />
              <MiniCard />
              <MiniCard />
            </MiniContent>
          </MiniPage>

          <SuccessBadge>
            <Checkmark viewBox="0 0 24 24">
              <path d="M5 12l5 5L20 7" />
            </Checkmark>
          </SuccessBadge>

          {/* Rocket and trail */}
          <Rocket>🚀</Rocket>
          <RocketTrail />

          {/* Confetti */}
          {confettiColors.map((color, i) => (
            <ConfettiPiece
              key={i}
              color={color}
              left={`${20 + i * 15}%`}
              delay={2.5 + i * 0.1}
            />
          ))}
        </BrowserContent>
      </BrowserWindow>

      <Label>Almost ready...</Label>
    </Container>
  );
};

export default LaunchSequence;