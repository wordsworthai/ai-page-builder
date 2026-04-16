import { useQuery } from '@tanstack/react-query';
import { ConnectorsService } from '@/client';
import type { NangoConnectionResponse } from '@/client';

export type NangoConnection = NangoConnectionResponse;

export function useNangoConnections() {
  return useQuery({
    queryKey: ['connectors', 'nango', 'connections'],
    queryFn: async () => {
      const response = await ConnectorsService.listConnectionsApiConnectorsNangoConnectionsGet();
      return response.connections;
    },
    refetchOnWindowFocus: false,
  });
}
