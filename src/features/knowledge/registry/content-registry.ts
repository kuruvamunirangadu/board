import { 
  SubjectDefinition, 
  TopicDefinition, 
  ConceptDefinition, 
  LearningResource, 
  ContentManifest, 
  ValidationResult,
  ValidationDiagnostic
} from '@/types/knowledge';
import { REGISTERED_CAPABILITIES, CapabilityRegistry, defaultCapabilityRegistry } from './capability-registry';

import { PHYSICS_SUBJECT, PHYSICS_TOPICS, PHYSICS_CONCEPTS, PHYSICS_RESOURCES } from '../packs/physics-pack';
import { MATH_SUBJECT, MATH_TOPICS, MATH_CONCEPTS, MATH_RESOURCES } from '../packs/math-pack';
import { CS_SUBJECT, CS_TOPICS, CS_CONCEPTS, CS_RESOURCES } from '../packs/cs-pack';
import { ELECTRONICS_SUBJECT, ELECTRONICS_TOPICS, ELECTRONICS_CONCEPTS, ELECTRONICS_RESOURCES } from '../packs/electronics-pack';

export const DEFAULT_MANIFEST: ContentManifest = {
  manifestVersion: '1.0.0',
  subjects: [PHYSICS_SUBJECT, MATH_SUBJECT, CS_SUBJECT, ELECTRONICS_SUBJECT],
  topics: [...PHYSICS_TOPICS, ...MATH_TOPICS, ...CS_TOPICS, ...ELECTRONICS_TOPICS],
  concepts: [...PHYSICS_CONCEPTS, ...MATH_CONCEPTS, ...CS_CONCEPTS, ...ELECTRONICS_CONCEPTS],
  resources: [...PHYSICS_RESOURCES, ...MATH_RESOURCES, ...CS_RESOURCES, ...ELECTRONICS_RESOURCES],
  capabilities: REGISTERED_CAPABILITIES,
};

export interface SearchResult {
  type: 'subject' | 'topic' | 'concept';
  id: string;
  title: string;
  description: string;
  subjectName?: string;
  parentTopicTitle?: string;
}

export class ContentRegistry {
  private subjectsMap: Map<string, SubjectDefinition> = new Map();
  private topicsMap: Map<string, TopicDefinition> = new Map();
  private conceptsMap: Map<string, ConceptDefinition> = new Map();
  private resourcesMap: Map<string, LearningResource> = new Map();
  private capabilityRegistry: CapabilityRegistry;

  constructor(
    manifest: ContentManifest = DEFAULT_MANIFEST,
    capabilityRegistry: CapabilityRegistry = defaultCapabilityRegistry
  ) {
    this.capabilityRegistry = capabilityRegistry;
    this.loadManifest(manifest);
  }

  loadManifest(manifest: ContentManifest): ValidationResult {
    const validation = this.validateManifest(manifest);

    this.subjectsMap.clear();
    this.topicsMap.clear();
    this.conceptsMap.clear();
    this.resourcesMap.clear();

    manifest.subjects.forEach((s) => this.subjectsMap.set(s.id, s));
    manifest.topics.forEach((t) => this.topicsMap.set(t.id, t));
    manifest.concepts.forEach((c) => this.conceptsMap.set(c.id, c));
    manifest.resources.forEach((r) => this.resourcesMap.set(r.id, r));

    return validation;
  }

  /**
   * Dynamically merges and registers a new or updated content pack.
   */
  registerPack(pack: {
    subjects: SubjectDefinition[];
    topics: TopicDefinition[];
    concepts: ConceptDefinition[];
    resources: LearningResource[];
  }): ValidationResult {
    // Merge temporarily to validate whole graph
    const currentManifest = this.exportManifest();
    const merged: ContentManifest = {
      manifestVersion: currentManifest.manifestVersion,
      subjects: [
        ...currentManifest.subjects.filter((s) => !pack.subjects.some((ps) => ps.id === s.id)),
        ...pack.subjects,
      ],
      topics: [
        ...currentManifest.topics.filter((t) => !pack.topics.some((pt) => pt.id === t.id)),
        ...pack.topics,
      ],
      concepts: [
        ...currentManifest.concepts.filter((c) => !pack.concepts.some((pc) => pc.id === c.id)),
        ...pack.concepts,
      ],
      resources: [
        ...currentManifest.resources.filter((r) => !pack.resources.some((pr) => pr.id === r.id)),
        ...pack.resources,
      ],
      capabilities: this.capabilityRegistry.listCapabilities(),
    };

    const validation = this.validateManifest(merged);
    if (validation.isValid) {
      this.loadManifest(merged);
    }
    return validation;
  }

