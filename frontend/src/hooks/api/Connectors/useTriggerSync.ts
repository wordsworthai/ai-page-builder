import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConnectorsService } from '@/client';

export function useTriggerSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) =>
      ConnectorsService.triggerSyncApiConnectorsNangoConnectionsConnectionIdSyncPost(connectionId),
    onSuccess: (_data, connectionId) => {
      queryClient.invalidateQueries({ queryKey: ['connectors', 'nango', 'connections'] });
      queryClient.invalidateQueries({ queryKey: ['connectors', 'nango', 'documents', connectionId] });
    },
  });
}
