import { useQuery } from '@tanstack/react-query';
import { ConnectorsService } from '@/client';
import type { SyncedDocumentResponse } from '@/client';

export type SyncedDocument = SyncedDocumentResponse;

export function useNangoDocuments(connectionId: string | null) {
  return useQuery({
    queryKey: ['connectors', 'nango', 'documents', connectionId],
    queryFn: async () => {
      const response = await ConnectorsService.listDocumentsApiConnectorsNangoConnectionsConnectionIdDocumentsGet(connectionId!);
      return response.documents;
    },
    enabled: !!connectionId,
    refetchOnWindowFocus: false,
  });
}
