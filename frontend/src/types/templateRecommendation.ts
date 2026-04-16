// TypeScript types for Template Recommendation Workflow

export interface Template {
  template_id: string;
  template_name: string;
  section_info: SectionInfo[];
  query_hash: string;
  page_url?: string;
}

export interface SectionInfo {
  section_index: number;
  section_l0: string;
  section_l1: string;
  reasoning: string;
}

export interface SectionMapping {
  section_id: string;
  section_l0: string;
  section_l1: string;
  desktop_screenshot?: string;
  mobile_screenshot?: string;
  reasoning: string;
}

export interface TemplateWithSections {
  template_id: string;
  template_name: string;
  section_mappings: SectionMapping[];
  sections_mapped: number;
}

export interface TemplateEvaluation {
  new_layout_advantages: string[];
  new_layout_disadvantages: string[];
  template_name_relevance: string;
  improvement_suggestions: string[];
  usability_score: number;
}

export interface TemplateRecommendationResults {
  success: boolean;
  templates: Template[];
  template_evaluations?: Record<string, TemplateEvaluation>;
  section_mapped_recommendations: TemplateWithSections[];
  recommendation_count: number;
  section_repo_size: number;
  screenshot_url?: string;
  gemini_layout_description?: string;
  synthetic_query?: string;
  intent_extraction_method?: string;
  input_type?: string;
  query_hash?: string;
  model_used?: string;
  reflection_enabled: boolean;
  final_iteration: number;
  query?: string;
  page_url?: string;
  sector?: string;
  execution_time_ms: number;
  timestamp: string;
}

export interface StreamingData {
  currentNode?: string;
  displayName?: string;
  tokens: Record<string, string[]>; // node_name -> tokens
  completedNodes: string[];
  progress: number;
  activeNodes: Set<string>;
}

export interface TemplateRecommendationRequest {
  query?: string;
  page_url?: string;
  sector?: string;
  enable_reflection: boolean;
  max_iterations: number;
}

// SSE Event Types
export type SSEEventType = 
  | 'node_start'
  | 'token'
  | 'node_complete'
  | 'workflow_complete'
  | 'error';

export interface NodeStartEvent {
  node: string;
  display_name: string;
  timestamp: string;
}

export interface TokenEvent {
  node: string;
  content: string;
  timestamp: string;
}

export interface NodeCompleteEvent {
  node: string;
  display_name: string;
  data: any;
  timestamp: string;
}

export interface WorkflowCompleteEvent {
  success: boolean;
  results: TemplateRecommendationResults;
  execution_time_ms: number;
  timestamp: string;
}

export interface ErrorEvent {
  error: string;
  fatal: boolean;
  timestamp: string;
}