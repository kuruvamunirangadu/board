/**
 * VisiOS — Phase 9: Source-Grounded Tutor Service
 * Strictly distinguishes:
 * 1. Source Evidence (verifiable excerpts with exact page/section citations)
 * 2. Additional Explanation (pedagogical scaffolding and visual intuition)
 * 3. Uncertainty Notice (honest declaration when source lacks sufficient evidence)
 */

import { ImportedDocument } from './DocumentTypes';
import { DocumentRetrievalService, RetrievedPassage } from './DocumentRetrievalService';
import { TeachingStrategy, LearnerDifficulty } from '../tutoring/TutoringContracts';

export interface GroundedEvidenceItem {
  pageNumber: number;
  sectionTitle?: string;
  verbatimExcerpt: string;
  relevanceScore: number;
}

export interface SourceGroundedResponse {
  query: string;
  documentId: string;
  documentTitle: string;
  isGroundedInDocument: boolean;
  hasSufficientEvidence: boolean;
  sourceEvidence: GroundedEvidenceItem[];
  additionalExplanation: string;
  uncertaintyNotice?: string;
  pedagogicalStrategy: TeachingStrategy;
  difficulty: LearnerDifficulty;
  pageCitations: number[];
  suggestedCanvasVisual?: {
    visualType: 'function_plot' | 'algorithm_trace' | 'physics_simulation' | 'concept_diagram';
    conceptTarget: string;
    suggestedRenderer: string;
    props: Record<string, unknown>;
  };
}

export class SourceGroundedTutorService {
  /**
   * Generates a strictly tripartite grounded response from an uploaded document.
   */
  public static explainWithGrounding(
    doc: ImportedDocument,
    query: string,
    strategy: TeachingStrategy = 'simple',
    difficulty: LearnerDifficulty = 'beginner'
  ): SourceGroundedResponse {
    // 1. Retrieve ranked source passages
    const retrieval = DocumentRetrievalService.retrieveFromImportedDoc(doc, query, { limit: 4 });
    const evidenceItems: GroundedEvidenceItem[] = retrieval.passages.map((p) => ({
      pageNumber: p.pageNumber,
      sectionTitle: p.sectionTitle,
      verbatimExcerpt: p.snippet,
      relevanceScore: p.score,
    }));

    const pages = Array.from(new Set(evidenceItems.map((e) => e.pageNumber))).sort((a, b) => a - b);

    // 2. Insufficient Evidence Detection
    if (!retrieval.hasSufficientEvidence || evidenceItems.length === 0) {
      return {
        query,
        documentId: doc.id,
        documentTitle: doc.title || doc.fileName,
        isGroundedInDocument: false,
        hasSufficientEvidence: false,
        sourceEvidence: evidenceItems,
        additionalExplanation: `The uploaded document "${doc.title || doc.fileName}" does not contain sufficient direct evidence to answer "${query}".`,
        uncertaintyNotice: `Uncertainty Notice: We could not find verifiable references for "${query}" across the ${doc.totalPages} page(s) of this document. Would you like a general conceptual explanation from the verified STEM curriculum instead?`,
        pedagogicalStrategy: strategy,
        difficulty,
        pageCitations: pages,
      };
    }

    // 3. Synthesize Grounded Explanation
    const topPassage = retrieval.passages[0];
    const topSection = topPassage.sectionTitle ? ` in "${topPassage.sectionTitle}"` : '';

    let additionalExplanation = '';
    switch (strategy) {
      case 'simple':
        additionalExplanation = `As described on Page ${topPassage.pageNumber}${topSection}, the key concept is: ${topPassage.snippet}. In intuitive terms, this establishes the foundational rule for the topic.`;
        break;
      case 'step_by_step':
        additionalExplanation = `Based on the source material on Page ${topPassage.pageNumber}:\n1. Review the initial parameters: ${topPassage.snippet}\n2. Apply the procedural steps outlined in the text.\n3. Validate results against the document's stated boundary conditions.`;
        break;
      case 'formal':
        additionalExplanation = `Formal textual grounding (Page ${topPassage.pageNumber}${topSection}): The source explicitly establishes: "${topPassage.content.slice(0, 200)}". This represents the invariant condition necessary for the algorithm or mathematical proof.`;
        break;
      default:
        additionalExplanation = `Document evidence from Page ${topPassage.pageNumber}${topSection} states: ${topPassage.snippet}.`;
        break;
    }

    // 4. Determine Suggested Canvas Visualization
    const visual = this.inferCanvasVisual(query, topPassage.content);

    return {
      query,
      documentId: doc.id,
      documentTitle: doc.title || doc.fileName,
      isGroundedInDocument: true,
      hasSufficientEvidence: true,
      sourceEvidence: evidenceItems,
      additionalExplanation,
      pedagogicalStrategy: strategy,
      difficulty,
      pageCitations: pages,
      suggestedCanvasVisual: visual,
    };
  }

  /**
   * Infers canvas visual mappings grounded in passage content.
   */
  private static inferCanvasVisual(query: string, content: string): SourceGroundedResponse['suggestedCanvasVisual'] {
    const combined = `${query} ${content}`.toLowerCase();

    if (combined.includes('binary search') || combined.includes('sorted array')) {
      return {
        visualType: 'algorithm_trace',
        conceptTarget: 'cs_binary_search',
        suggestedRenderer: 'algorithm_array_tracer',
        props: { array: [10, 20, 30, 40, 50, 60, 70, 80], target: 40 },
      };
    }

    if (combined.includes('linear function') || combined.includes('y = 2x') || combined.includes('slope intercept')) {
      return {
        visualType: 'function_plot',
        conceptTarget: 'math_linear_functions',
        suggestedRenderer: 'function_coordinate_plotter',
        props: { equation: 'y = 2x + 3', slope: 2, intercept: 3 },
      };
    }

    if (combined.includes('newton') || combined.includes('f = ma') || combined.includes('force')) {
      return {
        visualType: 'physics_simulation',
        conceptTarget: 'phys_newton_laws',
        suggestedRenderer: 'physics_vector_simulator',
        props: { massKg: 5, forceNewtons: 20 },
      };
    }

    return undefined;
  }
}
