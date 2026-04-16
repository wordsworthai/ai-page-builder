import { useMutation } from '@tanstack/react-query';
import { ConnectorsService } from '@/client';

export function useNangoSession() {
  return useMutation({
    mutationFn: (integrationId: string = 'google-drive') =>
      ConnectorsService.createConnectSessionApiConnectorsNangoConnectSessionPost({
        integration_id: integrationId,
      }),
  });
}
