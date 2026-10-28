import {
  ContentPackDraft,
  ContentVersionSnapshot,
  PublicationRecord,
} from '@/types/authoring';
import { AIGenerationProposal } from '@/types/ai-authoring';
import { MultimodalIngestionResult } from '@/types/multimodal';
import {
  SubjectDefinition,
  TopicDefinition,
  ConceptDefinition,
  LearningResource,
  ContentManifest,
  ValidationResult,
  ValidationDiagnostic,
  SubjectCategory,
} from '@/types/knowledge';
import { ConceptDependency } from '@/types/learning-path';
import { ConceptDependencyGraph } from '@/features/learning-paths/concept-graph';
import { contentRegistry } from '@/features/knowledge/registry/content-registry';
import { defaultCapabilityRegistry } from '@/features/knowledge/registry/capability-registry';

const DRAFTS_STORAGE_KEY = 'visios_content_drafts_v1';
const SNAPSHOTS_STORAGE_KEY = 'visios_content_snapshots_v1';
const PUBLISHED_PACKS_STORAGE_KEY = 'visios_published_packs_v1';

export class AuthoringService {
  private drafts: Map<string, ContentPackDraft> = new Map();
  private snapshots: Map<string, ContentVersionSnapshot[]> = new Map();
  private publications: Map<string, PublicationRecord> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.init();
  }

  private init(): void {
    if (this.initialized) return;

    // Load from LocalStorage if available
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedDrafts = localStorage.getItem(DRAFTS_STORAGE_KEY);
        if (storedDrafts) {
          const parsed = JSON.parse(storedDrafts) as ContentPackDraft[];
          parsed.forEach((d) => this.drafts.set(d.id, d));
        }

        const storedSnapshots = localStorage.getItem(SNAPSHOTS_STORAGE_KEY);
        if (storedSnapshots) {
          const parsed = JSON.parse(storedSnapshots) as Record<string, ContentVersionSnapshot[]>;
          Object.entries(parsed).forEach(([packId, list]) => this.snapshots.set(packId, list));
        }

        const storedPublications = localStorage.getItem(PUBLISHED_PACKS_STORAGE_KEY);
        if (storedPublications) {
          const parsed = JSON.parse(storedPublications) as PublicationRecord[];
          parsed.forEach((p) => {
            this.publications.set(p.packId, p);
            // Register into live contentRegistry
            contentRegistry.registerPack({
              subjects: p.manifest.subjects,
              topics: p.manifest.topics,
              concepts: p.manifest.concepts,
              resources: p.manifest.resources,
            });
          });
        }
      } catch (e) {
        console.warn('Failed to load authoring data from localStorage:', e);
      }
    }

    // If no drafts exist, create a rich starter template for rapid demonstration
    if (this.drafts.size === 0) {
      const starterDraft = this.createStarterDraft();
      this.drafts.set(starterDraft.id, starterDraft);
      this.persistDrafts();
    }

    this.initialized = true;
  }

  // --- Draft Persistence Helpers ---

  private persistDrafts(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const list = Array.from(this.drafts.values());
        localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.warn('Failed to persist drafts to localStorage:', e);
      }
    }
  }

  private persistSnapshots(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const obj: Record<string, ContentVersionSnapshot[]> = {};
        this.snapshots.forEach((v, k) => {
          obj[k] = v;
        });
        localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(obj));
      } catch (e) {
        console.warn('Failed to persist snapshots to localStorage:', e);
      }
    }
  }

  private persistPublications(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const list = Array.from(this.publications.values());
        localStorage.setItem(PUBLISHED_PACKS_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.warn('Failed to persist publications to localStorage:', e);
      }
    }
  }

  // --- Draft Management ---

  listDrafts(): ContentPackDraft[] {
    return Array.from(this.drafts.values()).sort((a, b) => b.lastModified - a.lastModified);
  }

  getDraft(id: string): ContentPackDraft | undefined {
    return this.drafts.get(id);
  }

  createDraft(params: {
    title: string;
    description: string;
    category: SubjectCategory;
    iconName?: string;
  }): ContentPackDraft {
    const subjectId = `subject_${params.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
    const now = Date.now();

    const subject: SubjectDefinition = {
      id: subjectId,
      displayName: params.title,
      description: params.description,
      category: params.category,
      iconName: params.iconName || 'BookOpen',
      topicIds: [],
      contentVersion: '0.1.0',
      publicationStatus: 'draft',
    };

    const draft: ContentPackDraft = {
      id: subjectId,
      title: params.title,
      description: params.description,
      category: params.category,
      iconName: params.iconName || 'BookOpen',
      version: '0.1.0',
      publicationStatus: 'draft',
      createdAt: now,
      lastModified: now,
      subject,
      topics: [],
      concepts: [],
      dependencies: [],
      resources: [],
      validation: { isValid: true, diagnostics: [] },
    };

    draft.validation = this.validateDraft(draft);
    this.drafts.set(draft.id, draft);
    this.persistDrafts();
    return draft;
  }

  saveDraft(draft: ContentPackDraft): ContentPackDraft {
    draft.lastModified = Date.now();
    // Sync subject topicIds
    draft.subject.topicIds = draft.topics.map((t) => t.id);
    if (!draft.subject.recommendedStartingTopicId && draft.topics.length > 0) {
      draft.subject.recommendedStartingTopicId = draft.topics[0].id;
    }

    // Sync topic conceptIds
    draft.topics.forEach((t) => {
      t.conceptIds = draft.concepts.filter((c) => c.parentTopicId === t.id).map((c) => c.id);
    });

    // Run real-time validation
    draft.validation = this.validateDraft(draft);

    this.drafts.set(draft.id, draft);
    this.persistDrafts();
    return draft;
  }

  deleteDraft(id: string): boolean {
    const deleted = this.drafts.delete(id);
    if (deleted) {
      this.snapshots.delete(id);
      this.persistDrafts();
      this.persistSnapshots();
    }
    return deleted;
  }

  duplicateDraft(id: string): ContentPackDraft | undefined {
    const original = this.drafts.get(id);
    if (!original) return undefined;

    const newId = `${original.id}_copy_${Date.now().toString(36)}`;
    const cloned: ContentPackDraft = JSON.parse(JSON.stringify(original));
    cloned.id = newId;
    cloned.title = `${original.title} (Copy)`;
    cloned.subject.id = newId;
    cloned.subject.displayName = `${original.subject.displayName} (Copy)`;
    cloned.createdAt = Date.now();
    cloned.lastModified = Date.now();
    cloned.publicationStatus = 'draft';
    cloned.version = '0.1.0';

    cloned.validation = this.validateDraft(cloned);
    this.drafts.set(newId, cloned);
    this.persistDrafts();
    return cloned;
  }

  // --- Topic & Concept Operations ---

  addTopic(
    draftId: string,
    params: { title: string; description: string; difficultyLevel?: 'introductory' | 'intermediate' | 'advanced' }
  ): ContentPackDraft | undefined {
    const draft = this.drafts.get(draftId);
    if (!draft) return undefined;

    const topicId = `topic_${draft.id}_${params.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
    const newTopic: TopicDefinition = {
      id: topicId,
      parentSubjectId: draft.subject.id,
      title: params.title,
      description: params.description,
      conceptIds: [],
      learningObjectives: ['Understand key principles', 'Analyze core components'],
      difficultyLevel: params.difficultyLevel || 'introductory',
      contentVersion: draft.version,
      publicationStatus: 'draft',
    };

    draft.topics.push(newTopic);
    return this.saveDraft(draft);
  }

  removeTopic(draftId: string, topicId: string): ContentPackDraft | undefined {
    const draft = this.drafts.get(draftId);
    if (!draft) return undefined;

    draft.topics = draft.topics.filter((t) => t.id !== topicId);
    // Remove all concepts in this topic
    const conceptsToRemove = draft.concepts.filter((c) => c.parentTopicId === topicId).map((c) => c.id);
    draft.concepts = draft.concepts.filter((c) => c.parentTopicId !== topicId);

    // Remove dependencies involving removed concepts
    draft.dependencies = draft.dependencies.filter(
      (d) => !conceptsToRemove.includes(d.sourceConceptId) && !conceptsToRemove.includes(d.dependentConceptId)
    );

    // Remove concept prerequisites
    draft.concepts.forEach((c) => {
      c.prerequisiteConceptIds = c.prerequisiteConceptIds.filter((id) => !conceptsToRemove.includes(id));
    });

    return this.saveDraft(draft);
  }

  addConcept(
    draftId: string,
    topicId: string,
    params: {
      title: string;
      description: string;
      estimatedMinutes?: number;
      difficultyLevel?: 'introductory' | 'intermediate' | 'advanced';
      learningObjectives?: string[];
      prerequisiteConceptIds?: string[];
      supportedVisualizations?: ('diagram' | 'note' | 'model3d' | 'simulation' | 'chart')[];
      requiredCapability?: string;
    }
  ): ContentPackDraft | undefined {
    const draft = this.drafts.get(draftId);
    if (!draft) return undefined;

    const conceptId = `concept_${draft.id}_${params.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
    const newConcept: ConceptDefinition = {
      id: conceptId,
      parentTopicId: topicId,
      title: params.title,
      description: params.description,
      estimatedMinutes: params.estimatedMinutes || 15,
      difficultyLevel: params.difficultyLevel || 'introductory',
      learningObjectives: params.learningObjectives || ['Master fundamental definitions and behavior'],
      prerequisiteConceptIds: params.prerequisiteConceptIds || [],
      supportedVisualizations: params.supportedVisualizations || ['diagram', 'note'],
      requiredCapability: params.requiredCapability,
      contentVersion: draft.version,
      publicationStatus: 'draft',
    };

    draft.concepts.push(newConcept);

    // Sync dependencies
    if (params.prerequisiteConceptIds) {
      params.prerequisiteConceptIds.forEach((prereqId) => {
        if (!draft.dependencies.some((d) => d.sourceConceptId === prereqId && d.dependentConceptId === conceptId)) {
          draft.dependencies.push({
            sourceConceptId: prereqId,
            dependentConceptId: conceptId,
            dependencyType: 'prerequisite',
            rationale: `Foundational prerequisite for ${newConcept.title}`,
            strength: 'essential',
          });
        }
      });
    }

    return this.saveDraft(draft);
  }

  removeConcept(draftId: string, conceptId: string): ContentPackDraft | undefined {
    const draft = this.drafts.get(draftId);
    if (!draft) return undefined;

    draft.concepts = draft.concepts.filter((c) => c.id !== conceptId);
    draft.dependencies = draft.dependencies.filter(
      (d) => d.sourceConceptId !== conceptId && d.dependentConceptId !== conceptId
    );

    draft.concepts.forEach((c) => {
      c.prerequisiteConceptIds = c.prerequisiteConceptIds.filter((id) => id !== conceptId);
    });

    draft.resources.forEach((r) => {
      r.associatedConceptIds = r.associatedConceptIds.filter((id) => id !== conceptId);
    });

    return this.saveDraft(draft);
  }

  togglePrerequisite(
    draftId: string,
    sourceConceptId: string,
    targetConceptId: string,
    strength: 'essential' | 'recommended' = 'essential'
  ): ContentPackDraft | undefined {
    const draft = this.drafts.get(draftId);
    if (!draft) return undefined;

    const targetConcept = draft.concepts.find((c) => c.id === targetConceptId);
    if (!targetConcept) return draft;

    const existingIndex = draft.dependencies.findIndex(
      (d) => d.sourceConceptId === sourceConceptId && d.dependentConceptId === targetConceptId
    );

    if (existingIndex >= 0) {
      // Remove prerequisite
      draft.dependencies.splice(existingIndex, 1);
      targetConcept.prerequisiteConceptIds = targetConcept.prerequisiteConceptIds.filter(
        (id) => id !== sourceConceptId
      );
    } else {
      // Add prerequisite
      draft.dependencies.push({
        sourceConceptId,
        dependentConceptId: targetConceptId,
        dependencyType: 'prerequisite',
        strength,
        rationale: `Foundational prerequisite for ${targetConcept.title}`,
      });
      if (!targetConcept.prerequisiteConceptIds.includes(sourceConceptId)) {
        targetConcept.prerequisiteConceptIds.push(sourceConceptId);
      }
    }

    return this.saveDraft(draft);
  }

  /**
   * Imports an AI-generated learning module proposal into an existing draft or creates a new draft pack.
   * Maps temporary IDs to permanent registry IDs and preserves all validated dependencies.
   */
  importProposalToDraft(
    targetDraftId: string | undefined,
    proposal: AIGenerationProposal,
    acceptedTempIds?: string[]
  ): ContentPackDraft {
    let draft: ContentPackDraft;
    if (targetDraftId && this.drafts.has(targetDraftId)) {
      draft = this.drafts.get(targetDraftId)!;
    } else {
      draft = this.createDraft({
        title: proposal.topicTitle,
        description: `AI-assisted learning module for ${proposal.topicTitle}. Generated via VisiOS AI Assistant.`,
        category: proposal.subjectCategory,
      });
    }

    // Step 1: Ensure at least one topic exists
    let mainTopicId = draft.topics[0]?.id;
    if (!mainTopicId) {
      const topicId = `topic_${draft.id}_main_${Date.now().toString(36)}`;
      draft.topics.push({
        id: topicId,
        parentSubjectId: draft.subject.id,
        title: proposal.topicTitle,
        description: `Core concepts and learning paths for ${proposal.topicTitle}`,
        conceptIds: [],
        learningObjectives: ['Understand fundamental concepts', 'Explore interactive simulations'],
        difficultyLevel: 'introductory',
        contentVersion: draft.version,
        publicationStatus: 'draft',
      });
      mainTopicId = topicId;
    }

    // Filter concepts if accepted list provided
    const conceptsToImport = acceptedTempIds 
      ? proposal.concepts.filter((c) => acceptedTempIds.includes(c.tempId))
      : proposal.concepts.filter((c) => c.reviewStatus !== 'rejected');

    // Mapping table: tempId -> newStableConceptId
    const idMap = new Map<string, string>();
    conceptsToImport.forEach((c) => {
      const stableId = `concept_${draft.id}_${c.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36).slice(-4)}`;
      idMap.set(c.tempId, stableId);
    });

    // Step 2: Convert and append concepts
    conceptsToImport.forEach((c) => {
      const stableId = idMap.get(c.tempId)!;
      const mappedPrereqs = (c.proposedPrerequisiteTempIds || [])
        .map((pTempId) => idMap.get(pTempId))
        .filter((id): id is string => id !== undefined);

      const newConcept: ConceptDefinition = {
        id: stableId,
        parentTopicId: mainTopicId!,
        title: c.title,
        description: c.explanation,
        estimatedMinutes: c.estimatedMinutes || 15,
        difficultyLevel: c.difficultyLevel,
        learningObjectives: c.learningObjectives || [],
        prerequisiteConceptIds: mappedPrereqs,
        supportedVisualizations: c.suggestedVisualizations || ['diagram', 'note'],
        requiredCapability: c.requiredCapability,
        knowledgeCheck: c.knowledgeCheck,
        contentVersion: draft.version,
        publicationStatus: 'draft',
      };

      // Avoid duplicating if already present
      if (!draft.concepts.some((dc) => dc.title === c.title)) {
        draft.concepts.push(newConcept);
      }
    });

    // Step 3: Convert dependencies
    proposal.dependencies.forEach((d) => {
      const src = idMap.get(d.sourceTempId);
      const tgt = idMap.get(d.dependentTempId);
      if (src && tgt && d.status !== 'rejected') {
        if (!draft.dependencies.some((dd) => dd.sourceConceptId === src && dd.dependentConceptId === tgt)) {
          draft.dependencies.push({
            sourceConceptId: src,
            dependentConceptId: tgt,
            dependencyType: 'prerequisite',
            rationale: d.rationale || 'Prerequisite relationship',
            strength: d.strength || 'essential',
          });
        }
      }
    });

    // Step 4: Convert resources
    proposal.resources.forEach((r) => {
      if (r.status !== 'rejected') {
        const mappedAssociated = r.associatedTempIds
          .map((tId) => idMap.get(tId))
          .filter((id): id is string => id !== undefined);

        if (mappedAssociated.length > 0) {
          const newRes: LearningResource = {
            id: `resource_${draft.id}_${Date.now().toString(36)}_${Math.random().toString(36).slice(-3)}`,
            resourceType: r.resourceType,
            associatedConceptIds: mappedAssociated,
            title: r.title,
            description: r.description,
            requiredCapability: r.requiredCapability,
            capabilityStatus: r.capabilityStatus,
            contentVersion: draft.version,
          };
          draft.resources.push(newRes);
        }
      }
    });

    return this.saveDraft(draft);
  }

  /**
   * Imports an ingested multimodal document's grounded concepts into a draft learning pack.
   */
  importMultimodalResultToDraft(
    targetDraftId: string | undefined,
    ingestion: MultimodalIngestionResult
  ): ContentPackDraft {
    let draft: ContentPackDraft;
    if (targetDraftId && this.drafts.has(targetDraftId)) {
      draft = this.drafts.get(targetDraftId)!;
    } else {
      draft = this.createDraft({
        title: ingestion.suggestedTopicTitle,
        description: `Source-grounded learning pack synthesized from "${ingestion.document.filename}".`,
        category: ingestion.suggestedCategory,
      });
    }

    // Step 1: Ensure main topic exists
    let topicId = draft.topics[0]?.id;
    if (!topicId) {
      topicId = `topic_${draft.id}_${Date.now().toString(36)}`;
      draft.topics.push({
        id: topicId,
        parentSubjectId: draft.subject.id,
        title: ingestion.suggestedTopicTitle,
        description: `Grounded module from ${ingestion.document.filename}`,
        conceptIds: [],
        learningObjectives: ['Explore extracted concepts', 'Verify claims against source citations'],
        difficultyLevel: 'introductory',
        contentVersion: draft.version,
        publicationStatus: 'draft',
      });
    }

    // Step 2: Convert grounded concepts
    ingestion.concepts.forEach((gc, idx) => {
      const stableConceptId = `concept_${draft.id}_${gc.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36).slice(-4)}_${idx}`;
      
      const newConcept: ConceptDefinition = {
        id: stableConceptId,
        parentTopicId: topicId!,
        title: gc.title,
        description: gc.explanation,
        estimatedMinutes: gc.estimatedMinutes || 15,
        difficultyLevel: gc.difficultyLevel,
        learningObjectives: gc.learningObjectives || [],
        prerequisiteConceptIds: [],
        supportedVisualizations: gc.suggestedVisualizations || ['diagram', 'note'],
        requiredCapability: gc.requiredCapability || '2d.whiteboard',
        knowledgeCheck: gc.knowledgeCheck ? {
          question: gc.knowledgeCheck.question,
          options: gc.knowledgeCheck.options,
          correctIndex: gc.knowledgeCheck.correctIndex,
          explanation: gc.knowledgeCheck.explanation,
        } : undefined,
        contentVersion: draft.version,
        publicationStatus: 'draft',
      };

      draft.concepts.push(newConcept);
    });

    return this.saveDraft(draft);
  }

  // --- Validation Engine ---

  validateDraft(draft: ContentPackDraft): ValidationResult {
    const diagnostics: ValidationDiagnostic[] = [];
    const subjectIds = new Set<string>([draft.subject.id]);
    const topicIds = new Set<string>();
    const conceptIds = new Set<string>();

    if (!draft.title.trim()) {
      diagnostics.push({
        type: 'error',
        entityId: draft.id,
        entityType: 'subject',
        message: 'Content pack must have a non-empty title.',
      });
    }

    if (draft.topics.length === 0) {
      diagnostics.push({
        type: 'warning',
        entityId: draft.id,
        entityType: 'subject',
        message: 'Content pack currently has no topics defined.',
      });
    }

    // 1. Check Topics
    for (const t of draft.topics) {
      if (!t.title.trim()) {
        diagnostics.push({
          type: 'error',
          entityId: t.id,
          entityType: 'topic',
          message: `Topic ${t.id} has an empty title.`,
        });
      }
      if (topicIds.has(t.id)) {
        diagnostics.push({
          type: 'error',
          entityId: t.id,
          entityType: 'topic',
          message: `Duplicate topic ID detected: ${t.id}`,
        });
      }
      topicIds.add(t.id);

      if (!subjectIds.has(t.parentSubjectId)) {
        diagnostics.push({
          type: 'error',
          entityId: t.id,
          entityType: 'topic',
          message: `Topic ${t.title} references invalid parent subject ID: ${t.parentSubjectId}`,
        });
      }
    }

    // 2. Check Concepts
    for (const c of draft.concepts) {
      if (!c.title.trim()) {
        diagnostics.push({
          type: 'error',
          entityId: c.id,
          entityType: 'concept',
          message: `Concept ${c.id} has an empty title.`,
        });
      }
      if (conceptIds.has(c.id)) {
        diagnostics.push({
          type: 'error',
          entityId: c.id,
          entityType: 'concept',
          message: `Duplicate concept ID detected: ${c.id}`,
        });
      }
      conceptIds.add(c.id);

      if (!topicIds.has(c.parentTopicId)) {
        diagnostics.push({
          type: 'error',
          entityId: c.id,
          entityType: 'concept',
          message: `Concept "${c.title}" references non-existent parent topic ID: ${c.parentTopicId}`,
        });
      }

      // Check required capability if specified
      if (c.requiredCapability) {
        const cap = defaultCapabilityRegistry.getCapability(c.requiredCapability);
        if (!cap) {
          diagnostics.push({
            type: 'error',
            entityId: c.id,
            entityType: 'concept',
            message: `Concept "${c.title}" specifies unknown capability: ${c.requiredCapability}`,
          });
        } else if (cap.status === 'unsupported') {
          diagnostics.push({
            type: 'error',
            entityId: c.id,
            entityType: 'concept',
            message: `Concept "${c.title}" relies on unsupported capability: ${cap.name}`,
          });
        } else if (cap.status === 'planned') {
          diagnostics.push({
            type: 'warning',
            entityId: c.id,
            entityType: 'concept',
            message: `Concept "${c.title}" uses planned capability "${cap.name}" (not yet fully operational in production).`,
          });
        }
      }

      // Check knowledge check structure if present
      if (c.knowledgeCheck) {
        if (!c.knowledgeCheck.question.trim()) {
          diagnostics.push({
            type: 'error',
            entityId: c.id,
            entityType: 'concept',
            message: `Concept "${c.title}" knowledge check has an empty question.`,
          });
        }
        if (c.knowledgeCheck.options.length < 2) {
          diagnostics.push({
            type: 'error',
            entityId: c.id,
            entityType: 'concept',
            message: `Concept "${c.title}" knowledge check must have at least 2 options.`,
          });
        }
        if (c.knowledgeCheck.correctIndex < 0 || c.knowledgeCheck.correctIndex >= c.knowledgeCheck.options.length) {
          diagnostics.push({
            type: 'error',
            entityId: c.id,
            entityType: 'concept',
            message: `Concept "${c.title}" knowledge check correctIndex is out of range.`,
          });
        }
      }
    }

    // 3. Validate Prerequisite References
    for (const c of draft.concepts) {
      for (const prereqId of c.prerequisiteConceptIds) {
        if (!conceptIds.has(prereqId)) {
          diagnostics.push({
            type: 'error',
            entityId: c.id,
            entityType: 'concept',
            message: `Concept "${c.title}" references missing prerequisite concept ID: ${prereqId}`,
          });
        }
      }
    }

    // 4. Circular Dependency Detection via ConceptDependencyGraph
    const graphConcepts = draft.concepts.map((c) => ({
      id: c.id,
      title: c.title,
      subject: c.parentTopicId,
      description: c.description || '',
      difficultyLevel: c.difficultyLevel,
      estimatedMinutes: c.estimatedMinutes || 15,
      prerequisiteIds: c.prerequisiteConceptIds || [],
      suggestedVisualizations: ['diagram' as const],
      learningObjectives: c.learningObjectives || [],
    }));

    const graph = new ConceptDependencyGraph(graphConcepts, draft.dependencies);
    const cycles = graph.detectCycles();
    if (cycles && cycles.length > 0) {
      cycles.forEach((cycle) => {
        const readableCycle = cycle
          .map((cid) => draft.concepts.find((c) => c.id === cid)?.title || cid)
          .join(' → ');
        diagnostics.push({
          type: 'error',
          entityType: 'concept',
          message: `Circular dependency detected: ${readableCycle}`,
        });
      });
    }

    const hasErrors = diagnostics.some((d) => d.type === 'error');
    return {
      isValid: !hasErrors,
      diagnostics,
    };
  }

  // --- Versioning & Snapshots ---

  createSnapshot(draftId: string, authorNotes?: string): ContentVersionSnapshot | undefined {
    const draft = this.drafts.get(draftId);
    if (!draft) return undefined;

    const snapshotId = `snap_${draft.id}_v${draft.version}_${Date.now()}`;
    const snapshot: ContentVersionSnapshot = {
      id: snapshotId,
      packId: draft.id,
      version: draft.version,
      timestamp: Date.now(),
      authorNotes: authorNotes || `Snapshot of version ${draft.version}`,
      snapshot: {
        subject: JSON.parse(JSON.stringify(draft.subject)),
        topics: JSON.parse(JSON.stringify(draft.topics)),
        concepts: JSON.parse(JSON.stringify(draft.concepts)),
        dependencies: JSON.parse(JSON.stringify(draft.dependencies)),
        resources: JSON.parse(JSON.stringify(draft.resources)),
      },
    };

    const existingList = this.snapshots.get(draft.id) || [];
    existingList.unshift(snapshot);
    this.snapshots.set(draft.id, existingList);
    this.persistSnapshots();
    return snapshot;
  }

  listSnapshots(draftId: string): ContentVersionSnapshot[] {
    return this.snapshots.get(draftId) || [];
  }

  restoreSnapshot(draftId: string, snapshotId: string): ContentPackDraft | undefined {
    const list = this.snapshots.get(draftId);
    if (!list) return undefined;

    const snapshot = list.find((s) => s.id === snapshotId);
    if (!snapshot) return undefined;

    const currentDraft = this.drafts.get(draftId);
    if (!currentDraft) return undefined;

    // Create an automatic safety snapshot of current state before rollback
    this.createSnapshot(draftId, `Auto-backup before restoring ${snapshot.version}`);

    currentDraft.subject = JSON.parse(JSON.stringify(snapshot.snapshot.subject));
    currentDraft.topics = JSON.parse(JSON.stringify(snapshot.snapshot.topics));
    currentDraft.concepts = JSON.parse(JSON.stringify(snapshot.snapshot.concepts));
    currentDraft.dependencies = JSON.parse(JSON.stringify(snapshot.snapshot.dependencies));
    currentDraft.resources = JSON.parse(JSON.stringify(snapshot.snapshot.resources));
    currentDraft.version = `${snapshot.version}-restored`;
    currentDraft.lastModified = Date.now();
    currentDraft.validation = this.validateDraft(currentDraft);

    this.drafts.set(draftId, currentDraft);
    this.persistDrafts();
    return currentDraft;
  }

  // --- Publication Pipeline ---

  publishDraft(
    draftId: string,
    bumpType: 'patch' | 'minor' | 'major' = 'minor'
  ): { success: boolean; publishedRecord?: PublicationRecord; errors?: string[] } {
    const draft = this.drafts.get(draftId);
    if (!draft) {
      return { success: false, errors: ['Draft pack not found'] };
    }

    // Step 1: Validate rigorously
    const validation = this.validateDraft(draft);
    if (!validation.isValid) {
      const errorMsgs = validation.diagnostics.filter((d) => d.type === 'error').map((d) => d.message);
      return { success: false, errors: errorMsgs };
    }

    // Step 2: Version bump
    const newVersion = this.bumpVersion(draft.version, bumpType);
    draft.version = newVersion;
    draft.publicationStatus = 'published';
    draft.subject.publicationStatus = 'published';
    draft.subject.contentVersion = newVersion;
    draft.topics.forEach((t) => {
      t.publicationStatus = 'published';
      t.contentVersion = newVersion;
    });
    draft.concepts.forEach((c) => {
      c.publicationStatus = 'published';
      c.contentVersion = newVersion;
    });

    // Step 3: Create publication snapshot
    this.createSnapshot(draftId, `Published Release v${newVersion}`);

    const manifest: ContentManifest = {
      manifestVersion: '1.0.0',
      subjects: [draft.subject],
      topics: draft.topics,
      concepts: draft.concepts,
      resources: draft.resources,
      capabilities: defaultCapabilityRegistry.listCapabilities(),
    };

    const pubRecord: PublicationRecord = {
      packId: draft.id,
      version: newVersion,
      publishedAt: Date.now(),
      manifest,
    };

    this.publications.set(draft.id, pubRecord);
    this.persistPublications();

    // Step 4: Register into live ContentRegistry
    contentRegistry.registerPack({
      subjects: [draft.subject],
      topics: draft.topics,
      concepts: draft.concepts,
      resources: draft.resources,
    });

    // Save updated draft state
    this.saveDraft(draft);

    return { success: true, publishedRecord: pubRecord };
  }

  listPublishedPacks(): PublicationRecord[] {
    return Array.from(this.publications.values()).sort((a, b) => b.publishedAt - a.publishedAt);
  }

  private bumpVersion(current: string, bump: 'patch' | 'minor' | 'major'): string {
    const parts = current.replace(/[^0-9.]/g, '').split('.').map((p) => parseInt(p, 10) || 0);
    while (parts.length < 3) parts.push(0);

    if (bump === 'major') {
      return `${parts[0] + 1}.0.0`;
    } else if (bump === 'minor') {
      return `${parts[0]}.${parts[1] + 1}.0`;
    } else {
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    }
  }

  // --- Starter Template Generator ---

  private createStarterDraft(): ContentPackDraft {
    const now = Date.now();
    const subjectId = 'subject_quantum_computing_draft';
    const topicId1 = 'topic_qc_foundations';
    const topicId2 = 'topic_qc_circuits';

    const subject: SubjectDefinition = {
      id: subjectId,
      displayName: 'Quantum Computing & Qubits',
      description: 'Explore quantum superpositions, entanglement, Hadamard gates, and quantum circuit architecture.',
      category: 'natural_sciences',
      iconName: 'Orbit',
      topicIds: [topicId1, topicId2],
      recommendedStartingTopicId: topicId1,
      contentVersion: '0.1.0',
      publicationStatus: 'draft',
    };

    const topics: TopicDefinition[] = [
      {
        id: topicId1,
        parentSubjectId: subjectId,
        title: 'Quantum Foundations & Qubits',
        description: 'From classical bits to quantum statevectors and Bloch spheres.',
        conceptIds: ['concept_qc_bit_vs_qubit', 'concept_qc_superposition'],
        learningObjectives: [
          'Understand quantum state representation |0⟩ and |1⟩',
          'Calculate superposition probability amplitudes',
        ],
        difficultyLevel: 'introductory',
        contentVersion: '0.1.0',
        publicationStatus: 'draft',
      },
      {
        id: topicId2,
        parentSubjectId: subjectId,
        title: 'Quantum Gates & Entanglement',
        description: 'Single-qubit unitary operations, Hadamard transforms, and Bell state generation.',
        conceptIds: ['concept_qc_hadamard_gate', 'concept_qc_bell_state'],
        learningObjectives: [
          'Apply unitary transformation matrices to qubit states',
          'Analyze Einstein-Podolsky-Rosen (EPR) entangled pairs',
        ],
        difficultyLevel: 'intermediate',
        contentVersion: '0.1.0',
        publicationStatus: 'draft',
      },
    ];

    const concepts: ConceptDefinition[] = [
      {
        id: 'concept_qc_bit_vs_qubit',
        parentTopicId: topicId1,
        title: 'Bits vs Qubits',
        description: 'Compare discrete binary bits with two-level quantum mechanical states described by statevectors.',
        difficultyLevel: 'introductory',
        estimatedMinutes: 12,
        learningObjectives: ['Define qubit Hilbert space', 'Express state vectors in Dirac bra-ket notation'],
        prerequisiteConceptIds: [],
        supportedVisualizations: ['diagram', 'note', 'model3d'],
        requiredCapability: '3d.heart', // standard 3D visual host
        knowledgeCheck: {
          question: 'What mathematical property allows a qubit to hold a linear combination of |0⟩ and |1⟩ simultaneously?',
          options: [
            'Quantum Superposition',
            'Classical Resistance',
            'Magnetic Hysteresis',
            'Binary Parity',
          ],
          correctIndex: 0,
          explanation: 'Superposition principle allows linear combinations α|0⟩ + β|1⟩ where |α|² + |β|² = 1.',
          hint: 'Think about wave interference and linear combinations.',
        },
        contentVersion: '0.1.0',
        publicationStatus: 'draft',
      },
      {
        id: 'concept_qc_superposition',
        parentTopicId: topicId1,
        title: 'Superposition & Measurement',
        description: 'Born rule probabilities and wavefunction collapse upon projective measurement.',
        difficultyLevel: 'introductory',
        estimatedMinutes: 15,
        learningObjectives: ['Calculate probability densities', 'Analyze state collapse'],
        prerequisiteConceptIds: ['concept_qc_bit_vs_qubit'],
        supportedVisualizations: ['diagram', 'chart', 'simulation'],
        requiredCapability: 'simulation.pendulum',
        knowledgeCheck: {
          question: 'If a qubit is in state (|0⟩ + |1⟩)/√2, what is the probability of measuring |1⟩?',
          options: ['25%', '50%', '75%', '100%'],
          correctIndex: 1,
          explanation: 'The probability is |1/√2|² = 1/2 = 50%.',
        },
        contentVersion: '0.1.0',
        publicationStatus: 'draft',
      },
      {
        id: 'concept_qc_hadamard_gate',
        parentTopicId: topicId2,
        title: 'Hadamard Transform Gate',
        description: 'Creates an equal superposition state from computational basis states |0⟩ and |1⟩.',
        difficultyLevel: 'intermediate',
        estimatedMinutes: 18,
        learningObjectives: ['Apply H-gate transformation', 'Map statevector trajectories on the Bloch sphere'],
        prerequisiteConceptIds: ['concept_qc_superposition'],
        supportedVisualizations: ['diagram', 'note'],
        knowledgeCheck: {
          question: 'What is the resulting state when applying a Hadamard gate H to state |0⟩?',
          options: ['|1⟩', '(|0⟩ + |1⟩)/√2', '(|0⟩ - |1⟩)/√2', '-|0⟩'],
          correctIndex: 1,
          explanation: 'H|0⟩ = (|0⟩ + |1⟩)/√2, commonly denoted as the |+⟩ state.',
        },
        contentVersion: '0.1.0',
        publicationStatus: 'draft',
      },
      {
        id: 'concept_qc_bell_state',
        parentTopicId: topicId2,
        title: 'Quantum Entanglement & Bell Pairs',
        description: 'Maximally entangled 2-qubit states where measurement of one immediately determines the other.',
        difficultyLevel: 'intermediate',
        estimatedMinutes: 20,
        learningObjectives: ['Construct CNOT + Hadamard Bell circuits', 'Verify Bell inequality violations'],
        prerequisiteConceptIds: ['concept_qc_hadamard_gate'],
        supportedVisualizations: ['diagram', 'chart', 'note'],
        contentVersion: '0.1.0',
        publicationStatus: 'draft',
      },
    ];

    const dependencies: ConceptDependency[] = [
      {
        sourceConceptId: 'concept_qc_bit_vs_qubit',
        dependentConceptId: 'concept_qc_superposition',
        dependencyType: 'prerequisite',
        strength: 'essential',
        rationale: 'Must understand single qubit state before studying superposition amplitudes.',
      },
      {
        sourceConceptId: 'concept_qc_superposition',
        dependentConceptId: 'concept_qc_hadamard_gate',
        dependencyType: 'prerequisite',
        strength: 'essential',
        rationale: 'Hadamard gate maps computational basis into equal superposition.',
      },
      {
        sourceConceptId: 'concept_qc_hadamard_gate',
        dependentConceptId: 'concept_qc_bell_state',
        dependencyType: 'prerequisite',
        strength: 'essential',
        rationale: 'Bell states require preparing a superposition before applying CNOT entangling gates.',
      },
    ];

    const resources: LearningResource[] = [
      {
        id: 'resource_qc_bloch_sphere',
        resourceType: '3d_model',
        associatedConceptIds: ['concept_qc_bit_vs_qubit', 'concept_qc_hadamard_gate'],
        title: 'Interactive 3D Bloch Sphere Visualizer',
        description: 'Rotate and inspect statevector coordinates (θ, φ) on the unit sphere.',
        requiredCapability: '3d.heart',
        capabilityStatus: 'available',
        contentVersion: '0.1.0',
      },
      {
        id: 'resource_qc_superposition_sim',
        resourceType: 'simulation',
        associatedConceptIds: ['concept_qc_superposition'],
        title: 'Harmonic Phase & Superposition Telemetry',
        description: 'Real-time phase oscillation representing quantum coherence vs decoherence.',
        requiredCapability: 'simulation.pendulum',
        capabilityStatus: 'available',
        contentVersion: '0.1.0',
      },
    ];

    const draft: ContentPackDraft = {
      id: subjectId,
      title: subject.displayName,
      description: subject.description,
      category: subject.category,
      iconName: subject.iconName,
      version: '0.1.0',
      publicationStatus: 'draft',
      createdAt: now,
      lastModified: now,
      subject,
      topics,
      concepts,
      dependencies,
      resources,
      validation: { isValid: true, diagnostics: [] },
    };

    draft.validation = this.validateDraft(draft);
    return draft;
  }
}

export const authoringService = new AuthoringService();
