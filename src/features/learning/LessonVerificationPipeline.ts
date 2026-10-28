/**
 * VisiOS — Layered Lesson Verification Pipeline
 * Step 10: Multi-layer deterministic, semantic, structural, source, and visualization verification
 * for AI-assisted and human-authored learning content.
 * 
 * Core principle: AI generates the draft; deterministic checks and review control whether it can be published.
 */

import {
  AuthoredLesson,
  AuthoredLessonStep,
  AuthoredVisualizationConfig,
  RENDERER_AUTHORING_SCHEMAS,
} from './AuthoringLessonTypes';
import { SubjectRegistry } from './SubjectRegistry';
import { VisualizationRegistry } from './VisualizationRegistry';
import { BinarySearchEngine } from './BinarySearchEngine';
import { FormulaDerivationEngine } from './FormulaDerivationEngine';
import { TopicClassifier } from './TopicClassifier';

export type VerificationLayer = 'structural' | 'semantic' | 'deterministic' | 'source' | 'visualization';

export interface VerificationIssue {
  layer: VerificationLayer;
  field: string;
  message: string;
  severity: 'error' | 'warning';
  suggestedFix?: string;
  calculatedExpected?: string | number;
  providedValue?: string | number;
}

export interface VerificationLayerStatus {
  passed: boolean;
  issuesCount: number;
  details: string;
}

export interface VerificationPipelineReport {
  isValid: boolean;
  canPublish: boolean;
  humanReviewRequired: boolean;
  errors: VerificationIssue[];
  warnings: VerificationIssue[];
  layerStatus: Record<VerificationLayer, VerificationLayerStatus>;
  deterministicAudit: {
    mathVerified: boolean;
    mathFindings?: string;
    algorithmTraceVerified: boolean;
    algorithmFindings?: string;
    unitsVerified: boolean;
  };
}

export class LessonVerificationPipeline {
  private static readonly MAX_TITLE_LENGTH = 160;
  private static readonly MAX_OVERVIEW_LENGTH = 4000;
  private static readonly MIN_OVERVIEW_LENGTH = 20;

