import { 
  Concept, 
  ConceptDependency, 
  LearningGoal, 
  LearningPath 
} from '@/types/learning-path';
import { ConceptDependencyGraph } from './concept-graph';
import { contentRegistry } from '../knowledge/registry/content-registry';
import { ConceptDefinition } from '@/types/knowledge';

export interface PathGenerationResult {
  goal: LearningGoal;
  path: LearningPath;
  concepts: Concept[];
  isCuratedFallback: boolean;
}

export class LearningPathGenerator {
  /**
   * Generates or retrieves a structured learning path with validated dependencies and concepts
   * directly from the unified Multi-Subject Content Registry.
   */
  static async generatePath(userGoalText: string): Promise<PathGenerationResult> {
    const normalized = (userGoalText || '').toLowerCase().trim();

    // 1. Check if userGoal matches an exact topic ID in the registry
    let targetTopic = contentRegistry.getTopic(userGoalText);

    // 2. If not an ID, search topics and subjects
    if (!targetTopic && normalized) {
      const allTopics = contentRegistry.listTopics();
      targetTopic = allTopics.find(
        (t) =>
          t.title.toLowerCase().includes(normalized) ||
          t.description.toLowerCase().includes(normalized) ||
          normalized.includes(t.title.toLowerCase())
      );

      // Search matching subjects if no direct topic matched
      if (!targetTopic) {
        const allSubjects = contentRegistry.listSubjects();
        const matchedSubject = allSubjects.find(
          (s) =>
            s.displayName.toLowerCase().includes(normalized) ||
            s.description.toLowerCase().includes(normalized) ||
            normalized.includes(s.displayName.toLowerCase())
        );
        if (matchedSubject && matchedSubject.topicIds.length > 0) {
          targetTopic = contentRegistry.getTopic(matchedSubject.topicIds[0]);
        }
      }
    }

    // 3. Default to Harmonic Oscillations & Pendulum Dynamics if query is empty or not matched
    if (!targetTopic) {
      targetTopic = contentRegistry.getTopic('topic-pendulum-dynamics') || contentRegistry.listTopics()[0];
    }

    // 4. Build Learning Path from Registry Topic & Concepts
    const registryConcepts = contentRegistry.listConceptsForTopic(targetTopic.id);
    const parentSubject = contentRegistry.getSubject(targetTopic.parentSubjectId);

    // Map registry ConceptDefinition to domain Concept
    const domainConcepts: Concept[] = registryConcepts.map((c: ConceptDefinition) => ({
      id: c.id,
      title: c.title,
      subject: parentSubject?.displayName || 'General',
      description: c.description,
      difficultyLevel: c.difficultyLevel,
      estimatedMinutes: c.estimatedMinutes,
      prerequisiteIds: c.prerequisiteConceptIds,
      suggestedVisualizations: c.supportedVisualizations as any,
      suggestedSimulations: c.supportedSimulations,
      learningObjectives: c.learningObjectives,
      knowledgeCheck: c.knowledgeCheck,
    }));

    // Build Concept Dependencies from prerequisites
    const dependencies: ConceptDependency[] = [];
    domainConcepts.forEach((c) => {
      c.prerequisiteIds.forEach((prereqId) => {
        dependencies.push({
          sourceConceptId: prereqId,
          dependentConceptId: c.id,
          dependencyType: 'prerequisite',
          rationale: `Foundational prerequisite for ${c.title}`,
          strength: 'essential',
        });
      });
    });

    // Compute Topological Order using Graph Engine
    const graph = new ConceptDependencyGraph(domainConcepts, dependencies);
    const topologicalOrder = graph.getTopologicalOrder();

    const goal: LearningGoal = {
      id: `goal-${targetTopic.id}-${Date.now()}`,
      title: targetTopic.title,
      description: targetTopic.description,
      subject: parentSubject?.displayName || 'General',
      targetConceptId: domainConcepts[domainConcepts.length - 1]?.id || targetTopic.id,
      targetDifficulty: targetTopic.difficultyLevel,
      createdAt: Date.now(),
      status: 'active',
    };

    const path: LearningPath = {
      id: `path-${targetTopic.id}-${Date.now()}`,
      goalId: goal.id,
      title: `${targetTopic.title} Learning Path`,
      subject: parentSubject?.displayName || 'General',
      conceptIds: topologicalOrder,
      dependencies,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isCurated: true,
    };

    return {
      goal,
      path,
      concepts: domainConcepts,
      isCuratedFallback: true,
    };
  }
}
