import { useQuery } from '@tanstack/react-query';
import { ConnectorsService } from '@/client';
import type { DriveFileResponse } from '@/client/models/DriveFileResponse';

export type DriveFile = DriveFileResponse;

export function useDriveFolderFiles(connectionId: string, parentId: string = 'root', enabled: boolean = true) {
  return useQuery({
    queryKey: ['connectors', 'nango', 'folder-files', connectionId, parentId],
    queryFn: () =>
      ConnectorsService.listFolderFilesApiConnectorsNangoConnectionsConnectionIdFolderFilesGet(connectionId, parentId)
        .then((response) => response.files),
    enabled,
    refetchOnWindowFocus: false,
  });
}