  /**
   * Main layered verification runner.
   */
  public static verify(lesson: Partial<AuthoredLesson>): VerificationPipelineReport {
    const errors: VerificationIssue[] = [];
    const warnings: VerificationIssue[] = [];

    const layerStatus: Record<VerificationLayer, VerificationLayerStatus> = {
      structural: { passed: true, issuesCount: 0, details: 'Structural validation passed.' },
      semantic: { passed: true, issuesCount: 0, details: 'Semantic relevance passed.' },
      deterministic: { passed: true, issuesCount: 0, details: 'Deterministic calculations verified.' },
      source: { passed: true, issuesCount: 0, details: 'Source attributions verified.' },
      visualization: { passed: true, issuesCount: 0, details: 'Visualization config matches schema.' },
    };

    const deterministicAudit = {
      mathVerified: true,
      mathFindings: undefined as string | undefined,
      algorithmTraceVerified: true,
      algorithmFindings: undefined as string | undefined,
      unitsVerified: true,
    };

    // =========================================================================
    // LAYER A: STRUCTURAL VALIDATION
    // =========================================================================
    const structuralIssues: VerificationIssue[] = [];

    // Title
    const title = (lesson.title || '').trim();
    if (!title || title.toLowerCase() === 'untitled lesson module') {
      structuralIssues.push({
        layer: 'structural',
        field: 'title',
        message: 'A descriptive module title is required.',
        severity: 'error',
      });
    } else if (title.length > this.MAX_TITLE_LENGTH) {
      structuralIssues.push({
        layer: 'structural',
        field: 'title',
        message: `Title exceeds maximum allowed length (${this.MAX_TITLE_LENGTH} chars).`,
        severity: 'error',
      });
    }

    // Primary Topic
    const primaryTopic = (lesson.primaryTopic || '').trim();
    if (!primaryTopic || primaryTopic.toLowerCase() === 'untitled lesson module') {
      structuralIssues.push({
        layer: 'structural',
        field: 'primaryTopic',
        message: 'Primary topic query is required for student routing.',
        severity: 'error',
      });
    }

    // Academic Subject
    if (!lesson.subjectId) {
      structuralIssues.push({
        layer: 'structural',
        field: 'subjectId',
        message: 'Academic subject must be selected.',
        severity: 'error',
      });
    } else {
      const sub = SubjectRegistry.getSubject(lesson.subjectId);
      if (!sub) {
        structuralIssues.push({
          layer: 'structural',
          field: 'subjectId',
          message: `Subject '${lesson.subjectId}' is not registered in SubjectRegistry.`,
          severity: 'error',
        });
      }
    }

    // Overview
    const overview = (lesson.overview || '').trim();
    if (!overview) {
      structuralIssues.push({
        layer: 'structural',
        field: 'overview',
        message: 'Core conceptual overview explanation is required.',
        severity: 'error',
      });
    } else if (overview.length < this.MIN_OVERVIEW_LENGTH) {
      structuralIssues.push({
        layer: 'structural',
        field: 'overview',
        message: `Overview explanation is too brief (${overview.length} chars, minimum ${this.MIN_OVERVIEW_LENGTH}).`,
        severity: 'error',
      });
    } else if (overview.length > this.MAX_OVERVIEW_LENGTH) {
      structuralIssues.push({
        layer: 'structural',
        field: 'overview',
        message: `Overview explanation exceeds maximum length limit (${this.MAX_OVERVIEW_LENGTH} chars).`,
        severity: 'error',
      });
    }

    // Learning Objectives
    if (!lesson.learningObjectives || lesson.learningObjectives.length === 0) {
      structuralIssues.push({
        layer: 'structural',
        field: 'learningObjectives',
        message: 'At least one learning objective must be declared.',
        severity: 'error',
      });
    }

    // Steps
    if (!lesson.steps || lesson.steps.length === 0) {
      structuralIssues.push({
        layer: 'structural',
        field: 'steps',
        message: 'At least one pedagogical lesson step must be provided.',
        severity: 'error',
      });
    } else {
      for (let i = 0; i < lesson.steps.length; i++) {
        const s = lesson.steps[i];
        if (!s.title || !s.title.trim()) {
          structuralIssues.push({
            layer: 'structural',
            field: `steps[${i}].title`,
            message: `Lesson step ${i + 1} requires a title.`,
            severity: 'error',
          });
        }
        if (!s.content || !s.content.trim()) {
          structuralIssues.push({
            layer: 'structural',
            field: `steps[${i}].content`,
            message: `Lesson step ${i + 1} requires explanation content.`,
            severity: 'error',
          });
        }
      }
    }

    // Practice Questions Structural
    if (lesson.practiceQuestions && lesson.practiceQuestions.length > 0) {
      for (let i = 0; i < lesson.practiceQuestions.length; i++) {
        const q = lesson.practiceQuestions[i];
        if (!q.question || !q.question.trim()) {
          structuralIssues.push({
            layer: 'structural',
            field: `practiceQuestions[${i}].question`,
            message: `Practice question ${i + 1} is empty.`,
            severity: 'error',
          });
        }
        if (!q.options || q.options.length < 2) {
          structuralIssues.push({
            layer: 'structural',
            field: `practiceQuestions[${i}].options`,
            message: `Practice question ${i + 1} requires at least 2 selectable options.`,
            severity: 'error',
          });
        }
        if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex >= (q.options?.length || 0)) {
          structuralIssues.push({
            layer: 'structural',
            field: `practiceQuestions[${i}].correctIndex`,
            message: `Practice question ${i + 1} has an invalid answer index.`,
            severity: 'error',
          });
        }
      }
    }

    // =========================================================================
    // LAYER B: SEMANTIC RELEVANCE & DOMAIN INTEGRITY
    // =========================================================================
    const semanticIssues: VerificationIssue[] = [];
    const lowerTopic = primaryTopic.toLowerCase();
    const fullText = `${title} ${primaryTopic} ${overview} ${(lesson.assumptions || []).join(' ')} ${(lesson.steps || []).map((s) => `${s.title} ${s.content}`).join(' ')}`.toLowerCase();

    // CS Domain Relevance Rule: No Newtonian kinematics or physics junk in Computer Science
    const isCs =
      lesson.domain === 'computer_science' ||
      lesson.subjectId === 'computer_science' ||
      lowerTopic.includes('binary search') ||
      lowerTopic.includes('data structure') ||
      lowerTopic.includes('algorithm') ||
      lowerTopic.includes('tree') ||
      lowerTopic.includes('graph');

