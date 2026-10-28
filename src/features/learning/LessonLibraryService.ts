/**
 * VisiOS — Visual Authoring Studio: Lesson Library Service
 * Step 9: Reusable lesson storage, draft/publish lifecycle separation, structural validation,
 * live visualizer configuration, and intelligent published lesson resolution.
 */

import {
  AuthoredLesson,
  AuthoredLessonStep,
  AuthoredVisualizationConfig,
  LessonValidationReport,
  LessonValidationIssue,
  RENDERER_AUTHORING_SCHEMAS,
} from './AuthoringLessonTypes';
import { SubjectRegistry } from './SubjectRegistry';
import { VisualizationRegistry, CanonicalRendererType } from './VisualizationRegistry';
import {
  LearningPlan,
  VisualizationPlan,
  TopicDomain,
} from './types';
import { SessionPersistenceAdapter } from '@/lib/persistence/session-persistence';

export class LessonLibraryService {
  private static readonly STORAGE_KEY = 'visios_authored_lessons_v1';
  private static memoryLessons: Map<string, AuthoredLesson> = new Map();
  private static isInitialized: boolean = false;

  private static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage?.getItem(this.STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (item && item.id) {
                this.memoryLessons.set(item.id, item);
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load authored lessons from localStorage:', e);
      }
    }
  }

  private static persistToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const all = Array.from(this.memoryLessons.values());
        window.localStorage?.setItem(this.STORAGE_KEY, JSON.stringify(all));
      } catch (e) {
        console.warn('Failed to persist authored lessons to localStorage:', e);
      }
    }
  }

  public static async getAllLessons(): Promise<AuthoredLesson[]> {
    this.init();
    return Array.from(this.memoryLessons.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public static async listLessons(): Promise<AuthoredLesson[]> {
    return this.getAllLessons();
  }

  public static async getLesson(id: string): Promise<AuthoredLesson | null> {
    this.init();
    if (!id) return null;
    return this.memoryLessons.get(id) || null;
  }

  /**
   * Saves or updates a lesson as a DRAFT.
   * Does NOT alter the published snapshot if a published version already exists.
   */
  public static async saveDraft(payload: Partial<AuthoredLesson>): Promise<AuthoredLesson> {
    this.init();

    const title = (payload.title || '').trim() || 'Untitled Lesson Module';
    const primaryTopic = (payload.primaryTopic || '').trim() || title;
    const slug = SessionPersistenceAdapter.normalizeTopicKey(primaryTopic);
    const id = payload.id || `lesson_${slug}_${Math.random().toString(36).substring(2, 8)}`;

    const existing = this.memoryLessons.get(id);

    const now = Date.now();
    const version = existing ? existing.version + 1 : 1;

    const draftRecord: AuthoredLesson = {
      id,
      slug,
      title,
      primaryTopic,
      topicAliases: payload.topicAliases || existing?.topicAliases || [],
      subjectId: payload.subjectId || existing?.subjectId || 'computer_science',
      domain: (payload.domain || existing?.domain || 'computer_science') as TopicDomain,
      difficulty: payload.difficulty || existing?.difficulty || 'beginner',
      learningObjectives: payload.learningObjectives || existing?.learningObjectives || [],
      prerequisites: payload.prerequisites || existing?.prerequisites || [],
      overview: (payload.overview || existing?.overview || '').trim(),
      motivation: (payload.motivation || existing?.motivation || '').trim(),
      assumptions: payload.assumptions || existing?.assumptions || [],
      steps: payload.steps || existing?.steps || [],
      visualizationConfig: payload.visualizationConfig !== undefined ? payload.visualizationConfig : existing?.visualizationConfig,
      workedExamples: payload.workedExamples || existing?.workedExamples || [],
      practiceQuestions: payload.practiceQuestions || existing?.practiceQuestions || [],
      sourceAttribution: payload.sourceAttribution || existing?.sourceAttribution,
      status: 'draft',
      version,
      publishedVersion: existing?.publishedVersion,
      publishedSnapshot: existing?.publishedSnapshot,
      authorNotes: payload.authorNotes !== undefined ? payload.authorNotes : existing?.authorNotes,
      isExpertReviewed: payload.isExpertReviewed !== undefined ? payload.isExpertReviewed : existing?.isExpertReviewed || false,
      reviewedBy: payload.reviewedBy || existing?.reviewedBy,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      publishedAt: existing?.publishedAt,
    };

    this.memoryLessons.set(id, draftRecord);
    this.persistToStorage();
    return draftRecord;
  }

  /**
   * Structural and semantic validation before publication.
   */
  public static validateLesson(lesson: Partial<AuthoredLesson>): LessonValidationReport {
    const errors: LessonValidationIssue[] = [];
    const warnings: LessonValidationIssue[] = [];

    // 1. Mandatory Metadata
    if (!lesson.title || !lesson.title.trim() || lesson.title.trim().toLowerCase() === 'untitled lesson module') {
      errors.push({ field: 'title', message: 'Lesson title is required.', severity: 'error' });
    }
    if (!lesson.primaryTopic || !lesson.primaryTopic.trim() || lesson.primaryTopic.trim().toLowerCase() === 'untitled lesson module') {
      errors.push({ field: 'primaryTopic', message: 'Primary topic query is required.', severity: 'error' });
    }
    if (!lesson.subjectId) {
      errors.push({ field: 'subjectId', message: 'Academic subject must be selected.', severity: 'error' });
    } else {
      const sub = SubjectRegistry.getSubject(lesson.subjectId);
      if (!sub) {
        errors.push({ field: 'subjectId', message: `Subject '${lesson.subjectId}' is not registered in SubjectRegistry.`, severity: 'error' });
      }
    }

    // 2. Pedagogy & Explanations
    if (!lesson.overview || !lesson.overview.trim()) {
      errors.push({ field: 'overview', message: 'Core conceptual overview explanation is required.', severity: 'error' });
    }
    if (!lesson.learningObjectives || lesson.learningObjectives.length === 0) {
      errors.push({ field: 'learningObjectives', message: 'At least one learning objective must be declared.', severity: 'error' });
    }

    // 3. Lesson Steps
    if (!lesson.steps || lesson.steps.length === 0) {
      errors.push({ field: 'steps', message: 'At least one lesson step must be provided.', severity: 'error' });
    } else {
      for (let i = 0; i < lesson.steps.length; i++) {
        const step = lesson.steps[i];
        if (!step.title || !step.title.trim()) {
          errors.push({ field: `steps[${i}].title`, message: `Step ${i + 1} requires a title.`, severity: 'error' });
        }
        if (!step.content || !step.content.trim()) {
          errors.push({ field: `steps[${i}].content`, message: `Step ${i + 1} requires explanation content.`, severity: 'error' });
        }
      }
    }

    // 4. Visualization Configuration
    if (lesson.visualizationConfig) {
      const vConfig = lesson.visualizationConfig;
      if (vConfig.rendererType && vConfig.rendererType !== 'none') {
        if (!VisualizationRegistry.isSupportedRenderer(vConfig.rendererType)) {
          errors.push({
            field: 'visualizationConfig.rendererType',
            message: `Unsupported renderer type '${vConfig.rendererType}'.`,
            severity: 'error',
          });
        }

        // Domain compatibility check
        if (lesson.subjectId) {
          const isSupported = SubjectRegistry.isRendererSupported(lesson.subjectId, vConfig.rendererType);
          if (!isSupported) {
            errors.push({
              field: 'visualizationConfig.rendererType',
              message: `Renderer '${vConfig.rendererType}' is not supported for subject '${lesson.subjectId}'.`,
              severity: 'error',
            });
          }
        }

        // Parameter range and boundaries validation
        const schema = RENDERER_AUTHORING_SCHEMAS[vConfig.rendererType];
        if (schema && vConfig.parameters) {
          for (const field of schema.fields) {
            const val = vConfig.parameters[field.name];
            if (val !== undefined && field.type === 'number') {
              if (field.min !== undefined && val < field.min) {
                errors.push({
                  field: `visualizationConfig.parameters.${field.name}`,
                  message: `Parameter '${field.label}' value (${val}) is below minimum allowed (${field.min}).`,
                  severity: 'error',
                });
              }
              if (field.max !== undefined && val > field.max) {
                errors.push({
                  field: `visualizationConfig.parameters.${field.name}`,
                  message: `Parameter '${field.label}' value (${val}) exceeds maximum allowed (${field.max}).`,
                  severity: 'error',
                });
              }
            } else if (val !== undefined && field.type === 'numberArray') {
              if (!Array.isArray(val) || val.length === 0) {
                errors.push({
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

    // 5. Practice Questions
    if (lesson.practiceQuestions && lesson.practiceQuestions.length > 0) {
      for (let i = 0; i < lesson.practiceQuestions.length; i++) {
        const q = lesson.practiceQuestions[i];
        if (!q.question || !q.question.trim()) {
          errors.push({ field: `practiceQuestions[${i}].question`, message: `Practice question ${i + 1} is empty.`, severity: 'error' });
        }
        if (!q.options || q.options.length < 2) {
          errors.push({ field: `practiceQuestions[${i}].options`, message: `Practice question ${i + 1} must have at least 2 options.`, severity: 'error' });
        }
        if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex >= (q.options?.length || 0)) {
          errors.push({ field: `practiceQuestions[${i}].correctIndex`, message: `Practice question ${i + 1} has invalid correctIndex.`, severity: 'error' });
        }
      }
    }

    // Warnings
    if (!lesson.prerequisites || lesson.prerequisites.length === 0) {
      warnings.push({ field: 'prerequisites', message: 'No prerequisites defined. Consider declaring required foundational concepts.', severity: 'warning' });
    }
    if (!lesson.isExpertReviewed) {
      warnings.push({ field: 'isExpertReviewed', message: 'Content has not yet been marked as peer or curriculum reviewed.', severity: 'warning' });
    }

    return {
      isValid: errors.length === 0,
      canPublish: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Publishes a draft lesson after strict validation.
   * Increments publishedVersion and saves a protected published snapshot.
   */
  public static async publishLesson(id: string): Promise<{
    success: boolean;
    lesson?: AuthoredLesson;
    report: LessonValidationReport;
  }> {
    this.init();
    const lesson = this.memoryLessons.get(id);
    if (!lesson) {
      return {
        success: false,
        report: {
          isValid: false,
          canPublish: false,
          errors: [{ field: 'id', message: `Lesson with ID '${id}' not found.`, severity: 'error' }],
          warnings: [],
        },
      };
    }

    const report = this.validateLesson(lesson);
    if (!report.canPublish) {
      return { success: false, lesson, report };
    }

    const now = Date.now();
    const nextPubVer = (lesson.publishedVersion || 0) + 1;

    // Create immutable published snapshot
    const snapshot: Omit<AuthoredLesson, 'publishedSnapshot'> = {
      ...lesson,
      status: 'published',
      publishedVersion: nextPubVer,
      publishedAt: now,
      updatedAt: now,
    };

    const publishedRecord: AuthoredLesson = {
      ...lesson,
      status: 'published',
      publishedVersion: nextPubVer,
      publishedAt: now,
      updatedAt: now,
      publishedSnapshot: snapshot,
    };

    this.memoryLessons.set(id, publishedRecord);
    this.persistToStorage();

    return { success: true, lesson: publishedRecord, report };
  }

  /**
   * Deletes a lesson by ID.
   */
  public static async deleteLesson(id: string): Promise<boolean> {
    this.init();
    const existed = this.memoryLessons.delete(id);
    if (existed) {
      this.persistToStorage();
    }
    return existed;
  }

  /**
   * Reverts active draft edits to the latest published snapshot.
   */
  public static async revertDraft(id: string): Promise<AuthoredLesson | null> {
    this.init();
    const lesson = this.memoryLessons.get(id);
    if (!lesson || !lesson.publishedSnapshot) return null;

    const reverted: AuthoredLesson = {
      ...lesson.publishedSnapshot,
      publishedSnapshot: lesson.publishedSnapshot,
    };

    this.memoryLessons.set(id, reverted);
    this.persistToStorage();
    return reverted;
  }

  /**
   * Finds an applicable published lesson for a student query.
   * Matches by exact topic, registered aliases, or high-confidence normalized topic match.
   * Guarded against keyword-hijacking.
   */
  public static async findMatchingPublishedLesson(query: string): Promise<AuthoredLesson | null> {
    this.init();
    const clean = (query || '').trim().toLowerCase();
    if (!clean) return null;

    const normQuery = SessionPersistenceAdapter.normalizeTopicKey(clean);

    for (const lesson of Array.from(this.memoryLessons.values())) {
      // Must have an active published snapshot
      if (lesson.status !== 'published' && !lesson.publishedSnapshot) continue;

      const activeLesson = (lesson.publishedSnapshot || lesson) as AuthoredLesson;

      // 1. Exact normalized match with primary topic
      const normTopic = SessionPersistenceAdapter.normalizeTopicKey(activeLesson.primaryTopic);
      if (normQuery === normTopic) {
        return activeLesson;
      }

      // 2. Exact match with declared topic aliases
      if (Array.isArray(activeLesson.topicAliases)) {
        for (const alias of activeLesson.topicAliases) {
          if (SessionPersistenceAdapter.normalizeTopicKey(alias) === normQuery) {
            return activeLesson;
          }
        }
      }

      // 3. High-confidence specific phrase match (min 8 characters to avoid generic keyword hijacking)
      const topicLower = activeLesson.primaryTopic.toLowerCase();
      if (topicLower.length >= 8) {
        if (clean === topicLower || clean.startsWith(topicLower) || clean.endsWith(topicLower)) {
          return activeLesson;
        }
      }
    }

    return null;
  }

  /**
   * Converts an AuthoredLesson into a student-facing LearningPlan.
   */
  public static toLearningPlan(lesson: AuthoredLesson): LearningPlan {
    const subjectDef = SubjectRegistry.getSubject(lesson.subjectId) || SubjectRegistry.resolveSubjectForDomain(lesson.domain);

    const canonicalRenderer: CanonicalRendererType = lesson.visualizationConfig?.rendererType
      ? VisualizationRegistry.resolveRendererType(lesson.visualizationConfig.rendererType)
      : subjectDef.defaultRendererType;

    const vConfig = lesson.visualizationConfig;
    const visualizationPlan: VisualizationPlan = {
      rendererType: canonicalRenderer,
      title: vConfig?.title || `${lesson.title} Interactive Visualizer`,
      description: vConfig?.description || lesson.overview,
      learningObjective: vConfig?.learningObjective || (lesson.learningObjectives[0] || 'Understand core principles'),
      activeVariables: vConfig?.activeVariables || [],
      interactionsAvailable: vConfig?.interactionsAvailable || ['Inspect model parameters'],
      expectedBehavior: vConfig?.expectedBehavior || 'Renders author-verified interactive model state.',
      fallbackAvailable: true,
      modelConfig: vConfig?.parameters || {},
    };

    // Build practice questions with IDs
    const practiceQuestions = (lesson.practiceQuestions || []).map((q, idx) => ({
      id: q.id || `q_${lesson.id}_${idx + 1}`,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      hint: q.hint || 'Review the lesson overview and steps above.',
      misconceptionAlert: q.misconceptionAlert,
    }));

    return {
      conceptId: lesson.id,
      title: lesson.title,
      category: (lesson.domain === 'computer_science' ? 'algorithm' : lesson.domain === 'physics' ? 'physics' : 'concept') as any,
      subject: subjectDef.displayName,
      subjectId: subjectDef.id,
      subjectDefinition: subjectDef,
      learningStrategy: subjectDef.learningStrategy,
      capabilityLevel: lesson.isExpertReviewed ? 'verified_and_tested' : 'partial_with_limitations',
      disclosures: [
        `Authored module verified from VisiOS Visual Studio (Version ${lesson.publishedVersion || lesson.version}).`,
        lesson.isExpertReviewed ? 'Curriculum verified and peer-reviewed.' : 'Authored learning module.',
      ],
      sourceAttribution: lesson.sourceAttribution || {
        source: 'VisiOS Visual Authoring Studio',
        title: lesson.title,
      },
      learningObjectives: lesson.learningObjectives,
      overview: lesson.overview,
      motivation: lesson.motivation || lesson.overview,
      prerequisites: lesson.prerequisites || [],
      assumptions: lesson.assumptions || [],
      variables: [],
      interactiveParameters: [],
      defaultExperimentState: {
        parameters: vConfig?.parameters || {},
        calculatedOutputs: {
          status: 'Published Module',
          version: `v${lesson.publishedVersion || lesson.version}`,
        },
        outputFormulas: {},
        statusMessage: `Authored Module v${lesson.publishedVersion || lesson.version} loaded.`,
      },
      derivationSteps: [],
      derivationSummary: 'Authored conceptual step-by-step walkthrough.',
      symbolicVerificationNote: 'Authored content verified through VisiOS structural schema validator.',
      visualizationPlan,
      workedExamples: lesson.workedExamples || [],
      applications: [
        'Curriculum-verified study module built in VisiOS Visual Authoring Studio.',
      ],
      limitations: subjectDef.knownLimitations || [],
      practiceQuestions,
      recommendedNextConcepts: [],
    };
  }

  /**
   * Resets all in-memory authored lessons (for test cleanup).
   */
  public static async clearAllLessons(): Promise<void> {
    this.init();
    this.memoryLessons.clear();
    this.persistToStorage();
  }
}

