import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConnectorsService } from '@/client';

interface IngestParams {
  connectionId: string;
  documentIds: string[];
}

export function useIngestDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ connectionId, documentIds }: IngestParams) =>
      ConnectorsService.ingestDocumentsApiConnectorsNangoConnectionsConnectionIdIngestPost(
        connectionId,
        { document_ids: documentIds },
      ),
    onSuccess: (_data, { connectionId }) => {
      queryClient.invalidateQueries({ queryKey: ['connectors', 'nango', 'documents', connectionId] });
      queryClient.invalidateQueries({ queryKey: ['connectors', 'nango', 'connections'] });
    },
  });
}