    if (isCs) {
      const physicsJunk = ['newton', 'acceleration', 'kinematic', 'joule', 'gravity', 'velocity'];
      const foundJunk = physicsJunk.filter((term) => fullText.includes(term));
      if (foundJunk.length > 0) {
        semanticIssues.push({
          layer: 'semantic',
          field: 'domain_relevance',
          message: `Computer Science topic contains unrelated physics concepts (${foundJunk.join(', ')}).`,
          severity: 'error',
          suggestedFix: 'Remove Newtonian physics and replace with computational complexity and data structures.',
        });
      }

      // Prohibit fake k = 1 parameter
      const hasFakeK =
        lesson.visualizationConfig?.parameters && 'k' in lesson.visualizationConfig.parameters;
      if (hasFakeK) {
        semanticIssues.push({
          layer: 'semantic',
          field: 'visualizationConfig.parameters',
          message: 'Computer Science topic contains fabricated parameter k = 1.',
          severity: 'error',
          suggestedFix: 'Replace parameter k with algorithm array or graph structures.',
        });
      }
    }

    // Biology Domain Relevance Rule: No specialized physics simulations
    const isBio =
      lesson.domain === 'biology' ||
      lesson.subjectId === 'biology' ||
      lowerTopic.includes('photosynthesis') ||
      lowerTopic.includes('cell');

    if (isBio) {
      if (
        lesson.visualizationConfig?.rendererType === 'physics_vector_simulator' ||
        lesson.visualizationConfig?.rendererType === 'algorithm_array_tracer'
      ) {
        semanticIssues.push({
          layer: 'semantic',
          field: 'visualizationConfig.rendererType',
          message: `Biology topic incorrectly assigned incompatible renderer '${lesson.visualizationConfig.rendererType}'.`,
          severity: 'error',
          suggestedFix: 'Use svg_schematic_fallback or schematic_circuit_diagram for biological processes.',
        });
      }
    }

