import { useQuery } from '@tanstack/react-query';
import { ConnectorsService } from '@/client';
import type { DriveFolderResponse } from '@/client';

export type DriveFolder = DriveFolderResponse;

export function useNangoFolders(connectionId: string, parentId: string = 'root', enabled: boolean = true) {
  return useQuery({
    queryKey: ['connectors', 'nango', 'folders', connectionId, parentId],
    queryFn: () =>
      ConnectorsService.listFoldersApiConnectorsNangoConnectionsConnectionIdFoldersGet(connectionId, parentId)
        .then((response) => response.folders),
    enabled,
    refetchOnWindowFocus: false,
  });
}
