/**
 * VisiOS — Learning Plan Schema & Topic Relevance Validator
 * Step 4: Strict schema validation, topic-relevance verification, interactive control validation,
 * bounded single-attempt plan repair, and graceful fallback generation.
 */

import {
  LearningPlan,
  InteractiveParameter,
  RendererType,
  TopicClassificationResult,
  SourceAttribution,
} from './types';
import { VisualizationRegistry, CanonicalRendererType } from './VisualizationRegistry';
import { SubjectRegistry } from './SubjectRegistry';

export interface ValidationError {
  field: string;
  message: string;
  critical: boolean;
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedPlan?: LearningPlan;
}

export interface RelevanceValidationResult {
  isRelevant: boolean;
  issues: string[];
  suggestedFixes: string[];
}

export class LearningPlanValidator {
  private static readonly MAX_TEXT_LENGTH = 5000;
  private static readonly MAX_ARRAY_LENGTH = 50;
  private static readonly MAX_CONTROLS_COUNT = 20;

  private static readonly VALID_CATEGORIES = new Set([
    'algebra',
    'calculus',
    'physics',
    'geometry',
    'algorithm',
    'chemistry',
    'concept',
  ]);

  private static readonly VALID_CAPABILITY_LEVELS = new Set([
    'verified_and_tested',
    'partial_with_limitations',
    'ai_proposed_unverified',
    'unsupported',
  ]);

  private static readonly VALID_DOMAINS = new Set([
    'computer_science',
    'mathematics',
    'physics',
    'chemistry',
    'biology',
    'history',
    'general_knowledge',
    'other',
  ]);

  private static readonly VALID_INTENTS = new Set([
    'concept_learning',
    'formula_explanation',
    'derivation',
    'algorithm_learning',
    'factual_lookup',
    'interactive_simulation',
    'ambiguous_query',
  ]);

  private static readonly VALID_ENGINES = new Set([
    'math',
    'algorithm',
    'knowledge',
    'simulation',
    'local_ai',
    'clarification',
  ]);

  /**
   * 1. Schema Validator: Checks required fields, types, bounded sizes, URL safety, and control definitions.
   */
  public static validateSchema(raw: unknown): SchemaValidationResult {
    const errors: ValidationError[] = [];

    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return {
        isValid: false,
        errors: [{ field: 'root', message: 'Learning plan must be a non-null object', critical: true }],
      };
    }

    const candidate = raw as Record<string, any>;

    // 1. Required core text fields
    if (!candidate.conceptId || typeof candidate.conceptId !== 'string' || !candidate.conceptId.trim()) {
      errors.push({ field: 'conceptId', message: 'conceptId is required and must be a non-empty string', critical: true });
    }

    if (!candidate.title || typeof candidate.title !== 'string' || !candidate.title.trim()) {
      errors.push({ field: 'title', message: 'title is required and must be a non-empty string', critical: true });
    }

    if (!candidate.overview || typeof candidate.overview !== 'string' || !candidate.overview.trim()) {
      errors.push({ field: 'overview', message: 'overview is required and must be a non-empty explanation', critical: true });
    }

    if (candidate.overview && candidate.overview.length > this.MAX_TEXT_LENGTH) {
      errors.push({ field: 'overview', message: `overview exceeds maximum allowed length of ${this.MAX_TEXT_LENGTH}`, critical: false });
    }

    if (!candidate.motivation || typeof candidate.motivation !== 'string') {
      errors.push({ field: 'motivation', message: 'motivation must be a string', critical: false });
    }

    // 2. Category & Capability Level
    if (!candidate.category || !this.VALID_CATEGORIES.has(candidate.category)) {
      errors.push({
        field: 'category',
        message: `category must be one of: ${Array.from(this.VALID_CATEGORIES).join(', ')}`,
        critical: true,
      });
    }

    if (!candidate.capabilityLevel || !this.VALID_CAPABILITY_LEVELS.has(candidate.capabilityLevel)) {
      errors.push({
        field: 'capabilityLevel',
        message: `capabilityLevel must be one of: ${Array.from(this.VALID_CAPABILITY_LEVELS).join(', ')}`,
        critical: false,
      });
    }

