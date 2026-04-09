// ============================================================================
// STRATIQ — Shared TypeScript Types
// ============================================================================

// ---------------------------------------------------------------------------
// Enums & Unions
// ---------------------------------------------------------------------------

export const TRACKS = [
  'creative',
  'events',
  'art',
  'digital',
  'strategy',
  'all',
] as const;

export type Track = (typeof TRACKS)[number];

export type BriefStatus =
  | 'uploading'
  | 'parsing'
  | 'analyzing'
  | 'ready'
  | 'error';

export type DeckStatus =
  | 'planning'
  | 'generating'
  | 'rendering'
  | 'ready'
  | 'error';

export type SlideType =
  | 'title'
  | 'insight'
  | 'data'
  | 'case-study'
  | 'closing';

// ---------------------------------------------------------------------------
// Core Domain Models
// ---------------------------------------------------------------------------

export interface InsightCard {
  /** Unique identifier (uuid v4) */
  id: string;
  /** Short, punchy title (max 80 chars) */
  title: string;
  /** Executive summary — max 3 sentences */
  summary: string;
  /** Page or section in the source document where this insight originates */
  pageReference: string;
  /** Which creative track this insight belongs to */
  track: Track;
  /** AI confidence score 0-100 */
  confidence: number;
  /** Optional human feedback attached post-generation */
  feedback?: string;
}

export interface DataPoint {
  label: string;
  value: string | number;
  unit?: string;
}

export interface Slide {
  /** 0-based position in the deck */
  index: number;
  /** Slide layout type */
  type: SlideType;
  /** Slide headline */
  title: string;
  /** Body content — markdown-compatible */
  content: string;
  /** Resolved image URL (populated after image search) */
  imageUrl?: string;
  /** AI-generated image caption (max 15 words) */
  imageCaption?: string;
  /** Attribution back to the source brief / insight */
  sourceAttribution?: string;
  /** Quantitative data rendered on the slide */
  dataPoints?: DataPoint[];
}

// ---------------------------------------------------------------------------
// AI Request / Response Shapes
// ---------------------------------------------------------------------------

export interface BriefAnalysisRequest {
  textContent: string;
  cardCount: number;
  tracks: Track[];
}

export interface BriefAnalysisResponse {
  insights: InsightCard[];
}

export interface DeckPlanningRequest {
  insights: InsightCard[];
  template: string;
  slideCount: number;
}

export interface DeckPlanningResponse {
  slides: Slide[];
}

// ---------------------------------------------------------------------------
// API Response Envelope
// ---------------------------------------------------------------------------

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: {
    processingMs?: number;
    [key: string]: unknown;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ---------------------------------------------------------------------------
// Document Parsing
// ---------------------------------------------------------------------------

export interface ParsedDocument {
  text: string;
  pageCount: number;
}

// ---------------------------------------------------------------------------
// OpenRouter / AI Client
// ---------------------------------------------------------------------------

export interface AICallOptions {
  temperature?: number;
  maxTokens?: number;
}

export class AIError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
    public readonly upstream?: unknown,
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export class DocumentParseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly upstream?: unknown,
  ) {
    super(message);
    this.name = 'DocumentParseError';
  }
}
