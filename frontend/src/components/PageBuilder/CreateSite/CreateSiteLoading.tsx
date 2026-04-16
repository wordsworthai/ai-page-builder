import { Box, styled, keyframes } from "@mui/material";
import BackgroundImage from "@/components/Shared/Common/BackgroundImage";

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const LoadingOverlay = styled(Box)({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(8px)",
});

const LoadingSpinner = styled(Box)({
  position: "relative",
  width: "80px",
  height: "80px",
  marginBottom: "40px",
  animation: `${rotate} 5s linear infinite`,
});

const Dot = styled(Box)<{ index: number; total: number }>(({ index, total }) => {
  const angle = (index / total) * 360 - 90;
  const radius = 35;
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;
  const normalizedAngle = ((angle + 90) % 360 + 360) % 360;
  let size = 8;
  let opacity = 1;
  if (normalizedAngle >= 0 && normalizedAngle < 45) {
    size = 5;
    opacity = 0.7;
  } else if (normalizedAngle >= 45 && normalizedAngle < 90) {
    size = 6;
    opacity = 0.8;
  } else if (normalizedAngle >= 90 && normalizedAngle < 135) {
    size = 6.5;
    opacity = 0.85;
  } else if (normalizedAngle >= 135 && normalizedAngle < 180) {
    size = 7;
    opacity = 0.9;
  } else if (normalizedAngle >= 180 && normalizedAngle < 225) {
    size = 8;
    opacity = 1;
  } else if (normalizedAngle >= 225 && normalizedAngle < 270) {
    size = 8.5;
    opacity = 1;
  } else if (normalizedAngle >= 270 && normalizedAngle < 315) {
    size = 7;
    opacity = 0.9;
  } else {
    size = 6.5;
    opacity = 0.85;
  }

  return {
    position: "absolute",
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    backgroundColor: "#878787",
    opacity,
    left: `calc(50% + ${x}px)`,
    top: `calc(50% + ${y}px)`,
    transform: "translate(-50%, -50%)",
  };
});

const LoadingText = styled(Box)({
  fontFamily: "'General Sans', sans-serif",
  fontWeight: 500,
  fontSize: "20px",
  lineHeight: 1.1,
  color: "#878787",
  textAlign: "center",
  letterSpacing: "-0.4px",
});

interface CreateSiteLoadingProps {
  isVisible: boolean;
}

const CreateSiteLoading: React.FC<CreateSiteLoadingProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  const totalDots = 12;

  return (
    <LoadingOverlay>
      <BackgroundImage opacity={0.15} zIndex={9998} />
      <LoadingSpinner>
        {Array.from({ length: totalDots }).map((_, index) => (
          <Dot key={index} index={index} total={totalDots} />
        ))}
      </LoadingSpinner>
      <LoadingText>
        Your website will be ready in a minute...
      </LoadingText>
    </LoadingOverlay>
  );
};

export default CreateSiteLoading;