    // 3. Classification metadata (if present)
    if (candidate.classification && typeof candidate.classification === 'object') {
      const cls = candidate.classification;
      if (cls.domain && !this.VALID_DOMAINS.has(cls.domain)) {
        errors.push({ field: 'classification.domain', message: `Invalid domain '${cls.domain}'`, critical: false });
      }
      if (cls.intent && !this.VALID_INTENTS.has(cls.intent)) {
        errors.push({ field: 'classification.intent', message: `Invalid intent '${cls.intent}'`, critical: false });
      }
      if (cls.engine && !this.VALID_ENGINES.has(cls.engine)) {
        errors.push({ field: 'classification.engine', message: `Invalid engine '${cls.engine}'`, critical: false });
      }
      if (cls.confidence !== undefined && (typeof cls.confidence !== 'number' || isNaN(cls.confidence) || cls.confidence < 0 || cls.confidence > 1)) {
        errors.push({ field: 'classification.confidence', message: 'confidence must be a number between 0 and 1', critical: false });
      }
    }

    // 4. Visualization Plan & Supported Renderer
    if (!candidate.visualizationPlan || typeof candidate.visualizationPlan !== 'object') {
      errors.push({ field: 'visualizationPlan', message: 'visualizationPlan is required and must be an object', critical: true });
    } else {
      const vPlan = candidate.visualizationPlan;
      if (!vPlan.rendererType || typeof vPlan.rendererType !== 'string') {
        errors.push({ field: 'visualizationPlan.rendererType', message: 'rendererType is required', critical: true });
      } else if (!VisualizationRegistry.isSupportedRenderer(vPlan.rendererType)) {
        errors.push({
          field: 'visualizationPlan.rendererType',
          message: `Unsupported visualization renderer '${vPlan.rendererType}'. Must be a registered renderer or alias.`,
          critical: true,
        });
      }
    }

    // 5. Interactive Parameter Controls
    if (candidate.interactiveParameters !== undefined) {
      if (!Array.isArray(candidate.interactiveParameters)) {
        errors.push({ field: 'interactiveParameters', message: 'interactiveParameters must be an array', critical: true });
      } else {
        if (candidate.interactiveParameters.length > this.MAX_CONTROLS_COUNT) {
          errors.push({ field: 'interactiveParameters', message: `Controls count exceeds maximum limit of ${this.MAX_CONTROLS_COUNT}`, critical: false });
        }
        for (let i = 0; i < candidate.interactiveParameters.length; i++) {
          const ctrl = candidate.interactiveParameters[i];
          const ctrlErr = this.validateControl(ctrl, i);
          if (ctrlErr) errors.push(ctrlErr);
        }
      }
    }

    // 6. Source Attribution & URL Safety
    if (candidate.sourceAttribution && typeof candidate.sourceAttribution === 'object') {
      const src = candidate.sourceAttribution;
      if (src.url) {
        if (typeof src.url !== 'string') {
          errors.push({ field: 'sourceAttribution.url', message: 'Source URL must be a string', critical: true });
        } else {
          const urlError = this.validateSourceUrl(src.url);
          if (urlError) errors.push({ field: 'sourceAttribution.url', message: urlError, critical: true });
        }
      }
    }

    // 7. Bounded Arrays
    const arrayFields = [
      'derivationSteps',
      'workedExamples',
      'variables',
      'assumptions',
      'applications',
      'limitations',
      'prerequisites',
      'practiceQuestions',
    ];

    for (const field of arrayFields) {
      if (candidate[field] !== undefined) {
        if (!Array.isArray(candidate[field])) {
          errors.push({ field, message: `${field} must be an array`, critical: true });
        } else if (candidate[field].length > this.MAX_ARRAY_LENGTH) {
          errors.push({ field, message: `${field} exceeds maximum bound of ${this.MAX_ARRAY_LENGTH} items`, critical: false });
        }
      }
    }

