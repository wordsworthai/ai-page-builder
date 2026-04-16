// frontend/src/types/smbRecommendation.ts

/**
 * Types for SMB Recommendation workflow
 */

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface GooglePlacesData {
  id: string;
  displayName: string;
  formattedAddress?: string;
  location?: {
    lat: number;
    lng: number;
  };
  websiteURI?: string;
  internationalPhoneNumber?: string;
  nationalPhoneNumber?: string;
  googleMapsURI?: string;
  businessStatus?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  types?: string[];
  primaryType?: string;
  primaryTypeDisplayName?: string;
  addressComponents?: any[];
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
    periods?: any[];
  };
  utcOffsetMinutes?: number;
  editorialSummary?: string;
  reviews?: Array<{
    authorName: string;
    rating: number;
    text: string;
    relativeTime?: string;
    publishTime?: string;
  }>;
  photos?: Array<{
    index: number;
    widthPx: number;
    heightPx: number;
    url: string;
    authorAttributions: string[];
  }>;
}

export interface SMBRecommendationRequest {
  business_name: string;
  website_intention?: string;
  website_tone?: string;
  query?: string;
  sector?: string;
  google_places_data?: GooglePlacesData;
  yelp_url?: string;
  enable_reflection?: boolean;
  max_iterations?: number;
}

export interface SMBFormData {
  businessName: string;
  googlePlacesData?: GooglePlacesData;
  yelpUrl: string;
  purpose: string;
  tone: string;
  colorPalette?: {  // ✅ Add the ? to make it optional
    id: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
    };
  };
  enableReflection?: boolean;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface SMBRecommendationResults {
  success: boolean;
  business_name: string;
  templates: Array<{
    template_id: string;
    template_name: string;
    section_info: Array<{
      section_index: number;
      section_l0: string;
      section_l1: string;
      reasoning: string;
    }>;
  }>;
  template_count: number;
  section_mapped_recommendations: SectionMappedRecommendation[];
  recommendation_count: number;
  business_info?: {
    business_name: string;
    sector?: string;
    google_places_data?: {
      rating?: number;
      total_ratings?: number;
      price_level?: string;
      types?: string[];
    };
    yelp_data?: {
      rating?: string;
      review_count?: number;
      categories?: string[];
    };
  };
  sector?: string;
  campaign_intent?: {
    campaign_query?: string;
    business_overview?: string;
    target_audience?: string;
    brand_voice?: string;
  };
  google_data_available?: boolean;
  yelp_data_available?: boolean;
  yelp_scraping_error?: string;
  derived_sector?: string;
  reflection_enabled?: boolean;
  template_evaluations?: Record<string, {
    score: number;
    advantages: string[];
    disadvantages: string[];
    improvement_suggestions: any[];
  }>;
  final_iteration?: number;
  query_hash?: string;
  model_used?: string;
  execution_time_ms?: number;
  timestamp?: string;
  error?: string;
  failed_node?: string;
}

export interface SectionMappedRecommendation {
  template_id: string;
  template_name: string;
  section_mappings: Array<{
    section_index: number;
    section_id: string;
    section_l0: string;
    section_l1: string;
    content_description?: string;
    style_description?: string;
    reasoning?: string;
    desktop_screenshot?: string;
    mobile_screenshot?: string;
    subtag?: string[];
  }>;
  sections_mapped: number;
}

// ============================================================================
// STREAMING TYPES
// ============================================================================

export interface SMBStreamingData {
  tokens: Record<string, string[]>;
  completedNodes: string[];
  progress: number;
  currentNode?: string;
  displayName?: string;
  activeNodes: Set<string>;
}

export interface SMBNodeStartEvent {
  node: string;
  display_name: string;
  timestamp: string;
}

export interface SMBTokenEvent {
  node: string;
  content: string;
  timestamp: string;
}

export interface SMBNodeCompleteEvent {
  node: string;
  display_name: string;
  data: any;
  timestamp: string;
}

export interface SMBWorkflowCompleteEvent {
  success: boolean;
  results: SMBRecommendationResults;
  execution_time_ms: number;
  timestamp: string;
}

export interface SMBErrorEvent {
  error: string;
  fatal: boolean;
  node?: string;
  timestamp: string;
}

// ============================================================================
// GLOBAL WINDOW TYPE EXTENSION
// ============================================================================

declare global {
  interface Window {
    google?: any;
  }
}