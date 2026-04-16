export interface Store {
  id: string;
  name: string;
  description: string;
  store_url: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  storeId: string;
}

export interface TemplateFile {
  name: string;
  path: string;
}
export interface TemplateState {
  files: TemplateFile[];
  loading: boolean;
  error: string | null;
  contentLoading: boolean;
  templateContent: any | null;
  ingestSuccess: boolean;
  templateId: string;
  updateTemplateIdLoading: boolean;
  processingProgress: number;
  sectionIngestStatus: Record<string, "loading" | "success" | "error">;
  ingestedSectionIds: string[];
  sectionErrors: Record<string, string>;
  mediaProcessingLoading: boolean;
  mediaProcessingSuccess: boolean;
  mediaProcessingError: string | null;
  mediaCount: number;
  templateUpdating: boolean;
  refreshingProducts: boolean;
  refreshSuccess: boolean;
  refreshedProducts: any | null;
  updatingProductMedia: boolean;
  urlValidating: boolean;
  urlIsUnique: boolean;
  urlValidationError: string | null;
}
export interface TemplatesResponse {
  templates: TemplateFile[];
}
export interface FetchTemplateRequest {
  store_url: string;
  theme_name: string;
  template_path: string;
  template_name: string;
  page_url: string;
}

// Available store options
export const STORES: Store[] = [
  {
    id: "zefina-anshul-avi",
    name: "Zefina",
    description: "Zefina store - Anshul Avi",
    store_url: "https://e9440c-1f.myshopify.com/",
  },
  {
    id: "zefina-dev-theme",
    name: "Zive",
    description: "Zive store - Kajal",
    store_url: "https://327b30.myshopify.com/",
  },
];

// Pre-defined themes for each store
export const STORE_THEMES: Theme[] = [
  {
    id: "174066630973",
    name: "ui_scalability",
    description: "UI scalability branch on github",
    storeId: "zefina-anshul-avi",
  },
  {
    id: "175771812157",
    name: "higher-order-elements",
    description: "Higher Order Elements theme on github",
    storeId: "zefina-anshul-avi",
  },
  {
    id: "173929890110",
    name: "ui_ux_scalability",
    description: "UI and UX scalability theme on github",
    storeId: "zefina-dev-theme",
  },
  {
    id: "179912114494",
    name: "wwai-section-repo",
    description: "Section Repo on Zive",
    storeId: "zefina-dev-theme"
  },
  {
    id: "176663134526",
    name: "sid_dev_theme",
    description: "Zive New Workspace",
    storeId: "zefina-dev-theme"
  }
];

// Schema-driven editor types
export interface FieldSchema {
  type: string;
  id: string;
  label: string;
  content?: string; // For header fields and other content-based fields
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string; label: string }>;
  info?: string;
  placeholder?: string;
  required?: boolean;
  pattern?: string;
}

export interface BlockSchema {
  type: string;
  name: string;
  limit?: number;
  max_blocks?: number;
  settings: FieldSchema[];
}

export interface SectionSchema {
  name: string;
  tag: string;
  class?: string;
  settings: FieldSchema[];
  blocks?: BlockSchema[];
  max_blocks?: number;
  presets?: any[];
}

export interface BlockInstance {
  type: string;
  settings: Record<string, any>;
}

export interface SectionInstance {
  type: string;
  settings: Record<string, any>;
  blocks?: Record<string, BlockInstance>;
}

export interface TemplateDoc {
  sections: Record<string, SectionInstance>;
  order: string[];
}

export interface SchemaEditorProps {
  liquidSchema: SectionSchema;
  templateJson: string;
  selectedSectionId?: string;
  onTemplateJsonChange: (json: string) => void;
}
