import React from 'react';
import { Card, CardContent, Box, Typography, styled, SvgIconProps } from '@mui/material';

export interface OverviewCardProps {
  icon: React.ReactElement<SvgIconProps>;
  text: string;
  number: string | number;
  iconColor?: string;
}

const StyledCard = styled(Card)(({ theme }) => ({
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
}));

const IconWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'iconColor',
})<{ iconColor?: string }>(({ theme, iconColor = '#757BC8' }) => ({
  color: iconColor,
  marginBottom: theme.spacing(0.5),
}));

const LabelText = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem'
}));

const NumberText = styled(Typography)(({ theme }) => ({
  fontSize: '1.225rem',
  fontWeight: 600,
  color: '#333333'
}));

const OverviewCard: React.FC<OverviewCardProps> = ({ icon, text, number, iconColor }) => {
  return (
    <StyledCard>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <IconWrapper iconColor={iconColor}>
          {icon}
        </IconWrapper>
        <LabelText>{text}</LabelText>
        <NumberText>{number}</NumberText>
      </CardContent>
    </StyledCard>
  );
};

export default OverviewCard;
