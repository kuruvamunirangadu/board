import { 
  AIGenerationProposal, 
  AIValidationReport, 
  DiagnosticItem, 
  AIConceptProposal 
} from '@/types/ai-authoring';
import { ConceptDependencyGraph } from '@/features/learning-paths/concept-graph';
import { defaultCapabilityRegistry } from '@/features/knowledge/registry/capability-registry';

export class AIVerifier {
  /**
   * Deterministically validates an AI-generated learning module proposal across 6 verification layers.
   */
  static verifyProposal(proposal: Partial<AIGenerationProposal>): AIValidationReport {
    const diagnostics: DiagnosticItem[] = [];

    // --- Layer A: Schema & Format Checks ---
    const layerA_issues: string[] = [];
    if (!proposal.topicTitle || !proposal.topicTitle.trim()) {
      layerA_issues.push('Proposal topicTitle is missing or empty.');
    }
    if (!proposal.concepts || !Array.isArray(proposal.concepts) || proposal.concepts.length === 0) {
      layerA_issues.push('Proposal must contain at least one concept definition.');
    }

    const concepts = proposal.concepts || [];
    concepts.forEach((c, idx) => {
      if (!c.tempId || !c.tempId.trim()) {
        layerA_issues.push(`Concept at index ${idx} is missing a temporary ID.`);
      }
      if (!c.title || !c.title.trim()) {
        layerA_issues.push(`Concept ${c.tempId || idx} is missing a title.`);
      }
      if (!c.explanation || !c.explanation.trim()) {
        layerA_issues.push(`Concept "${c.title || c.tempId}" is missing an explanation.`);
      }
      if (typeof c.estimatedMinutes !== 'number' || c.estimatedMinutes < 1 || c.estimatedMinutes > 300) {
        layerA_issues.push(`Concept "${c.title || c.tempId}" estimatedMinutes must be between 1 and 300.`);
      }
    });

    layerA_issues.forEach((issue) => {
      diagnostics.push({
        type: 'error',
        layer: 'Layer A (Schema)',
        message: issue,
      });
    });

    // --- Layer B: Referential Integrity ---
    const layerB_issues: string[] = [];
    const conceptIds = new Set<string>();
    
    concepts.forEach((c) => {
      if (conceptIds.has(c.tempId)) {
        layerB_issues.push(`Duplicate concept tempId detected: ${c.tempId}`);
      }
      conceptIds.add(c.tempId);
    });

    // Check prerequisite concept references
    concepts.forEach((c) => {
      (c.proposedPrerequisiteTempIds || []).forEach((prereqId) => {
        if (!conceptIds.has(prereqId)) {
          layerB_issues.push(
            `Concept "${c.title}" references non-existent prerequisite ID: ${prereqId}`
          );
        }
      });
    });

    // Check dependency list references
    const dependencies = proposal.dependencies || [];
    dependencies.forEach((d) => {
      if (!conceptIds.has(d.sourceTempId)) {
        layerB_issues.push(`Dependency references non-existent sourceTempId: ${d.sourceTempId}`);
      }
      if (!conceptIds.has(d.dependentTempId)) {
        layerB_issues.push(`Dependency references non-existent dependentTempId: ${d.dependentTempId}`);
      }
    });

    // Check resource associations
    const resources = proposal.resources || [];
    resources.forEach((r) => {
      (r.associatedTempIds || []).forEach((cid) => {
        if (!conceptIds.has(cid)) {
          layerB_issues.push(`Resource "${r.title}" references unknown concept ID: ${cid}`);
        }
      });
    });

    layerB_issues.forEach((issue) => {
      diagnostics.push({
        type: 'error',
        layer: 'Layer B (Referential)',
        message: issue,
      });
    });

    // --- Layer C: Graph Validation & Cycle Detection ---
    const layerC_issues: string[] = [];
    let hasCycles = false;
    let cycles: string[][] | undefined = undefined;

    if (concepts.length > 0) {
      const graphConcepts = concepts.map((c) => ({
        id: c.tempId,
        title: c.title,
        subject: proposal.subjectDisplayName || 'Topic',
        description: c.explanation,
        difficultyLevel: c.difficultyLevel || 'introductory',
        estimatedMinutes: c.estimatedMinutes || 15,
        prerequisiteIds: c.proposedPrerequisiteTempIds || [],
        suggestedVisualizations: ['diagram' as const],
        learningObjectives: c.learningObjectives || [],
      }));

      const graphDeps = dependencies.map((d) => ({
        sourceConceptId: d.sourceTempId,
        dependentConceptId: d.dependentTempId,
        dependencyType: 'prerequisite' as const,
        rationale: d.rationale || 'Prerequisite relationship',
        strength: d.strength || 'essential',
      }));

      const graph = new ConceptDependencyGraph(graphConcepts, graphDeps);
      const detectedCycles = graph.detectCycles();

      if (detectedCycles && detectedCycles.length > 0) {
        hasCycles = true;
        cycles = detectedCycles;
        detectedCycles.forEach((cyc) => {
          const names = cyc.map((cid) => concepts.find((c) => c.tempId === cid)?.title || cid).join(' → ');
          layerC_issues.push(`Circular dependency cycle detected: ${names}`);
          diagnostics.push({
            type: 'error',
            layer: 'Layer C (Graph)',
            message: `Circular dependency detected: ${names}`,
          });
        });
      }
    }

    // --- Layer D: Capability Validation ---
    const layerD_issues: string[] = [];
    let supportedCount = 0;
    let unsupportedCount = 0;

    concepts.forEach((c) => {
      if (c.requiredCapability) {
        const cap = defaultCapabilityRegistry.getCapability(c.requiredCapability);
        if (!cap || cap.status === 'unsupported') {
          unsupportedCount++;
          layerD_issues.push(
            `Concept "${c.title}" specifies unsupported or unregistered capability: ${c.requiredCapability}`
          );
          diagnostics.push({
            type: 'error',
            layer: 'Layer D (Capability)',
            message: `Unsupported capability: ${c.requiredCapability} on "${c.title}"`,
            entityId: c.tempId,
          });
        } else if (cap.status === 'planned') {
          supportedCount++;
          diagnostics.push({
            type: 'warning',
            layer: 'Layer D (Capability)',
            message: `Concept "${c.title}" relies on planned capability "${cap.name}" (not yet fully operational in production).`,
            entityId: c.tempId,
          });
        } else {
          supportedCount++;
        }
      }
    });

    resources.forEach((r) => {
      const cap = defaultCapabilityRegistry.getCapability(r.requiredCapability);
      if (!cap || cap.status === 'unsupported') {
        unsupportedCount++;
        r.isSupported = false;
        r.capabilityStatus = 'unsupported';
        layerD_issues.push(`Resource "${r.title}" requires unsupported capability: ${r.requiredCapability}`);
        diagnostics.push({
          type: 'error',
          layer: 'Layer D (Capability)',
          message: `Resource "${r.title}" requires unsupported capability: ${r.requiredCapability}`,
          entityId: r.tempId,
        });
      } else if (cap.status === 'planned') {
        r.isSupported = true;
        r.capabilityStatus = 'planned';
        supportedCount++;
        diagnostics.push({
          type: 'warning',
          layer: 'Layer D (Capability)',
          message: `Resource "${r.title}" uses planned capability "${cap.name}".`,
          entityId: r.tempId,
        });
      } else {
        r.isSupported = true;
        r.capabilityStatus = 'available';
        supportedCount++;
      }
    });

    // --- Layer E: Assessment Validation ---
    const layerE_issues: string[] = [];
    let questionsValidated = 0;

    concepts.forEach((c) => {
      if (c.knowledgeCheck) {
        questionsValidated++;
        const q = c.knowledgeCheck;
        if (!q.question || !q.question.trim()) {
          layerE_issues.push(`Concept "${c.title}" knowledge check has empty question text.`);
        }
        if (!Array.isArray(q.options) || q.options.length < 2) {
          layerE_issues.push(`Concept "${c.title}" quiz must contain at least 2 options.`);
        }
        if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || (q.options && q.correctIndex >= q.options.length)) {
          layerE_issues.push(`Concept "${c.title}" quiz correctIndex is out of range.`);
        }
        if (!q.explanation || !q.explanation.trim()) {
          layerE_issues.push(`Concept "${c.title}" quiz is missing answer explanation.`);
        }
      }
    });

