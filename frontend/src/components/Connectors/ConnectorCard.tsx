import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import type { ConnectorDefinition } from '@/config/connectorRegistry';
import type { NangoConnection } from '@/hooks/api/Connectors';

interface ConnectorCardProps {
  connector: ConnectorDefinition;
  connections: NangoConnection[];
  onConnect: () => void;
  isPending: boolean;
}

const ConnectorCard: React.FC<ConnectorCardProps> = ({
  connector,
  connections,
  onConnect,
  isPending,
}) => {
  const isConnected = connections.length > 0;
  const isDisabled = !connector.enabled;

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': isDisabled
          ? {}
          : {
              boxShadow: 3,
              borderColor: 'primary.main',
            },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              component="img"
              src={connector.icon}
              alt={connector.name}
              sx={{ width: 32, height: 32 }}
            />
            <Typography variant="subtitle1" fontWeight={600}>
              {connector.name}
            </Typography>
          </Box>
          {isDisabled ? (
            <Chip label="Coming Soon" size="small" variant="outlined" />
          ) : isConnected ? (
            <Chip
              label="Connected"
              size="small"
              color="success"
              icon={<CheckCircleIcon />}
            />
          ) : (
            <Chip label="Available" size="small" variant="outlined" color="default" />
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {connector.description}
        </Typography>

        {connector.features && connector.features.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {connector.features.map((feature) => (
              <Chip
                key={feature}
                label={feature}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            ))}
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button
          variant={isConnected ? 'outlined' : 'contained'}
          size="small"
          fullWidth
          onClick={onConnect}
          disabled={isDisabled || isPending}
          startIcon={
            isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : isConnected ? (
              <AddIcon />
            ) : undefined
          }
        >
          {isPending
            ? 'Connecting...'
            : isDisabled
              ? 'Coming Soon'
              : isConnected
                ? 'Add Another'
                : 'Connect'}
        </Button>
      </CardActions>
    </Card>
  );
};

export default ConnectorCard;
