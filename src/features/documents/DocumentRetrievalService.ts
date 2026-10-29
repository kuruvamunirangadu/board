/**
 * VisiOS — Phase 9: Ranked Document Retrieval Service
 * Deterministic, ranked passage retrieval over structured document sections and segments.
 * Computes relevance scores using term-frequency and phrase matching while preserving exact page provenance.
 */

import { ImportedDocument, DocumentSection, DocumentPage } from './DocumentTypes';
import { SourceDocument, SourceSegment } from '@/types/multimodal';

export interface RetrievalFilter {
  documentId?: string;
  minPage?: number;
  maxPage?: number;
  sectionTitle?: string;
  minScoreThreshold?: number;
  limit?: number;
}

export interface RetrievedPassage {
  id: string;
  documentId: string;
  documentTitle: string;
  pageNumber: number;
  sectionTitle?: string;
  content: string;
  snippet: string;
  score: number; // 0.0 - 1.0
  matchReason: 'exact_phrase' | 'high_term_frequency' | 'keyword_match' | 'heading_match';
  characterOffset?: [number, number];
}

export interface RetrievalResult {
  query: string;
  totalCandidatesScanned: number;
  passages: RetrievedPassage[];
  filteredCount: number;
  hasSufficientEvidence: boolean;
}

export class DocumentRetrievalService {
  private static readonly STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'were', 'will', 'with', 'what', 'how', 'why', 'can',
  ]);

  /**
   * Retrieves and ranks relevant passages from an ImportedDocument.
   */
  public static retrieveFromImportedDoc(
    doc: ImportedDocument,
    query: string,
    filter: RetrievalFilter = {}
  ): RetrievalResult {
    if (!query || !query.trim()) {
      return {
        query,
        totalCandidatesScanned: 0,
        passages: [],
        filteredCount: 0,
        hasSufficientEvidence: false,
      };
    }

    const cleanQuery = query.toLowerCase().trim();
    const queryTokens = this.tokenize(cleanQuery);
    const candidatePassages: RetrievedPassage[] = [];
    let scannedCount = 0;

    // 1. Scan Document Sections
    for (const section of doc.sections || []) {
      scannedCount++;
      if (filter.sectionTitle && !section.title.toLowerCase().includes(filter.sectionTitle.toLowerCase())) {
        continue;
      }
      if (filter.minPage && section.endPage < filter.minPage) continue;
      if (filter.maxPage && section.startPage > filter.maxPage) continue;

      const scoreData = this.calculateRelevance(section.content, section.title, cleanQuery, queryTokens);
      if (scoreData.score >= (filter.minScoreThreshold || 0.15)) {
        candidatePassages.push({
          id: `sec_${section.id}`,
          documentId: doc.id,
          documentTitle: doc.title || doc.fileName,
          pageNumber: section.startPage,
          sectionTitle: section.title,
          content: section.content,
          snippet: this.generateSnippet(section.content, queryTokens),
          score: scoreData.score,
          matchReason: scoreData.matchReason,
        });
      }
    }

    // 2. Scan Document Pages for fine-grained passages
    for (const page of doc.pages || []) {
      scannedCount++;
      if (filter.minPage && page.pageNumber < filter.minPage) continue;
      if (filter.maxPage && page.pageNumber > filter.maxPage) continue;

      // Split page into paragraph passages
      const paragraphs = page.rawText.split(/\n\s*\n/).filter((p) => p.trim().length > 30);
      for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
        const para = paragraphs[pIdx];
        const heading = page.headings[0] || `Page ${page.pageNumber}`;
        const scoreData = this.calculateRelevance(para, heading, cleanQuery, queryTokens);

        if (scoreData.score >= (filter.minScoreThreshold || 0.15)) {
          candidatePassages.push({
            id: `p_${page.pageNumber}_para_${pIdx}`,
            documentId: doc.id,
            documentTitle: doc.title || doc.fileName,
            pageNumber: page.pageNumber,
            sectionTitle: heading,
            content: para.trim(),
            snippet: this.generateSnippet(para, queryTokens),
            score: scoreData.score,
            matchReason: scoreData.matchReason,
          });
        }
      }
    }

    // 3. Deterministic Sorting: Primary by score descending, secondary by pageNumber ascending
    const sorted = candidatePassages.sort((a, b) => {
      if (Math.abs(b.score - a.score) > 0.001) {
        return b.score - a.score;
      }
      return a.pageNumber - b.pageNumber;
    });

    const limit = filter.limit || 5;
    const finalPassages = sorted.slice(0, limit);

    return {
      query,
      totalCandidatesScanned: scannedCount,
      passages: finalPassages,
      filteredCount: finalPassages.length,
      hasSufficientEvidence: finalPassages.length > 0 && finalPassages[0].score >= 0.35,
    };
  }

  /**
   * Retrieves and ranks relevant passages from SourceDocument and SourceSegment[] (multimodal store).
   */
  public static retrieveFromSegments(
    doc: SourceDocument,
    segments: SourceSegment[],
    query: string,
    filter: RetrievalFilter = {}
  ): RetrievalResult {
    if (!query || !query.trim()) {
      return {
        query,
        totalCandidatesScanned: 0,
        passages: [],
        filteredCount: 0,
        hasSufficientEvidence: false,
      };
    }

    const cleanQuery = query.toLowerCase().trim();
    const queryTokens = this.tokenize(cleanQuery);
    const candidatePassages: RetrievedPassage[] = [];
    let scannedCount = 0;

    for (const segment of segments) {
      if (filter.documentId && segment.parentDocumentId !== filter.documentId) {
        continue;
      }
      scannedCount++;
      const page = segment.pageNumber || 1;
      if (filter.minPage && page < filter.minPage) continue;
      if (filter.maxPage && page > filter.maxPage) continue;
      if (filter.sectionTitle && segment.sectionPath && !segment.sectionPath.toLowerCase().includes(filter.sectionTitle.toLowerCase())) {
        continue;
      }

      const scoreData = this.calculateRelevance(segment.extractedText, segment.sectionPath || '', cleanQuery, queryTokens);
      if (scoreData.score >= (filter.minScoreThreshold || 0.15)) {
        candidatePassages.push({
          id: segment.id,
          documentId: doc.id,
          documentTitle: doc.filename,
          pageNumber: page,
          sectionTitle: segment.sectionPath || `Page ${page}`,
          content: segment.extractedText,
          snippet: this.generateSnippet(segment.extractedText, queryTokens),
          score: scoreData.score,
          matchReason: scoreData.matchReason,
        });
      }
    }

    // Sort deterministically
    const sorted = candidatePassages.sort((a, b) => {
      if (Math.abs(b.score - a.score) > 0.001) {
        return b.score - a.score;
      }
      return a.pageNumber - b.pageNumber;
    });

    const limit = filter.limit || 5;
    const finalPassages = sorted.slice(0, limit);

    return {
      query,
      totalCandidatesScanned: scannedCount,
      passages: finalPassages,
      filteredCount: finalPassages.length,
      hasSufficientEvidence: finalPassages.length > 0 && finalPassages[0].score >= 0.35,
    };
  }

  // -------------------------------------------------------------------------
  // Scoring & Relevance Calculation
  // -------------------------------------------------------------------------
  private static calculateRelevance(
    text: string,
    titleOrHeading: string,
    cleanQuery: string,
    queryTokens: string[]
  ): { score: number; matchReason: RetrievedPassage['matchReason'] } {
    const lowerText = text.toLowerCase();
    const lowerHeading = titleOrHeading.toLowerCase();

    // 1. Exact phrase match in text or heading
    if (lowerHeading.includes(cleanQuery)) {
      return { score: 1.0, matchReason: 'heading_match' };
    }
    if (lowerText.includes(cleanQuery)) {
      return { score: 0.95, matchReason: 'exact_phrase' };
    }

    // 2. Token overlap and frequency
    const textWords = this.tokenize(lowerText);
    if (textWords.length === 0 || queryTokens.length === 0) {
      return { score: 0.0, matchReason: 'keyword_match' };
    }

    let matchedTokens = 0;
    let frequencyScore = 0;

    for (const token of queryTokens) {
      const occurrences = textWords.filter((w) => w === token).length;
      if (occurrences > 0) {
        matchedTokens++;
        frequencyScore += Math.min(occurrences, 4) * 0.1;
      }
    }

    const tokenRatio = matchedTokens / queryTokens.length;
    // Boost if heading matches key tokens
    let headingBonus = 0;
    for (const token of queryTokens) {
      if (lowerHeading.includes(token)) headingBonus += 0.15;
    }

    const rawScore = tokenRatio * 0.6 + frequencyScore * 0.2 + headingBonus;
    const score = Number(Math.min(0.92, Math.max(0.0, rawScore)).toFixed(3));

    const matchReason: RetrievedPassage['matchReason'] =
      tokenRatio >= 0.75 ? 'high_term_frequency' : 'keyword_match';

    return { score, matchReason };
  }

  private static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !this.STOP_WORDS.has(w));
  }

  private static generateSnippet(text: string, queryTokens: string[], maxLength: number = 180): string {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length <= maxLength) return clean;

    const lower = clean.toLowerCase();
    // Find first query token position
    let firstPos = -1;
    for (const token of queryTokens) {
      const idx = lower.indexOf(token);
      if (idx !== -1 && (firstPos === -1 || idx < firstPos)) {
        firstPos = idx;
      }
    }

    if (firstPos === -1) {
      return clean.slice(0, maxLength) + '...';
    }

    const start = Math.max(0, firstPos - 40);
    const end = Math.min(clean.length, start + maxLength);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < clean.length ? '...' : '';

    return `${prefix}${clean.slice(start, end).trim()}${suffix}`;
  }
}
