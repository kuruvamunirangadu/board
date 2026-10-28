import { SubjectCategory } from './knowledge';
import { LearnerLevel } from './ai-authoring';

export type SupportedFileType = 'pdf' | 'text' | 'markdown' | 'image_png' | 'image_jpeg';

export type IngestionStatus = 'processing' | 'completed' | 'partial_failure' | 'failed';

export type SegmentType = 
  | 'heading' 
  | 'paragraph' 
  | 'equation' 
  | 'table' 
  | 'figure' 
  | 'diagram' 
  | 'list_item';

export type ExtractionMethod = 
  | 'native_text' 
  | 'pdf_stream_parse' 
  | 'markdown_ast' 
  | 'ocr_fallback' 
  | 'image_vision_analysis';

export interface SourceDocument {
  id: string;
  filename: string;
  fileType: SupportedFileType;
  fileSize: number;
  importTimestamp: number;
  status: IngestionStatus;
  pipelineVersion: string;
  pageCount: number;
  segmentCount: number;
  checksum?: string;
  rawContentPreview?: string;
  processingSummary: {
    totalPages: number;
    extractedPages: number;
    scannedPagesNeedingOcr: number;
    failedPages: number;
    extractedEquationsCount: number;
    extractedFiguresCount: number;
    warnings: string[];
  };
}

export interface SourceSegment {
  id: string;
  parentDocumentId: string;
  segmentType: SegmentType;
  extractedText: string;
  pageNumber?: number;
  sectionPath?: string;
  figureReference?: string;
  extractionMethod: ExtractionMethod;
  confidence: number; // 0.0 to 1.0
  isMathFormula?: boolean;
}

export interface SourceReference {
  documentId: string;
  documentFilename: string;
  segmentId: string;
  pageNumber?: number;
  sectionTitle?: string;
  excerpt: string;
  referenceType: 'citation' | 'diagram' | 'formula' | 'inferred';
}

export interface ExtractedEquation {
  id: string;
  sourceSegmentId: string;
  pageNumber?: number;
  formulaText: string;
  normalizedLatex?: string;
  contextDescription: string;
}

export interface ExtractedFigure {
  id: string;
  sourceSegmentId: string;
  pageNumber?: number;
  caption: string;
  diagramType?: string;
  labels: string[];
  imageUri?: string;
}

export interface SourceGroundedConcept {
  tempId: string;
  title: string;
  explanation: string;
  learningObjectives: string[];
  difficultyLevel: LearnerLevel;
  estimatedMinutes: number;
  sourceReferences: SourceReference[];
  associatedEquationIds?: string[];
  associatedFigureIds?: string[];
  suggestedVisualizations: ('diagram' | 'note' | 'model3d' | 'simulation' | 'chart')[];
  requiredCapability?: string;
  knowledgeCheck?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    sourceExcerpt?: string;
  };
  groundingStatus: 'fully_grounded' | 'partially_grounded' | 'inferred';
  verificationNotice: string;
}

export interface MultimodalIngestionResult {
  document: SourceDocument;
  segments: SourceSegment[];
  concepts: SourceGroundedConcept[];
  equations: ExtractedEquation[];
  figures: ExtractedFigure[];
  suggestedTopicTitle: string;
  suggestedCategory: SubjectCategory;
}

