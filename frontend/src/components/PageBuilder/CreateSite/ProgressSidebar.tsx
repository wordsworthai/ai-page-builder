import { useState, useEffect } from "react";
import { Box, Typography, styled } from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import ellipse15 from "../../../assets/ellipse-15.svg";
import ellipse16 from "../../../assets/ellipse-16.svg";

const ALL_STEPS = [
  "Scanning your links",
  "Collecting business details",
  "Understanding your services",
  "Analyzing tone",
  "Mapping site structure",
  "Generating page layout",
  "Writing page content",
  "Choosing visuals",
  "Refining for clarity",
  "Preparing live preview",
];

const ProgressSidebarCard = styled(Box)(({ theme }) => ({
  background: "white",
  borderRadius: "24px",
  boxShadow: "0px 48px 100px 0px rgba(17, 12, 46, 0.15)",
  padding: "36px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  height: "100%",
  flex: 1,
}));

const ProgressContent = styled(Box)({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  justifyContent: "center",
  width: "100%",
});

const StepsContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "36px",
  width: "100%",
});

const StepItem = styled(Box)({
  display: "flex",
  gap: "12px",
  alignItems: "center",
  width: "100%",
});

const StepIcon = styled(Box)<{ status: "completed" | "active" | "pending" }>(({ status }) => {
  const size = status === "completed" ? "16px" : "10px";
  return {
    width: size,
    height: size,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "& img": {
      width: "100%",
      height: "100%",
      display: "block",
      objectFit: "contain",
    },
    "& .MuiSvgIcon-root": {
      width: "100%",
      height: "100%",
      fontSize: "16px",
    },
  };
});

const StepText = styled(Typography)({
  fontFamily: '"General Sans", sans-serif',
  fontWeight: 500, // Medium
  fontSize: "16px",
  lineHeight: 1,
  letterSpacing: "-0.32px",
  color: "#565656",
  flex: "1 0 0",
  minWidth: 0,
});

export type StepStatus = "completed" | "active" | "pending";

export interface ProgressStep {
  id: string;
  label: string;
  status: StepStatus;
}

interface ProgressSidebarProps {
  maxStep?: number;
  startStep?: number;
}

const ProgressSidebar = ({ maxStep = ALL_STEPS.length, startStep = 1 }: ProgressSidebarProps) => {
  const [currentActiveStep, setCurrentActiveStep] = useState<number>(startStep);

  useEffect(() => {
    setCurrentActiveStep(startStep);
  }, [startStep, maxStep]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActiveStep((prev) => {
        const nextStep = prev + 1;
        return nextStep <= maxStep ? nextStep : prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [startStep, maxStep]);

  const getStepStatus = (stepIndex: number): StepStatus => {
    if (stepIndex < startStep) {
      return "completed";
    } else if (stepIndex < currentActiveStep) {
      return "completed";
    } else if (stepIndex === currentActiveStep) {
      return "active";
    } else {
      return "pending";
    }
  };

  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case "completed":
        return (
          <CheckCircle
            sx={{
              color: "#7a80dc",
              fontSize: "16px",
            }}
          />
        );
      case "active":
        return <img src={ellipse15} alt="" />;
      case "pending":
        return <img src={ellipse16} alt="" />;
    }
  };

  return (
    <ProgressSidebarCard>
      <ProgressContent>
        <StepsContainer>
          {ALL_STEPS.map((label, index) => {
            const stepIndex = index + 1;
            const status = getStepStatus(stepIndex);
            return (
              <StepItem key={stepIndex}>
                <StepIcon status={status}>{getStepIcon(status)}</StepIcon>
                <StepText>{label}</StepText>
              </StepItem>
            );
          })}
        </StepsContainer>
      </ProgressContent>
    </ProgressSidebarCard>
  );
};

export default ProgressSidebar;

