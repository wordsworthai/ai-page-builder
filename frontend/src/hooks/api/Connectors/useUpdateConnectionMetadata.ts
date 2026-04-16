import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConnectorsService } from '@/client';

interface UpdateMetadataParams {
  connectionId: string;
  folderIds: string[];
}

export function useUpdateConnectionMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ connectionId, folderIds }: UpdateMetadataParams) =>
      ConnectorsService.updateConnectionMetadataApiConnectorsNangoConnectionsConnectionIdMetadataPatch(
        connectionId,
        { folder_ids: folderIds },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors', 'nango', 'connections'] });
    },
  });
}
