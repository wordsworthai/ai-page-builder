import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConnectorsService } from '@/client';

export function useDeleteConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) =>
      ConnectorsService.deleteConnectionApiConnectorsNangoConnectionsConnectionIdDelete(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors', 'nango', 'connections'] });
    },
  });
}
