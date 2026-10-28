/**
 * VisiOS Milestone 19 — Explainable Adaptive Learning Engine
 * Deterministic, evidence-based learning intervention recommendation system.
 */

import {
  AdaptationRecommendation,
  InterventionType,
} from '@/types/research';
import { learnerKnowledgeModel } from './learner-knowledge-model';
import { VALIDATED_MISCONCEPTIONS } from './misconception-catalog';

export const ADAPTATION_ENGINE_VERSION = 'v1.0.0';

export interface AdaptationContext {
  participantId: string;
  conceptId: string;
  learningObjective: string;
  prerequisiteIds?: string[];
  learnerPreferences?: {
    preferredModality?: 'visual' | 'simulation' | 'worked_example' | 'text';
  };
}

export class ExplainableAdaptationEngine {
  /**
   * Determine the most suitable learning intervention based on empirical evidence.
   */
  public recommendIntervention(context: AdaptationContext): AdaptationRecommendation {
    const { participantId, conceptId, learningObjective, prerequisiteIds = [], learnerPreferences } = context;
    const mastery = learnerKnowledgeModel.evaluateConceptMastery(participantId, conceptId, prerequisiteIds);
    const evidenceList = learnerKnowledgeModel.getParticipantEvidence(participantId);
    const conceptEvidence = evidenceList.filter((e) => e.conceptId === conceptId);

    // RULE 1: Prerequisite Gap Detection
    if (prerequisiteIds.length > 0 && mastery.prerequisiteConfidence < 0.45) {
      const weakPrereqId = prerequisiteIds[0];
      return {
        recommendationId: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        participantId,
        conceptId,
        targetObjective: learningObjective,
        interventionType: 'prerequisite_review',
        resourceId: `res-prereq-${weakPrereqId}`,
        resourceTitle: `Prerequisite Review: Foundations for ${conceptId}`,
        resourcePayload: {
          type: 'review_summary',
          title: `Essential Foundations: ${weakPrereqId}`,
          content: `Before mastering ${learningObjective}, review the foundational properties of ${weakPrereqId}. Understanding core definitions will prevent compounding misconceptions.`,
        },
        humanReadableRationale: `Prerequisite mastery for [${weakPrereqId}] is currently estimated at ${(mastery.prerequisiteConfidence * 100).toFixed(0)}%, which is below the readiness threshold of 45%.`,
        evidenceTrail: [
          `Prerequisite confidence score: ${mastery.prerequisiteConfidence}`,
          `Evaluated prerequisite nodes: ${prerequisiteIds.join(', ')}`,
        ],
        triggeredRuleId: 'RULE-PREREQ-REMEDIATION',
        ruleVersion: ADAPTATION_ENGINE_VERSION,
        estimatedDifficultyReduction: 0.35,
        generatedAt: Date.now(),
      };
    }

    // RULE 2: Targeted Misconception Remediation
    if (mastery.activeMisconceptions.length > 0) {
      const targetMisconceptionId = mastery.activeMisconceptions[0];
      const misconceptionDef = VALIDATED_MISCONCEPTIONS[targetMisconceptionId];

      if (misconceptionDef) {
        return {
          recommendationId: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          participantId,
          conceptId,
          targetObjective: learningObjective,
          interventionType: misconceptionDef.remedialIntervention,
          resourceId: misconceptionDef.remedialResourceKey,
          resourceTitle: `Targeted Clarification: ${misconceptionDef.name}`,
          resourcePayload: {
            type: misconceptionDef.remedialIntervention === 'guided_simulation' ? 'simulation' : 'diagram',
            title: misconceptionDef.name,
            content: misconceptionDef.remedialExplanation,
            simulationParams: conceptId.includes('pendulum') ? { length: 2.0, gravity: 9.81, angle: 60, damping: 0.1 } : undefined,
          },
          humanReadableRationale: `Diagnostic response indicates the presence of [${misconceptionDef.name}]. Serving an explicit ${misconceptionDef.remedialIntervention.replace('_', ' ')} to disambiguate the underlying physical principle.`,
          evidenceTrail: [
            `Detected misconception tag: ${targetMisconceptionId}`,
            `Source reference: ${misconceptionDef.authoritativeSource}`,
            `Recent incorrect diagnostic selections mapped to this tag`,
          ],
          triggeredRuleId: 'RULE-MISCONCEPTION-TARGETED',
          ruleVersion: ADAPTATION_ENGINE_VERSION,
          estimatedDifficultyReduction: 0.45,
          generatedAt: Date.now(),
        };
      }
    }

    // RULE 3: Novice or Unassessed Scaffolding (2D Diagram / Simplified Structural Model)
    if (mastery.masteryStatus === 'unassessed' || mastery.masteryStatus === 'novice') {
      const preferred = learnerPreferences?.preferredModality;
      const interventionType: InterventionType = preferred === 'text' ? 'simpler_text' : 'labeled_2d_diagram';

      return {
        recommendationId: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        participantId,
        conceptId,
        targetObjective: learningObjective,
        interventionType,
        resourceId: `res-diag-${conceptId}`,
        resourceTitle: `Foundational Visual Model: ${conceptId}`,
        resourcePayload: {
          type: 'diagram',
          title: `Core Architecture of ${conceptId}`,
          content: `Visualizing the foundational components of ${learningObjective}. Focus on the core relationships before interacting with dynamic parameters.`,
        },
        humanReadableRationale: `Learner is in the novice/initial phase (uncertainty: ${(mastery.uncertaintyScore * 100).toFixed(0)}%). Presenting structured 2D schematic to establish spatial and conceptual reference.`,
        evidenceTrail: [
          `Current mastery status: ${mastery.masteryStatus}`,
          `Evidence count: ${conceptEvidence.length} items`,
          `Uncertainty metric: ${mastery.uncertaintyScore}`,
        ],
        triggeredRuleId: 'RULE-NOVICE-VISUAL-SCAFFOLDING',
        ruleVersion: ADAPTATION_ENGINE_VERSION,
        estimatedDifficultyReduction: 0.25,
        generatedAt: Date.now(),
      };
    }

    // RULE 4: Developing Mastery -> Interactive Guided Simulation
    if (mastery.masteryStatus === 'developing') {
      return {
        recommendationId: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        participantId,
        conceptId,
        targetObjective: learningObjective,
        interventionType: 'guided_simulation',
        resourceId: `res-sim-${conceptId}`,
        resourceTitle: `Dynamic Experimentation: ${conceptId}`,
        resourcePayload: {
          type: 'simulation',
          title: `Interactive Simulation Testbed`,
          content: `Explore variable interactions directly. Alter initial conditions and observe the resulting phase and time response in real time.`,
          simulationParams: { parameterScale: 1.5 },
        },
        humanReadableRationale: `Learner demonstrates developing foundational knowledge (${(mastery.estimatedMasteryProbability * 100).toFixed(0)}% estimated mastery). Recommending active parameter manipulation to reinforce causal mechanics.`,
        evidenceTrail: [
          `Estimated mastery probability: ${mastery.estimatedMasteryProbability}`,
          `Prior attempts recorded: ${conceptEvidence.length}`,
        ],
        triggeredRuleId: 'RULE-DEVELOPING-SIMULATION-EXPLORATION',
        ruleVersion: ADAPTATION_ENGINE_VERSION,
        estimatedDifficultyReduction: 0.20,
        generatedAt: Date.now(),
      };
    }

    // RULE 5: Proficient Mastery -> Targeted Practice / Challenge
    return {
      recommendationId: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      participantId,
      conceptId,
      targetObjective: learningObjective,
      interventionType: 'targeted_practice',
      resourceId: `res-practice-${conceptId}`,
      resourceTitle: `Advanced Transfer Problem: ${conceptId}`,
      resourcePayload: {
        type: 'worked_example',
        title: `Comprehensive Synthesis Exercise`,
        content: `Apply principles of ${learningObjective} to non-trivial edge cases and system perturbations.`,
      },
      humanReadableRationale: `Learner has attained proficient/mastered status (${(mastery.estimatedMasteryProbability * 100).toFixed(0)}%). Presenting synthesis challenge to solidify deep conceptual retention.`,
      evidenceTrail: [
        `Mastery status: ${mastery.masteryStatus}`,
        `Mastery probability: ${mastery.estimatedMasteryProbability}`,
      ],
      triggeredRuleId: 'RULE-PROFICIENT-PRACTICE',
      ruleVersion: ADAPTATION_ENGINE_VERSION,
      estimatedDifficultyReduction: 0.10,
      generatedAt: Date.now(),
    };
  }
}

export const explainableAdaptationEngine = new ExplainableAdaptationEngine();