    layerE_issues.forEach((issue) => {
      diagnostics.push({
        type: 'error',
        layer: 'Layer E (Assessment)',
        message: issue,
      });
    });

    // --- Layer F: Grounding & Factual Review Review Flags ---
    let requiresReviewCount = 0;
    concepts.forEach((c) => {
      if (c.factualReviewNeeded || !c.sources || c.sources.length === 0) {
        requiresReviewCount++;
        diagnostics.push({
          type: 'info',
          layer: 'Layer F (Factual)',
          message: `Concept "${c.title}" is AI-proposed and pending human factual review.`,
          entityId: c.tempId,
        });
      }
    });

    const hasErrors = diagnostics.some((d) => d.type === 'error');

    return {
      isValid: !hasErrors,
      layerA_Schema: { passed: layerA_issues.length === 0, issues: layerA_issues },
      layerB_Referential: { passed: layerB_issues.length === 0, issues: layerB_issues },
      layerC_Graph: { passed: !hasCycles, hasCycles, cycles, issues: layerC_issues },
      layerD_Capabilities: { passed: unsupportedCount === 0, supportedCount, unsupportedCount, issues: layerD_issues },
      layerE_Assessment: { passed: layerE_issues.length === 0, questionsValidated, issues: layerE_issues },
      layerF_FactualReview: {
        requiresReviewCount,
        notice: requiresReviewCount > 0 
          ? `${requiresReviewCount} concept(s) require human educator verification before publication.`
          : 'All concepts have verified evidence references.',
      },
      diagnostics,
    };
  }
}