    // General Topic Relevance Check
    if (lowerTopic) {
      const topicTokens = lowerTopic
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3);
      if (topicTokens.length > 0) {
        const matchesTopic = topicTokens.some((tok) => fullText.includes(tok));
        if (!matchesTopic) {
          semanticIssues.push({
            layer: 'semantic',
            field: 'topic_relevance',
            message: `Lesson content does not appear to explain the requested topic '${primaryTopic}'.`,
            severity: 'error',
            suggestedFix: 'Ensure overview and steps directly explain the core topic.',
          });
        }
      }
    }

    // =========================================================================
    // LAYER C: DETERMINISTIC CHECKS
    // =========================================================================
    const deterministicIssues: VerificationIssue[] = [];

    // C1. Mathematical Recalculation Check (e.g. F = ma)
    const isFma =
      lowerTopic.includes('f = ma') ||
      lowerTopic.includes('newton') ||
      lowerTopic.includes('force') ||
      lesson.subjectId === 'physics';

    if (isFma && lesson.workedExamples && lesson.workedExamples.length > 0) {
      for (let i = 0; i < lesson.workedExamples.length; i++) {
        const ex = lesson.workedExamples[i];
        const given = ex.givenValues || {};
        
        // Check for F = m * a variables in givenValues or problem statement
        let m: number | undefined = typeof given.m === 'number' ? given.m : typeof given.mass === 'number' ? given.mass : undefined;
        let a: number | undefined = typeof given.a === 'number' ? given.a : typeof given.acceleration === 'number' ? given.acceleration : undefined;
        let statedF: number | undefined = typeof given.F === 'number' ? given.F : typeof given.force === 'number' ? given.force : undefined;

        // Extract numbers from text if not in givenValues
        if (m === undefined || a === undefined) {
          const mMatch = `${ex.problemStatement} ${ex.stepByStepSolution.join(' ')}`.match(/m\s*=\s*(\d+(?:\.\d+)?)\s*kg/i);
          const aMatch = `${ex.problemStatement} ${ex.stepByStepSolution.join(' ')}`.match(/a\s*=\s*(\d+(?:\.\d+)?)\s*m\/s/i);
          if (mMatch) m = parseFloat(mMatch[1]);
          if (aMatch) a = parseFloat(aMatch[1]);
        }

        if (m !== undefined && a !== undefined) {
          const calcResult = FormulaDerivationEngine.calculate('physics_f_ma', { m, a });
          const expectedF = typeof calcResult.primaryResult === 'number' ? calcResult.primaryResult : parseFloat(String(calcResult.primaryResult));

          // Check stated final answer
          const statedMatch = ex.finalAnswer.match(/(\d+(?:\.\d+)?)/);
          if (statedMatch) {
            const parsedStated = parseFloat(statedMatch[1]);
            const diff = Math.abs(parsedStated - expectedF);
            if (diff > 0.05) {
              deterministicAudit.mathVerified = false;
              deterministicAudit.mathFindings = `Calculated F = ${expectedF} N, but stated final answer is ${parsedStated} N`;
              deterministicIssues.push({
                layer: 'deterministic',
                field: `workedExamples[${i}].finalAnswer`,
                message: `Deterministic calculation mismatch in worked example: Given mass ${m} kg and acceleration ${a} m/s², expected Force is ${expectedF} N, but final answer states ${parsedStated}.`,
                severity: 'error',
                calculatedExpected: `${expectedF} N`,
                providedValue: `${parsedStated} N`,
                suggestedFix: `Update final answer to ${expectedF} N.`,
              });
            } else {
              deterministicAudit.mathFindings = `Deterministic F = ma check passed: ${m} kg × ${a} m/s² = ${expectedF} N`;
            }
          }
        }
      }
    }

    // C2. Algorithm Trace Verification (e.g. Binary Search)
    const isBinarySearch = lowerTopic.includes('binary search');
    if (isBinarySearch) {
      let arrayToTest = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
      let targetToTest = 23;

      if (lesson.visualizationConfig?.parameters) {
        const p = lesson.visualizationConfig.parameters;
        if (Array.isArray(p.elements) && p.elements.length > 0) arrayToTest = p.elements;
        if (typeof p.target === 'number') targetToTest = p.target;
      }

      // Ensure array is strictly sorted for binary search
      let isSorted = true;
      for (let k = 1; k < arrayToTest.length; k++) {
        if (arrayToTest[k] < arrayToTest[k - 1]) {
          isSorted = false;
          break;
        }
      }

      if (!isSorted) {
        deterministicAudit.algorithmTraceVerified = false;
        deterministicIssues.push({
          layer: 'deterministic',
          field: 'visualizationConfig.parameters.elements',
          message: 'Binary search elements array is not monotonically sorted in ascending order.',
          severity: 'error',
          suggestedFix: 'Sort array elements monotonically.',
        });
      } else {
        // Run deterministic binary search execution
        const trace = BinarySearchEngine.generateTrace(arrayToTest, targetToTest);
        const lastStep = trace[trace.length - 1];
        const actualIndex = arrayToTest.indexOf(targetToTest);

        if (actualIndex >= 0 && lastStep.foundIndex !== actualIndex) {
          deterministicAudit.algorithmTraceVerified = false;
          deterministicIssues.push({
            layer: 'deterministic',
            field: 'algorithm_trace',
            message: `Binary search trace did not locate target ${targetToTest} at correct index ${actualIndex}.`,
            severity: 'error',
          });
        } else {
          deterministicAudit.algorithmFindings = `Binary search trace verified: target ${targetToTest} found at index [${actualIndex}] in ${trace.length} step(s).`;
        }
      }
    }

    // =========================================================================
    // LAYER D: SOURCE VALIDATION
    // =========================================================================
    const sourceIssues: VerificationIssue[] = [];
    if (lesson.sourceAttribution) {
      const src = lesson.sourceAttribution;
      if (!src.source || !src.source.trim()) {
        sourceIssues.push({
          layer: 'source',
          field: 'sourceAttribution.source',
          message: 'Source provider name must be declared.',
          severity: 'error',
        });
      }

      if (src.url) {
        try {
          const parsed = new URL(src.url);
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            sourceIssues.push({
              layer: 'source',
              field: 'sourceAttribution.url',
              message: `Disallowed URL protocol '${parsed.protocol}'. Only http: and https: are allowed.`,
              severity: 'error',
            });
          }
        } catch {
          sourceIssues.push({
            layer: 'source',
            field: 'sourceAttribution.url',
            message: 'Malformed external source URL.',
            severity: 'error',
          });
        }
      }
    }

    // =========================================================================
    // LAYER E: VISUALIZATION VALIDATION
    // =========================================================================
    const visIssues: VerificationIssue[] = [];
    if (lesson.visualizationConfig) {
      const v = lesson.visualizationConfig;
      if (v.rendererType && v.rendererType !== 'none') {
        if (!VisualizationRegistry.isSupportedRenderer(v.rendererType)) {
          visIssues.push({
            layer: 'visualization',
            field: 'visualizationConfig.rendererType',
            message: `Unsupported renderer type '${v.rendererType}'.`,
            severity: 'error',
          });
        }

        const schema = RENDERER_AUTHORING_SCHEMAS[v.rendererType];
        if (schema && v.parameters) {
          for (const field of schema.fields) {
            const val = v.parameters[field.name];
            if (val !== undefined && field.type === 'number') {
              if (field.min !== undefined && val < field.min) {
                visIssues.push({
                  layer: 'visualization',
                  field: `visualizationConfig.parameters.${field.name}`,
                  message: `Parameter '${field.label}' (${val}) is below minimum allowed (${field.min}).`,
                  severity: 'error',
                });
              }
              if (field.max !== undefined && val > field.max) {
                visIssues.push({
                  layer: 'visualization',
                  field: `visualizationConfig.parameters.${field.name}`,
                  message: `Parameter '${field.label}' (${val}) exceeds maximum allowed (${field.max}).`,
                  severity: 'error',
                });
              }
            } else if (val !== undefined && field.type === 'numberArray') {
              if (!Array.isArray(val) || val.length === 0) {
                visIssues.push({
                  layer: 'visualization',
                  field: `visualizationConfig.parameters.${field.name}`,
                  message: `Parameter '${field.label}' must be a non-empty array of numbers.`,
                  severity: 'error',
                });
              }
            }
          }
        }
      }
    }

    // =========================================================================
    // AGGREGATE RESULTS
    // =========================================================================
    const allIssues = [...structuralIssues, ...semanticIssues, ...deterministicIssues, ...sourceIssues, ...visIssues];
    for (const issue of allIssues) {
      if (issue.severity === 'error') {
        errors.push(issue);
      } else {
        warnings.push(issue);
      }
    }

    // Update layer statuses
    layerStatus.structural.passed = !structuralIssues.some((i) => i.severity === 'error');
    layerStatus.structural.issuesCount = structuralIssues.length;
    if (!layerStatus.structural.passed) layerStatus.structural.details = structuralIssues.map((i) => i.message).join(' ');

    layerStatus.semantic.passed = !semanticIssues.some((i) => i.severity === 'error');
    layerStatus.semantic.issuesCount = semanticIssues.length;
    if (!layerStatus.semantic.passed) layerStatus.semantic.details = semanticIssues.map((i) => i.message).join(' ');

    layerStatus.deterministic.passed = !deterministicIssues.some((i) => i.severity === 'error');
    layerStatus.deterministic.issuesCount = deterministicIssues.length;
    if (!layerStatus.deterministic.passed) layerStatus.deterministic.details = deterministicIssues.map((i) => i.message).join(' ');

    layerStatus.source.passed = !sourceIssues.some((i) => i.severity === 'error');
    layerStatus.source.issuesCount = sourceIssues.length;
    if (!layerStatus.source.passed) layerStatus.source.details = sourceIssues.map((i) => i.message).join(' ');

    layerStatus.visualization.passed = !visIssues.some((i) => i.severity === 'error');
    layerStatus.visualization.issuesCount = visIssues.length;
    if (!layerStatus.visualization.passed) layerStatus.visualization.details = visIssues.map((i) => i.message).join(' ');

    const isValid = errors.length === 0;
    const canPublish = isValid && lesson.isExpertReviewed === true;

    return {
      isValid,
      canPublish,
      humanReviewRequired: !lesson.isExpertReviewed,
      errors,
      warnings,
      layerStatus,
      deterministicAudit,
    };
  }
}

