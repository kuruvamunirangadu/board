/**
 * VisiOS — Document-Grounded Learning Converter
 * Step 11: Converts extracted student documents into grounded summaries, step-by-step explanations,
 * worked examples, practice questions with exact source-page attribution, and authoring studio lesson drafts.
 */

import {
  ImportedDocument,
  DocumentLearningConversion,
  GroundedExplanationStep,
  GroundedPracticeQuestion,
  GroundedWorkedExample,
} from './DocumentTypes';
import { AuthoredLesson, AuthoredLessonStep } from '@/features/learning/AuthoringLessonTypes';
import { LessonLibraryService } from '@/features/learning/LessonLibraryService';
import { LessonVerificationPipeline } from '@/features/learning/LessonVerificationPipeline';
import { AIAssistedAuthoringService } from '@/features/learning/AIAssistedAuthoringService';
import { SubjectRegistry } from '@/features/learning/SubjectRegistry';
import { TopicClassifier } from '@/features/learning/TopicClassifier';

export class DocumentGroundedLearningService {
  /**
   * Generates a concise summary grounded in document pages.
   */
  public static generateDocumentSummary(document: ImportedDocument): {
    summary: string;
    pageCitations: Array<{ pageNumber: number; heading?: string; excerpt: string }>;
  } {
    const pageCitations: Array<{ pageNumber: number; heading?: string; excerpt: string }> = [];
    const summaryBullets: string[] = [];

    for (const page of document.pages) {
      if (page.rawText.trim()) {
        const firstSentence = page.rawText
          .split(/(?<=[.?!])\s+/)
          .find((s) => s.length > 20 && !s.startsWith('#')) || page.rawText.slice(0, 150);

        pageCitations.push({
          pageNumber: page.pageNumber,
          heading: page.headings[0] || `Page ${page.pageNumber}`,
          excerpt: firstSentence.slice(0, 160).trim(),
        });

        summaryBullets.push(
          `• [Page ${page.pageNumber}]: ${firstSentence.slice(0, 140).trim()}`
        );
      }
    }

    const titlePrefix = document.title ? `Summary of "${document.title}":\n\n` : '';
    const summary = `${titlePrefix}${summaryBullets.slice(0, 5).join('\n')}\n\nDocument spans ${document.totalPages} page(s) with ${document.sections.length} section(s).`;

    return { summary, pageCitations };
  }