    const hasCritical = errors.some((e) => e.critical);
    return {
      isValid: !hasCritical,
      errors,
      sanitizedPlan: !hasCritical ? (candidate as LearningPlan) : undefined,
    };
  }

  /**
   * Validates a single interactive control definition.
   */
  private static validateControl(ctrl: any, index: number): ValidationError | null {
    if (!ctrl || typeof ctrl !== 'object') {
      return { field: `interactiveParameters[${index}]`, message: 'Control must be an object', critical: true };
    }

    if (!ctrl.id || typeof ctrl.id !== 'string') {
      return { field: `interactiveParameters[${index}].id`, message: 'Control requires a valid string id', critical: true };
    }

    if (!ctrl.label || typeof ctrl.label !== 'string') {
      return { field: `interactiveParameters[${index}].label`, message: 'Control requires a valid string label', critical: true };
    }

    const { value, min, max, step } = ctrl;

    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return { field: `interactiveParameters[${index}].value`, message: 'Control value must be a finite number', critical: true };
    }

    if (typeof min !== 'number' || isNaN(min) || !isFinite(min)) {
      return { field: `interactiveParameters[${index}].min`, message: 'Control min must be a finite number', critical: true };
    }

    if (typeof max !== 'number' || isNaN(max) || !isFinite(max)) {
      return { field: `interactiveParameters[${index}].max`, message: 'Control max must be a finite number', critical: true };
    }

    if (min > max) {
      return { field: `interactiveParameters[${index}].range`, message: `Control min (${min}) cannot exceed max (${max})`, critical: true };
    }

    if (value < min || value > max) {
      return {
        field: `interactiveParameters[${index}].value`,
        message: `Control value (${value}) must be within [${min}, ${max}]`,
        critical: true,
      };
    }

    if (step !== undefined && (typeof step !== 'number' || isNaN(step) || step <= 0 || !isFinite(step))) {
      return { field: `interactiveParameters[${index}].step`, message: 'Control step must be a positive finite number', critical: true };
    }

    return null;
  }

  /**
   * Validates external reference URLs to ensure safe protocols (HTTP/HTTPS only).
   */
  private static validateSourceUrl(urlStr: string): string | null {
    try {
      const parsed = new URL(urlStr);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return `Disallowed protocol '${parsed.protocol}'. Only http: and https: URLs are permitted.`;
      }
      return null;
    } catch {
      return 'Malformed URL format';
    }
  }

  /**
   * 2. Topic Relevance Validator: Compares generated plan against query and domain rules.
   */
  public static validateRelevance(
    plan: LearningPlan,
    originalQuery: string,
    classification?: TopicClassificationResult
  ): RelevanceValidationResult {
    const issues: string[] = [];
    const suggestedFixes: string[] = [];
    const lowerQuery = (originalQuery || '').toLowerCase().trim();
    const fullText = `${plan.title} ${plan.overview} ${plan.motivation} ${plan.assumptions?.join(' ') ?? ''}`.toLowerCase();

    // RULE 1: Computer Science & Data Structures
    const isMathCoordinateGraph =
      lowerQuery.includes('mx') ||
      lowerQuery.includes('y=') ||
      lowerQuery.includes('y =') ||
      lowerQuery.includes('slope') ||
      lowerQuery.includes('intercept') ||
      lowerQuery.includes('coordinate') ||
      lowerQuery.includes('cartesian') ||
      lowerQuery.includes('equation') ||
      classification?.domain === 'mathematics' ||
      plan.category === 'algebra' ||
      plan.category === 'geometry' ||
      plan.category === 'calculus';

    const isCsQuery =
      !isMathCoordinateGraph &&
      (lowerQuery.includes('data structure') ||
        lowerQuery.includes('data strctures') ||
        lowerQuery.includes('linked list') ||
        lowerQuery.includes('stack') ||
        lowerQuery.includes('queue') ||
        lowerQuery.includes('trees & graphs') ||
        lowerQuery.includes('trees and graphs') ||
        lowerQuery.includes('tree data structure') ||
        lowerQuery.includes('graph data structure') ||
        lowerQuery.includes('graph theory') ||
        lowerQuery.includes('binary tree') ||
        lowerQuery.includes('bst') ||
        lowerQuery === 'tree' ||
        lowerQuery === 'trees' ||
        lowerQuery === 'graph' ||
        lowerQuery === 'graphs' ||
        classification?.domain === 'computer_science');

    if (isCsQuery) {
      const csKeywords = [
        'memory', 'pointer', 'node', 'complexity', 'array', 'contiguous', 'o(1)', 'o(n)',
        'cache', 'heap', 'stack', 'tree', 'queue', 'data structure', 'element',
        'vertex', 'vertices', 'edge', 'edges', 'acyclic', 'dag', 'traversal', 'hierarchy',
        'network', 'graph', 'child', 'parent', 'root', 'leaf', 'branch', 'matrix', 'adjacency',
        'path', 'cycle', 'breadth', 'depth', 'hash', 'algorithm', 'binary'
      ];
      const hasCsTerms = csKeywords.some((term) => fullText.includes(term));
      if (!hasCsTerms) {
        issues.push('Computer science topic lacks relevant computing concepts (memory, pointer, node, complexity, array).');
        suggestedFixes.push('Include contiguous memory layout and asymptotic complexity trade-offs.');
      }

      // Must NOT contain physics formulas or mechanical variables
      const physicsTerms = ['newton', 'acceleration', 'kinematic', 'joule', 'gravity', 'velocity'];
      const hasPhysicsJunk = physicsTerms.some((term) => fullText.includes(term));
      if (hasPhysicsJunk) {
        issues.push('Data structures contains unrelated physics or kinematics derivations.');
        suggestedFixes.push('Purge Newtonian mechanics from computer science topic.');
      }

      // Must NOT use geometric dissection
      if (plan.visualizationPlan.rendererType === 'formula_geometric_dissection') {
        issues.push('Computer science topic incorrectly assigned formula_geometric_dissection.');
        suggestedFixes.push('Reassign renderer to algorithm_array_tracer or svg_schematic_fallback.');
      }

      // Must NOT contain fabricated parameter k = 1
      const hasFakeK =
        plan.variables?.some((v) => v.symbol === 'k') ||
        plan.interactiveParameters?.some((p) => p.symbol === 'k') ||
        (plan.defaultExperimentState?.parameters && 'k' in plan.defaultExperimentState.parameters);
      if (hasFakeK) {
        issues.push('Data structures contains fabricated default parameter k = 1.');
        suggestedFixes.push('Remove variable k and replace with algorithmic parameters.');
      }
    }

    // RULE 2: Binary Search
    if (lowerQuery.includes('binary search')) {
      const hasSortedPrecondition =
        fullText.includes('sorted') ||
        fullText.includes('monotonic') ||
        (plan.prerequisites || []).some((p) => p.toLowerCase().includes('sorted'));
      if (!hasSortedPrecondition) {
        issues.push('Binary search does not explain the required sorted array precondition.');
        suggestedFixes.push('Add "Array must be sorted in ascending order" as a prerequisite.');
      }

      const hasSearchSteps =
        fullText.includes('half') ||
        fullText.includes('halving') ||
        fullText.includes('mid') ||
        fullText.includes('pointer') ||
        fullText.includes('log') ||
        fullText.includes('interval');
      if (!hasSearchSteps) {
        issues.push('Binary search does not explain logarithmic search steps, interval halving, or pointers.');
        suggestedFixes.push('Explain midpoint comparison and logarithmic time complexity O(log n).');
      }

      // Check worked example
      const hasValidExample = plan.workedExamples?.some((ex) => {
        const exText = `${ex.title} ${ex.problemStatement} ${ex.stepByStepSolution?.join(' ')}`.toLowerCase();
        return exText.includes('search') || exText.includes('target') || exText.includes('mid') || exText.includes('array');
      });
      if (!hasValidExample) {
        issues.push('Worked example does not demonstrate binary search on an array.');
        suggestedFixes.push('Provide a worked example searching for a target number in a sorted array.');
      }

      // Renderer must be algorithm_array_tracer
      const canonicalRenderer = VisualizationRegistry.resolveRendererType(plan.visualizationPlan.rendererType);
      if (canonicalRenderer !== 'algorithm_array_tracer') {
        issues.push(`Binary search assigned inappropriate renderer '${plan.visualizationPlan.rendererType}'.`);
        suggestedFixes.push('Assign algorithm_array_tracer renderer.');
      }
    }

    // RULE 3: Newton's Law F = ma
    if (lowerQuery.includes('f = ma') || lowerQuery.includes('f=ma')) {
      const hasCorePhysics =
        fullText.includes('force') &&
        fullText.includes('mass') &&
        (fullText.includes('acceleration') || fullText.includes('accelerate'));
      if (!hasCorePhysics) {
        issues.push('F = ma must explain force, mass, and acceleration.');
        suggestedFixes.push('Detail relationship between net force, mass, and resulting acceleration.');
      }

      // Check units
      const varUnits = (plan.variables || []).map((v) => (v.unit || '').toLowerCase());
      const hasUnits = varUnits.some((u) => u.includes('n') || u.includes('kg') || u.includes('m/s'));
      if (!hasUnits) {
        issues.push('F = ma does not define proper SI units (N, kg, m/s²).');
        suggestedFixes.push('Define SI units: Force (N), Mass (kg), Acceleration (m/s²).');
      }

      // Renderer should be physics_vector_simulator
      const canonicalRenderer = VisualizationRegistry.resolveRendererType(plan.visualizationPlan.rendererType);
      if (canonicalRenderer !== 'physics_vector_simulator') {
        issues.push(`F = ma assigned mismatched renderer '${plan.visualizationPlan.rendererType}'.`);
        suggestedFixes.push('Assign physics_vector_simulator renderer.');
      }
    }

    // RULE 4: Factual / Historical Entities (Alan Turing, Ada Lovelace, etc.)
    const isHistoricalEntity =
      classification?.domain === 'history' ||
      classification?.domain === 'general_knowledge' ||
      lowerQuery.includes('alan turing') ||
      lowerQuery.includes('ada lovelace');

    if (isHistoricalEntity) {
      const hasFakeMathVariables =
        (plan.variables && plan.variables.length > 0 && plan.variables.some((v) => v.symbol === 'k')) ||
        (plan.interactiveParameters && plan.interactiveParameters.some((p) => p.symbol === 'k'));
      if (hasFakeMathVariables) {
        issues.push('Historical person topic contains fabricated mathematical variables (k = 1).');
        suggestedFixes.push('Purge numerical formulas; present verified historical/factual content.');
      }

      if (plan.visualizationPlan.rendererType === 'formula_geometric_dissection') {
        issues.push('Historical entity assigned inappropriate formula_geometric_dissection.');
        suggestedFixes.push('Use conceptual overview or svg_schematic_fallback.');
      }
    }

    // RULE 5: Worked Example Demonstration Check
    if (plan.workedExamples && plan.workedExamples.length > 0) {
      for (const ex of plan.workedExamples) {
        if (!ex.problemStatement || !ex.stepByStepSolution || ex.stepByStepSolution.length === 0) {
          issues.push(`Worked example '${ex.title}' lacks problem statement or step-by-step solution.`);
          suggestedFixes.push('Include clear problem statement and step-by-step solution.');
        }
      }
    }

    // RULE 6: Multi-Subject Renderer & Capability Compatibility
    if (classification?.domain) {
      const subjectDef = SubjectRegistry.resolveSubjectForDomain(classification.domain);
      const canonicalRenderer = VisualizationRegistry.resolveRendererType(plan.visualizationPlan?.rendererType);
      if (!subjectDef.supportedRendererTypes.includes(canonicalRenderer)) {
        issues.push(
          `Subject "${subjectDef.displayName}" does not support visualization renderer "${plan.visualizationPlan?.rendererType}". Supported renderers: [${subjectDef.supportedRendererTypes.join(', ')}].`
        );
        suggestedFixes.push(`Reassign renderer to supported type "${subjectDef.defaultRendererType}".`);
      }
    }

    return {
      isRelevant: issues.length === 0,
      issues,
      suggestedFixes,
    };
  }

  /**
   * 3. Plan Repair: Performs at most ONE bounded repair to sanitize schema issues and fix relevance mismatches.
   */
  public static repairPlan(
    plan: LearningPlan,
    originalQuery: string,
    issues: string[],
    classification?: TopicClassificationResult
  ): LearningPlan {
    const repaired: LearningPlan = JSON.parse(JSON.stringify(plan));
    const lowerQuery = (originalQuery || '').toLowerCase();

    // 1. Resolve & sanitize renderer
    const canonical = VisualizationRegistry.resolveRendererType(repaired.visualizationPlan?.rendererType);
    if (repaired.visualizationPlan) {
      repaired.visualizationPlan.rendererType = canonical;
    }

    // 2. Domain & Subject-specific renderer fix
    if (classification) {
      const subjectDef = SubjectRegistry.resolveSubjectForDomain(classification.domain);
      if (!subjectDef.supportedRendererTypes.includes(canonical) && repaired.visualizationPlan) {
        repaired.visualizationPlan.rendererType = subjectDef.defaultRendererType;
      } else {
        const check = VisualizationRegistry.validateRendererForDomain(canonical, classification.domain);
        if (!check.isCompatible && repaired.visualizationPlan) {
          repaired.visualizationPlan.rendererType = check.recommendedRenderer;
        }
      }
    }

    // 3. Purge fake parameter k = 1
    repaired.variables = (repaired.variables || []).filter((v) => v.symbol !== 'k');
    repaired.interactiveParameters = (repaired.interactiveParameters || []).filter((p) => p.symbol !== 'k');
    if (repaired.defaultExperimentState?.parameters) {
      delete repaired.defaultExperimentState.parameters.k;
    }

    // 4. Sanitize and clamp interactive parameters
    repaired.interactiveParameters = (repaired.interactiveParameters || []).map((ctrl) => {
      let min = typeof ctrl.min === 'number' && isFinite(ctrl.min) ? ctrl.min : 0;
      let max = typeof ctrl.max === 'number' && isFinite(ctrl.max) ? ctrl.max : 100;
      if (min > max) {
        const tmp = min;
        min = max;
        max = tmp;
      }
      let val = typeof ctrl.value === 'number' && isFinite(ctrl.value) ? ctrl.value : min;
      val = Math.min(Math.max(val, min), max);
      const step = typeof ctrl.step === 'number' && isFinite(ctrl.step) && ctrl.step > 0 ? ctrl.step : 1;

      return {
        ...ctrl,
        id: ctrl.id || `param_${Math.random().toString(36).substring(2, 7)}`,
        label: ctrl.label || 'Parameter',
        value: val,
        min,
        max,
        step,
      };
    });

    // 5. Binary Search specific repairs
    if (lowerQuery.includes('binary search')) {
      if (repaired.visualizationPlan) {
        repaired.visualizationPlan.rendererType = 'algorithm_array_tracer';
      }
      if (!repaired.prerequisites.some((p) => p.toLowerCase().includes('sorted'))) {
        repaired.prerequisites.unshift('Array elements must be sorted in ascending order.');
      }
      if (!repaired.overview.toLowerCase().includes('log')) {
        repaired.overview += ' Binary search operates by repeatedly dividing the sorted search interval in half, achieving logarithmic time complexity O(log n).';
      }
    }

    // 6. Data structures, trees & graphs specific repairs
    if (
      lowerQuery.includes('data structure') ||
      lowerQuery.includes('data strctures') ||
      lowerQuery.includes('tree') ||
      lowerQuery.includes('graph') ||
      classification?.domain === 'computer_science'
    ) {
      if (repaired.visualizationPlan) {
        repaired.visualizationPlan.rendererType = 'algorithm_array_tracer';
      }
      const lowerOverview = (repaired.overview || '').toLowerCase();
      if (!lowerOverview.includes('memory') && !lowerOverview.includes('node') && !lowerOverview.includes('pointer')) {
        repaired.overview += ' Formatted with node pointer architectures, memory representations, and asymptotic complexity trade-offs.';
      }
      if (!repaired.prerequisites.some((p) => p.toLowerCase().includes('data') || p.toLowerCase().includes('complexity'))) {
        repaired.prerequisites.push('Data structure memory representation and asymptotic complexity analysis.');
      }
    }

    // 7. F = ma specific repairs
    if (lowerQuery.includes('f = ma') || lowerQuery.includes('f=ma')) {
      if (repaired.visualizationPlan) {
        repaired.visualizationPlan.rendererType = 'physics_vector_simulator';
      }
      // Ensure SI units
      repaired.variables = [
        { symbol: 'F', name: 'Net Force', unit: 'N', description: 'Applied net horizontal force in Newtons' },
        { symbol: 'm', name: 'Mass', unit: 'kg', description: 'Inertial mass of the moving object in kilograms' },
        { symbol: 'a', name: 'Acceleration', unit: 'm/s²', description: 'Resulting rate of change of velocity' },
      ];
    }

    // 8. Sanitize Source Attribution URL
    if (repaired.sourceAttribution?.url) {
      const urlErr = this.validateSourceUrl(repaired.sourceAttribution.url);
      if (urlErr) {
        repaired.sourceAttribution.url = undefined;
      }
    }

    return repaired;
  }
}

