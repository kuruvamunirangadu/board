/**
 * VisiOS — Phase 2: Typed Intent, Disambiguation & Smart Routing Contracts
 */

import { TopicDomain, TargetEngine } from './types';

export type StudentIntent =
  | 'explain_concept'
  | 'solve_problem'
  | 'derive_formula'
  | 'prove_theorem'
  | 'plot_function'
  | 'visualize_concept'
  | 'run_simulation'
  | 'trace_algorithm'
  | 'compare_scenarios'
  | 'analyze_document'
  | 'generate_practice'
  | 'continue_learning'
  | 'clarify_request'
  | 'unsupported';

export interface DisambiguationContext {
  subject?: string;
  activeLessonId?: string;
  documentId?: string;
  selectedCanvasObjectId?: string;
  previousIntent?: StudentIntent;
  workspaceId?: string;
}

export interface NormalizedMathExpression {
  isMathematical: boolean;
  rawExpression: string;
  normalizedSyntax: string;
  mathType?: 'linear_equation' | 'fraction' | 'binomial' | 'pythagorean' | 'trigonometric' | 'quadratic' | 'system' | 'malformed';
  parameters: Record<string, number | string>;
  isValid: boolean;
  validationError?: string;
  intentHint?: StudentIntent;
}

export interface InterpretedLearningIntent {
  originalInput: string;
  normalizedInput: string;
  primaryIntent: StudentIntent;
  additionalIntents?: StudentIntent[];
  domain: TopicDomain;
  subject: string;
  topic: string;
  confidence: number;
  isAmbiguous: boolean;
  ambiguityReason?: string;
  clarificationOptions?: Array<{
    label: string;
    intendedMeaning: string;
    targetQuery: string;
    impliedDomain: TopicDomain;
    impliedIntent: StudentIntent;
  }>;
  mathParsing?: NormalizedMathExpression;
  requiredParameters: string[];
  resolvedParameters: Record<string, number | string | boolean>;
  missingParameters: string[];
  parameterSources: Record<string, 'explicit_input' | 'context' | 'engine_default'>;
  candidateCapabilityIds: string[];
  limitations: string[];
  suggestedAction?: string;
}

export interface MultiIntentExecutionStep {
  stepId: string;
  order: number;
  intent: StudentIntent;
  capabilityId: string;
  engineType: TargetEngine;
  description: string;
  inputPayload: Record<string, any>;
  dependsOnStepId?: string;
  status: 'pending' | 'success' | 'failed' | 'skipped';
  result?: any;
  error?: string;
}

export interface MultiIntentExecutionPlan {
  planId: string;
  originalQuery: string;
  steps: MultiIntentExecutionStep[];
  isMultiIntent: boolean;
  canExecuteConcurrently: boolean;
  summary: string;
}

