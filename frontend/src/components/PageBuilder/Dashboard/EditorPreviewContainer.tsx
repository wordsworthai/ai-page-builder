import React, { useMemo } from 'react';
import { Box, styled, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';

const Container = styled(Box)<{ disabled?: boolean }>(({ disabled }) => ({
  flex: '1',
  border: '1px solid rgba(0, 0, 0, 0.1)',
  borderRadius: '8px',
  backgroundColor: disabled ? '#f5f5f5' : '#ffffff',
  minHeight: '120px',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  opacity: disabled ? 0.7 : 1,
}));

const Timestamp = styled(Typography)({
  fontSize: '0.875rem',
  color: 'rgba(0, 0, 0, 0.6)',
  marginBottom: '12px',
});

const DisabledMessage = styled(Typography)({
  fontSize: '0.875rem',
  color: 'rgba(0, 0, 0, 0.5)',
  marginBottom: '12px',
  fontStyle: 'italic',
});

const OpenEditorButton = styled(Button)(({ theme }) => ({
  width: '100%',
  marginTop: 'auto',
  gap: theme.spacing(1),
}));

interface EditorPreviewContainerProps {
  generationVersionId?: string; 
  disabled?: boolean;
  disabledMessage?: string;
  lastEditedAt?: string | null;
}

const getRelativeTime = (dateString: string | null | undefined): string => {
  if (!dateString) { return 'Not edited yet'; }
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Last edited just now';
  if (diffMins < 60) return `Last edited ${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Last edited ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Last edited ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `Last edited ${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `Last edited ${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
};

const EditorPreviewContainer: React.FC<EditorPreviewContainerProps> = ({
  generationVersionId,
  disabled = false,
  disabledMessage,
  lastEditedAt,
}) => {
  const navigate = useNavigate();

  const relativeTime = useMemo(() => {
    return getRelativeTime(lastEditedAt);
  }, [lastEditedAt]);

  const handleClick = () => {
    if (generationVersionId && !disabled) {
      navigate(`/editor/${generationVersionId}`);
    }
  };

  const isButtonDisabled = disabled || !generationVersionId;

  return (
    <Container disabled={disabled}>
      {disabled && disabledMessage ? (
        <DisabledMessage>{disabledMessage}</DisabledMessage>
      ) : (
        <Timestamp>{relativeTime}</Timestamp>
      )}
      <OpenEditorButton
        variant="contained"
        color="secondary"
        onClick={handleClick}
        disabled={isButtonDisabled}
        endIcon={<EditIcon fontSize="small" />}
      >
        Open editor
      </OpenEditorButton>
    </Container>
  );
};

export default EditorPreviewContainer;