  /**
   * Removes a subject and all its associated topics, concepts, and resources.
   */
  removePack(subjectId: string): void {
    this.subjectsMap.delete(subjectId);
    const topicsToRemove = Array.from(this.topicsMap.values())
      .filter((t) => t.parentSubjectId === subjectId)
      .map((t) => t.id);

    topicsToRemove.forEach((tId) => this.topicsMap.delete(tId));

    const conceptsToRemove = Array.from(this.conceptsMap.values())
      .filter((c) => topicsToRemove.includes(c.parentTopicId))
      .map((c) => c.id);

    conceptsToRemove.forEach((cId) => this.conceptsMap.delete(cId));

    Array.from(this.resourcesMap.entries()).forEach(([rId, r]) => {
      const remainingConcepts = r.associatedConceptIds.filter((cid) => !conceptsToRemove.includes(cid));
      if (remainingConcepts.length === 0) {
        this.resourcesMap.delete(rId);
      } else {
        r.associatedConceptIds = remainingConcepts;
      }
    });
  }

  exportManifest(): ContentManifest {
    return {
      manifestVersion: '1.0.0',
      subjects: Array.from(this.subjectsMap.values()),
      topics: Array.from(this.topicsMap.values()),
      concepts: Array.from(this.conceptsMap.values()),
      resources: Array.from(this.resourcesMap.values()),
      capabilities: this.capabilityRegistry.listCapabilities(),
    };
  }

  // --- Read & Lookup Methods ---

  listSubjects(filter?: { category?: string }): SubjectDefinition[] {
    const list = Array.from(this.subjectsMap.values());
    if (filter?.category && filter.category !== 'all') {
      return list.filter((s) => s.category === filter.category);
    }
    return list;
  }

  getSubject(subjectId: string): SubjectDefinition | undefined {
    return this.subjectsMap.get(subjectId);
  }

  listTopics(subjectId?: string): TopicDefinition[] {
    const list = Array.from(this.topicsMap.values());
    if (subjectId) {
      return list.filter((t) => t.parentSubjectId === subjectId);
    }
    return list;
  }

  getTopic(topicId: string): TopicDefinition | undefined {
    return this.topicsMap.get(topicId);
  }

  getConcept(conceptId: string): ConceptDefinition | undefined {
    return this.conceptsMap.get(conceptId);
  }

  listConceptsForTopic(topicId: string): ConceptDefinition[] {
    return Array.from(this.conceptsMap.values()).filter((c) => c.parentTopicId === topicId);
  }

  getResourcesForConcept(conceptId: string): LearningResource[] {
    return Array.from(this.resourcesMap.values()).filter((r) =>
      r.associatedConceptIds.includes(conceptId)
    );
  }

  // --- Search Engine ---

  searchContent(query: string): SearchResult[] {
    if (!query || !query.trim()) return [];
    const q = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // 1. Search Subjects
    this.subjectsMap.forEach((s) => {
      if (s.displayName.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)) {
        results.push({
          type: 'subject',
          id: s.id,
          title: s.displayName,
          description: s.description,
        });
      }
    });

    // 2. Search Topics
    this.topicsMap.forEach((t) => {
      if (t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) {
        const parentSub = this.subjectsMap.get(t.parentSubjectId);
        results.push({
          type: 'topic',
          id: t.id,
          title: t.title,
          description: t.description,
          subjectName: parentSub?.displayName,
        });
      }
    });

    // 3. Search Concepts
    this.conceptsMap.forEach((c) => {
      if (c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)) {
        const parentTopic = this.topicsMap.get(c.parentTopicId);
        const parentSub = parentTopic ? this.subjectsMap.get(parentTopic.parentSubjectId) : undefined;
        results.push({
          type: 'concept',
          id: c.id,
          title: c.title,
          description: c.description,
          parentTopicTitle: parentTopic?.title,
          subjectName: parentSub?.displayName,
        });
      }
    });

    return results;
  }

  // --- Manifest Validation ---

  validateManifest(manifest: ContentManifest): ValidationResult {
    const diagnostics: ValidationDiagnostic[] = [];
    const subjectIds = new Set<string>();
    const topicIds = new Set<string>();
    const conceptIds = new Set<string>();

    // 1. Check Duplicate Subject IDs
    for (const s of manifest.subjects) {
      if (subjectIds.has(s.id)) {
        diagnostics.push({
          type: 'error',
          entityId: s.id,
          entityType: 'subject',
          message: `Duplicate subject ID detected: ${s.id}`,
        });
      }
      subjectIds.add(s.id);
    }

    // 2. Check Topics
    for (const t of manifest.topics) {
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
          message: `Topic ${t.id} references non-existent parent subject ID: ${t.parentSubjectId}`,
        });
      }
    }

    // 3. Check Concepts and Prerequisites
    for (const c of manifest.concepts) {
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
          message: `Concept ${c.id} references non-existent parent topic ID: ${c.parentTopicId}`,
        });
      }
    }

    // 4. Validate Prerequisite References
    for (const c of manifest.concepts) {
      for (const prereqId of c.prerequisiteConceptIds) {
        if (!conceptIds.has(prereqId)) {
          diagnostics.push({
            type: 'error',
            entityId: c.id,
            entityType: 'concept',
            message: `Concept ${c.id} references unknown prerequisite concept ID: ${prereqId}`,
          });
        }
      }
    }

    const hasErrors = diagnostics.some((d) => d.type === 'error');
    return {
      isValid: !hasErrors,
      diagnostics,
    };
  }
}

export const contentRegistry = new ContentRegistry();

