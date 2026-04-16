import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConnectorsService } from '@/client';

interface ResetParams {
  connectionId: string;
  documentId: string;
}

export function useResetDocumentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ connectionId, documentId }: ResetParams) =>
      ConnectorsService.resetDocumentStatusApiConnectorsNangoConnectionsConnectionIdDocumentsDocumentIdResetPost(
        connectionId,
        documentId,
      ),
    onSuccess: (_data, { connectionId }) => {
      queryClient.invalidateQueries({ queryKey: ['connectors', 'nango', 'documents', connectionId] });
    },
  });
}
