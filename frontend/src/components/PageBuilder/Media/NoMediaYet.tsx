import { NoMediaYetProps } from '@/types/media';
import { Box, Typography } from '@mui/material';

function NoMediaYet({ containerSx, title = 'No Media Yet', message = 'Start by uploading files.' }: NoMediaYetProps) {
  return (
    <Box
      sx={{
        flex: 1,
        border: '1px dashed #d6d1f5',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#faf9ff',
        color: '#7a6ee0',
        textAlign: 'center',
        padding: 3,
        ...containerSx,
      }}
    >
      <Box>
        <Typography variant="body1" fontWeight={600}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ marginTop: 0.5 }}>
          {message}
        </Typography>
      </Box>
    </Box>
  );
}

export default NoMediaYet;

