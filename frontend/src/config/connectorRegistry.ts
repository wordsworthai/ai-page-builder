export interface ConnectorDefinition {
  integrationId: string;
  name: string;
  description: string;
  category: 'cloud-storage' | 'crm' | 'email' | 'project-management' | 'other';
  icon: string;
  postConnectFlow?: 'drive-explorer' | null;
  enabled: boolean;
  features?: string[];
}

export const CONNECTOR_REGISTRY: ConnectorDefinition[] = [
  {
    integrationId: 'google-drive',
    name: 'Google Drive',
    description: 'Sync documents and files from Google Drive for AI-powered search.',
    category: 'cloud-storage',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg',
    postConnectFlow: 'drive-explorer',
    enabled: true,
    features: ['Folder selection', 'Automatic sync', 'PDF & Doc support'],
  },
  {
    integrationId: 'sharepoint',
    name: 'SharePoint',
    description: 'Sync documents and files from Microsoft SharePoint for AI-powered search.',
    category: 'cloud-storage',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Microsoft_Office_SharePoint_%282019%E2%80%93present%29.svg',
    postConnectFlow: null,
    enabled: false,
    features: ['Document libraries', 'Site collections', 'Office file support'],
  },
];
