/**
 * VisiOS — Document Import & Multimodal Learning Types
 * Step 11: Typed representations for imported student study material (PDFs, notes, Markdown),
 * page-grounded extraction, section mappings, tables, equations, and learning conversions.
 */

import { AuthoredLesson } from '@/features/learning/AuthoringLessonTypes';
import { PracticeQuestion, WorkedExample } from '@/features/learning/types';

export type SupportedFileType = 'pdf' | 'text' | 'markdown' | 'unknown';

export type DocumentProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type OcrStatus = 'none' | 'ocr_unavailable' | 'ocr_processed';

export interface DocumentPage {
  pageNumber: number; // 1-indexed
  rawText: string;
  headings: string[];
  hasTables: boolean;
  hasEquations: boolean;
  wordCount: number;
}

export interface DocumentSection {
  id: string;
  title: string;
  startPage: number;
  endPage: number;
  content: string;
}

export interface DocumentTable {
  id: string;
  pageNumber: number;
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface DocumentEquation {
  id: string;
  pageNumber: number;
  rawExpression: string;
  contextText: string;
}

export interface DocumentGroundingRef {
  sourcePage: number;
  sectionTitle?: string;
  groundingSnippet: string;
  isDirectQuote?: boolean;
}

export interface ImportedDocument {
  id: string;
  fileName: string;
  fileSize: number; // bytes
  fileType: SupportedFileType;
  mimeType: string;
  title: string;
  totalPages: number;
  pages: DocumentPage[];
  sections: DocumentSection[];
  tables: DocumentTable[];
  equations: DocumentEquation[];
  isScanned: boolean;
  ocrStatus: OcrStatus;
  warnings: string[];
  processingStatus: DocumentProcessingStatus;
  errorMessage?: string;
  extractedAt: number;
  checksum: string;
}

export interface GroundedExplanationStep {
  stepNumber: number;
  title: string;
  content: string;
  sourcePage: number;
  groundingSnippet: string;
}

export interface GroundedPracticeQuestion extends PracticeQuestion {
  sourcePage: number;
  groundingSnippet: string;
}

export interface GroundedWorkedExample extends WorkedExample {
  sourcePage: number;
  groundingSnippet: string;
}

export interface DocumentLearningConversion {
  documentId: string;
  documentTitle: string;
  summary: string;
  extractedTopics: string[];
  groundedSteps: GroundedExplanationStep[];
  groundedWorkedExamples: GroundedWorkedExample[];
  groundedPracticeQuestions: GroundedPracticeQuestion[];
  draftLesson: AuthoredLesson;
  unsupportedClaims: string[];
  generatedAt: number;
}

export interface DocumentValidationResult {
  isValid: boolean;
  fileType: SupportedFileType;
  mimeType: string;
  fileSize: number;
  errorCode?:
    | 'FILE_TOO_LARGE'
    | 'EMPTY_FILE'
    | 'UNSUPPORTED_FORMAT'
    | 'ENCRYPTED_PDF'
    | 'CORRUPT_FILE'
    | 'INVALID_CONTENT';
  errorMessage?: string;
}