  /**
   * Extracts key concepts and terms with their page references.
   */
  public static extractKeyConcepts(document: ImportedDocument): Array<{
    concept: string;
    pageNumber: number;
    contextSnippet: string;
  }> {
    const concepts: Array<{ concept: string; pageNumber: number; contextSnippet: string }> = [];
    const seen = new Set<string>();

    for (const page of document.pages) {
      // Look for headings or bolded terms
      for (const h of page.headings) {
        const cleanH = h.replace(/^[0-9.:\-\s]+/, '').trim();
        if (cleanH.length > 3 && !seen.has(cleanH.toLowerCase())) {
          seen.add(cleanH.toLowerCase());
          concepts.push({
            concept: cleanH,
            pageNumber: page.pageNumber,
            contextSnippet: `Extracted from heading on Page ${page.pageNumber}`,
          });
        }
      }

      // Look for capitalized technical phrases or definitions
      const sentences = page.rawText.split(/(?<=[.?!])\s+/);
      for (const s of sentences) {
        const defMatch = s.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:is|are|defines|refers to)\s+(.+)/);
        if (defMatch) {
          const term = defMatch[1].trim();
          if (term.length > 3 && !seen.has(term.toLowerCase())) {
            seen.add(term.toLowerCase());
            concepts.push({
              concept: term,
              pageNumber: page.pageNumber,
              contextSnippet: s.slice(0, 140).trim(),
            });
          }
        }
      }
    }

    // Default concept if none found
    if (concepts.length === 0) {
      concepts.push({
        concept: document.title,
        pageNumber: 1,
        contextSnippet: `Core subject of ${document.fileName}`,
      });
    }

    return concepts.slice(0, 10);
  }

  /**
   * Generates practice questions strictly grounded in document pages.
   */
  public static generateGroundedPracticeQuestions(
    document: ImportedDocument,
    count: number = 2
  ): GroundedPracticeQuestion[] {
    const questions: GroundedPracticeQuestion[] = [];

    // Find pages with meaningful text
    const eligiblePages = document.pages.filter((p) => p.rawText.length > 50);

    for (let i = 0; i < Math.min(count, eligiblePages.length); i++) {
      const page = eligiblePages[i];
      const pageNum = page.pageNumber;
      const heading = page.headings[0] || `Section on Page ${pageNum}`;

      // Extract a factual claim from the page
      const sentences = page.rawText
        .split(/(?<=[.?!])\s+/)
        .filter((s) => s.length > 30 && !s.includes('|') && !s.startsWith('#'));

      const keySentence = sentences[0] || page.rawText.slice(0, 100);
      const snippet = keySentence.slice(0, 120).trim();

      questions.push({
        id: `q_doc_${document.id}_${i + 1}`,
        question: `According to Page ${pageNum} of the document (${heading}), which statement accurately reflects the material?`,
        options: [
          `${snippet}.`,
          `The document states an unrelated alternate principle that contradicts page ${pageNum}.`,
          `This topic is not discussed in the document.`,
          `The material exclusively applies to unrelated external domains.`,
        ],
        correctIndex: 0,
        explanation: `As detailed on Page ${pageNum}: "${snippet}".`,
        hint: `Consult the source material on Page ${pageNum} (${heading}).`,
        sourcePage: pageNum,
        groundingSnippet: snippet,
      });
    }

    return questions;
  }

  /**
   * Generates worked examples citing the source page.
   */
  public static generateGroundedWorkedExamples(
    document: ImportedDocument
  ): GroundedWorkedExample[] {
    const examples: GroundedWorkedExample[] = [];

    // Check if document has equations
    if (document.equations.length > 0) {
      const eq = document.equations[0];
      examples.push({
        title: `Worked Analysis: Equation on Page ${eq.pageNumber}`,
        problemStatement: `Analyze the expression "${eq.rawExpression}" extracted from Page ${eq.pageNumber}.`,
        givenValues: { expression: eq.rawExpression, sourcePage: eq.pageNumber },
        stepByStepSolution: [
          `1. Reference Source Page ${eq.pageNumber}: Equation identified as "${eq.rawExpression}".`,
          `2. Contextual Formulation: ${eq.contextText.slice(0, 120)}.`,
          `3. Educational Interpretation: Apply standard mathematical principles to evaluate expression.`,
        ],
        finalAnswer: `Expression "${eq.rawExpression}" verified from Page ${eq.pageNumber}.`,
        sourcePage: eq.pageNumber,
        groundingSnippet: eq.rawExpression,
      });
    } else {
      const page = document.pages[0];
      examples.push({
        title: `Document Case Study (Page ${page.pageNumber})`,
        problemStatement: `What is the core takeaway presented on Page ${page.pageNumber} of "${document.title}"?`,
        givenValues: { pageNumber: page.pageNumber, heading: page.headings[0] || 'Overview' },
        stepByStepSolution: [
          `1. Identify foundational concept on Page ${page.pageNumber}.`,
          `2. Document context: ${page.rawText.slice(0, 140)}...`,
          `3. Synthesize primary pedagogical takeaway.`,
        ],
        finalAnswer: `Core concept from Page ${page.pageNumber} substantiated by document text.`,
        sourcePage: page.pageNumber,
        groundingSnippet: page.rawText.slice(0, 120),
      });
    }

    return examples;
  }

  /**
   * Converts the imported document into an AuthoredLesson draft.
   * Ensures status is always 'draft' and persists it safely to LessonLibraryService.
   */
  public static async convertToAuthoredLesson(
    document: ImportedDocument,
    options?: {
      topic?: string;
      subjectId?: string;
    }
  ): Promise<DocumentLearningConversion> {
    const rawTopic = options?.topic || document.title || document.fileName.replace(/\.[^/.]+$/, '');
    const classification = TopicClassifier.classify(rawTopic);
    const subjectDef = options?.subjectId
      ? SubjectRegistry.getSubject(options.subjectId) || SubjectRegistry.resolveSubjectForDomain(classification.domain)
      : SubjectRegistry.resolveSubjectForDomain(classification.domain);

    const { summary } = this.generateDocumentSummary(document);
    const concepts = this.extractKeyConcepts(document);
    const extractedTopics = concepts.map((c) => c.concept);

    // Build grounded lesson steps from pages
    const groundedSteps: GroundedExplanationStep[] = [];
    const lessonSteps: AuthoredLessonStep[] = [];

    document.pages.slice(0, 5).forEach((p, idx) => {
      const heading = p.headings[0] || `Section ${idx + 1} (Page ${p.pageNumber})`;
      const content = p.rawText.slice(0, 350).trim() || `Core material from Page ${p.pageNumber}.`;
      const snippet = content.slice(0, 120).trim();

      groundedSteps.push({
        stepNumber: idx + 1,
        title: heading,
        content: `[Source: Page ${p.pageNumber}] ${content}`,
        sourcePage: p.pageNumber,
        groundingSnippet: snippet,
      });

      lessonSteps.push({
        id: `step_doc_${idx + 1}`,
        stepNumber: idx + 1,
        title: heading,
        stepType: idx === 0 ? 'concept_meaning' : 'step_by_step',
        content: `[Source: Page ${p.pageNumber}]\n${content}`,
        keyTakeaway: `Document grounded concept from Page ${p.pageNumber}.`,
      });
    });

    // Generate grounded examples and practice exercises
    const groundedWorkedExamples = this.generateGroundedWorkedExamples(document);
    const groundedPracticeQuestions = this.generateGroundedPracticeQuestions(document, 2);

    // Suggest compatible visualizer
    const visualizationConfig = AIAssistedAuthoringService.suggestVisualizationConfig(
      rawTopic,
      subjectDef.id
    );

    const now = Date.now();
    const draftLesson: AuthoredLesson = {
      id: `lesson_doc_${document.id}_${now.toString(36)}`,
      slug: `imported_${document.id}`,
      title: document.title || rawTopic,
      primaryTopic: rawTopic,
      topicAliases: extractedTopics.map((t) => t.toLowerCase()),
      subjectId: subjectDef.id,
      domain: classification.domain,
      difficulty: 'intermediate',
      learningObjectives: [
        `Understand concepts from imported material "${document.fileName}"`,
        ...extractedTopics.slice(0, 2).map((t) => `Analyze principles of ${t}`),
      ],
      prerequisites: [`Foundations of ${subjectDef.displayName}`],
      overview: summary.slice(0, 500),
      motivation: `Study material imported from student document: ${document.fileName}.`,
      assumptions: [
        `Extracted from student study document: ${document.fileName}`,
        `Document contains ${document.totalPages} page(s) and ${document.sections.length} section(s).`,
      ],
      steps: lessonSteps,
      visualizationConfig,
      workedExamples: groundedWorkedExamples,
      practiceQuestions: groundedPracticeQuestions,
      sourceAttribution: {
        source: `Imported Document: ${document.fileName}`,
        title: document.title,
        retrievalTimestamp: now,
      },
      status: 'draft', // NEVER AUTO-PUBLISH IMPORTED DOCUMENTS
      version: 1,
      isExpertReviewed: false,
      authorNotes: `Imported from "${document.fileName}" on ${new Date().toLocaleDateString()}. Grounded across ${document.totalPages} page(s). Requires student review before publishing.`,
      createdAt: now,
      updatedAt: now,
    };

    // Save as draft in lesson library
    await LessonLibraryService.saveDraft(draftLesson);

    return {
      documentId: document.id,
      documentTitle: document.title,
      summary,
      extractedTopics,
      groundedSteps,
      groundedWorkedExamples,
      groundedPracticeQuestions,
      draftLesson,
      unsupportedClaims: document.isScanned
        ? ['Document is scanned; OCR unavailable so text coverage is partial.']
        : [],
      generatedAt: now,
    };
  }
}

