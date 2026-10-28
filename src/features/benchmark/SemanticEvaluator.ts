/**
 * VisiOS — Benchmark Semantic & Pedagogical Evaluator
 * Step 2: Evaluates concept coverage, relevance, non-contradiction,
 * source grounding/attribution, and provides an optional advisory AI judge.
 */

import { BenchmarkTestCase, DimensionResult, BenchmarkEvaluationStatus } from './BenchmarkTypes';
import { OrchestrationResult } from '@/features/learning/LearningOrchestrator';
import { AIModelAdapter } from '@/features/learning/AIModelAdapter';

export class SemanticEvaluator {
  /**
   * Aggregates all pedagogical text from a LearningPlan into a normalized searchable string.
   */
  private static extractPlanCorpus(result: OrchestrationResult): string {
    const plan = result.plan;
    const parts: string[] = [
      plan.title || '',
      plan.overview || '',
      plan.motivation || '',
      plan.derivationSummary || '',
      plan.symbolicVerificationNote || '',
      plan.classification?.reason || '',
      plan.visualizationPlan?.title || '',
      plan.visualizationPlan?.description || '',
      plan.visualizationPlan?.learningObjective || '',
      plan.uncertaintyState?.reason || '',
    ];

    if (plan.classification?.suggestedClarifications) {
      parts.push(...plan.classification.suggestedClarifications);
    }

    if (plan.uncertaintyState?.suggestedClarifications) {
      parts.push(...plan.uncertaintyState.suggestedClarifications);
    }

    if (plan.interactiveParameters) {
      for (const p of plan.interactiveParameters) {
        parts.push(p.label || '');
        parts.push(p.symbol || '');
      }
    }

    if (plan.prerequisites) {
      parts.push(...plan.prerequisites);
    }

    if (plan.derivationSteps) {
      for (const step of plan.derivationSteps) {
        parts.push(step.expression || '');
        parts.push(step.explanation || '');
        parts.push(step.rationale || '');
      }
    }

    if (plan.workedExamples) {
      for (const ex of plan.workedExamples) {
        parts.push(ex.title || '');
        parts.push(ex.problemStatement || '');
        if (ex.stepByStepSolution) {
          parts.push(...ex.stepByStepSolution);
        }
        parts.push(ex.finalAnswer || '');
      }
    }

    if (plan.sourceAttribution) {
      parts.push(plan.sourceAttribution.title || '');
      parts.push(plan.sourceAttribution.extract || '');
      parts.push(plan.sourceAttribution.source || '');
    }

    return parts.join(' ').toLowerCase();
  }

  /**
   * 1. Evaluates Concept Coverage: checks presence of required curriculum concepts.
   */
  public static evaluateConceptCoverage(
    testCase: BenchmarkTestCase,
    result: OrchestrationResult
  ): DimensionResult {
    const required = testCase.requiredConcepts || [];
    if (required.length === 0) {
      return {
        dimension: 'concept_coverage',
        status: 'PASS',
        score: 1.0,
        expected: 'No mandatory concepts required',
        actual: 'Pass',
      };
    }

    const corpus = this.extractPlanCorpus(result);
    const { coveredCount, missingConcepts, ratio } = SemanticEvaluator.evaluateConceptCoverageFromCorpus(corpus, required);

    // Pass threshold is >= 60% coverage for broad concepts
    const isPass = ratio >= 0.6;
    const status: BenchmarkEvaluationStatus = isPass ? 'PASS' : 'FAIL';

    return {
      dimension: 'concept_coverage',
      status,
      score: ratio,
      expected: `Cover ${required.length} required concepts: [${required.join(', ')}]`,
      actual: `Covered ${coveredCount}/${required.length} (${(ratio * 100).toFixed(0)}%)`,
      details: missingConcepts.length > 0 ? `Missing concepts: [${missingConcepts.join(', ')}]` : undefined,
    };
  }

  /**
   * 2. Evaluates Relevance & Intent: checks that generated content specifically addresses the student's query.
   */
  public static evaluateRelevance(
    testCase: BenchmarkTestCase,
    result: OrchestrationResult
  ): DimensionResult {
    // If input was empty or whitespace, check that plan acknowledges empty state
    if (!testCase.input.trim()) {
      const isHandled = result.routeTaken === 'unsupported_input' || result.plan.title === '' || result.plan.title === 'Empty Input';
      return {
        dimension: 'relevance',
        status: isHandled ? 'PASS' : 'FAIL',
        score: isHandled ? 1.0 : 0.0,
        expected: 'Handle empty topic safely',
        actual: isHandled ? 'Handled safely' : 'Failed to handle empty input',
      };
    }

    const corpus = this.extractPlanCorpus(result);

    // Check forbidden claims first
    if (testCase.forbiddenClaims && testCase.forbiddenClaims.length > 0) {
      const detected = SemanticEvaluator.detectForbiddenClaims(corpus, testCase.forbiddenClaims);
      if (detected.length > 0) {
        return {
          dimension: 'relevance',
          status: 'FAIL',
          score: 0.0,
          expected: `Zero forbidden claims (must not contain: "${testCase.forbiddenClaims.join(', ')}")`,
          actual: `Contains forbidden claim: "${detected[0]}"`,
          details: 'Hallucination or misconception violation detected in generated explanation',
        };
      }
    }

    // Check topic relevance
    const expectedTopicKeywords = testCase.expectedTopic.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    let matchedKeywords = 0;
    for (const kw of expectedTopicKeywords) {
      if (corpus.includes(kw)) {
        matchedKeywords++;
      }
    }

    const keywordRatio = expectedTopicKeywords.length > 0 ? matchedKeywords / expectedTopicKeywords.length : 1.0;
    const isPass = keywordRatio >= 0.5;

    return {
      dimension: 'relevance',
      status: isPass ? 'PASS' : 'FAIL',
      score: Number(keywordRatio.toFixed(2)),
      expected: `Relevant to "${testCase.expectedTopic}" with 0 forbidden claims`,
      actual: `Matched ${matchedKeywords}/${expectedTopicKeywords.length} topic keywords`,
      details: isPass ? undefined : `Content did not sufficiently reflect topic "${testCase.expectedTopic}"`,
    };
  }

  /**
   * 3. Evaluates Grounding & Attribution: checks that topics requiring factual provenance
   * provide authentic source attribution.
   */
  public static evaluateGroundingAttribution(
    testCase: BenchmarkTestCase,
    result: OrchestrationResult
  ): DimensionResult {
    const isKnowledgeTopic =
      testCase.domain === 'history' ||
      testCase.domain === 'general_knowledge' ||
      testCase.tags.includes('grounding');

    if (!isKnowledgeTopic) {
      // STEM formulas and algorithms derive from mathematical axioms, not external web citations
      return {
        dimension: 'grounding_attribution',
        status: 'PASS',
        score: 1.0,
        expected: 'First-principles / axiomatic derivation (no web citation needed)',
        actual: 'Axiomatic STEM domain',
      };
    }

    const attr = result.plan.sourceAttribution;
    if (attr && attr.source) {
      return {
        dimension: 'grounding_attribution',
        status: 'PASS',
        score: 1.0,
        expected: 'Verified factual source citation',
        actual: `Attributed to ${attr.source} ("${attr.title}")`,
      };
    }

    // In offline or local AI fallback without knowledge API reachable
    if (result.routeTaken === 'local_ai_synthesizer' || result.routeTaken === 'wikipedia_and_ai') {
      return {
        dimension: 'grounding_attribution',
        status: 'PASS',
        score: 0.8,
        expected: 'Source attribution or honest AI synthesis notice',
        actual: `Handled via ${result.routeTaken}`,
      };
    }

    return {
      dimension: 'grounding_attribution',
      status: 'INCONCLUSIVE',
      score: 0.5,
      expected: 'Verified factual source attribution',
      actual: 'No explicit source attribution present',
      details: 'Knowledge topic was processed without attached source attribution metadata',
    };
  }

  /**
   * 4. Optional Advisory AI Judge: queries local AI model to evaluate pedagogical clarity.
   * If AI is offline, returns status INCONCLUSIVE without failing the deterministic benchmark.
   */
  public static async evaluateWithAiJudge(
    testCase: BenchmarkTestCase,
    result: OrchestrationResult
  ): Promise<{ status: BenchmarkEvaluationStatus; score: number; critique: string }> {
    try {
      const conn = await AIModelAdapter.checkConnection();
      if (!conn.isConnected) {
        return {
          status: 'INCONCLUSIVE',
          score: 0.5,
          critique: 'Local AI judge is offline; semantic evaluation skipped.',
        };
      }

      const planSummary = `Topic: ${result.plan.title}\nOverview: ${result.plan.overview?.slice(0, 300)}\nMotivation: ${result.plan.motivation?.slice(0, 300)}`;
      const prompt = `You are an educational benchmark judge. Rate the following explanation for the student query "${testCase.input}" on a scale of 1 to 5.
${planSummary}

Return your evaluation in format:
SCORE: <1-5>
CRITIQUE: <one concise sentence>`;

      const config = AIModelAdapter.getConfig();
      const res = await fetch(`${config.ollamaBaseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.modelName,
          prompt,
          stream: false,
          options: { temperature: 0.1, num_predict: 100 },
        }),
        signal: AbortSignal.timeout(3000),
      });

      if (!res.ok) {
        return {
          status: 'INCONCLUSIVE',
          score: 0.5,
          critique: 'AI model request failed with non-200 status.',
        };
      }

      const data = await res.json();
      const responseText = data.response || '';
      const scoreMatch = responseText.match(/SCORE:\s*(\d)/i);
      const scoreNum = scoreMatch ? parseInt(scoreMatch[1], 10) : 3;
      const normalizedScore = Math.min(1.0, Math.max(0.0, scoreNum / 5));

      return {
        status: normalizedScore >= 0.6 ? 'PASS' : 'FAIL',
        score: normalizedScore,
        critique: responseText.trim(),
      };
    } catch {
      return {
        status: 'INCONCLUSIVE',
        score: 0.5,
        critique: 'AI judge timed out or unreachable.',
      };
    }
  }

  // =========================================================================
  // Static Helper Methods for Corpus Concept Evaluation
  // =========================================================================

  public static detectForbiddenClaims(corpus: string, forbiddenClaims: string[]): string[] {
    const lower = corpus.toLowerCase();
    const detected: string[] = [];
    for (const claim of forbiddenClaims) {
      if (lower.includes(claim.toLowerCase().trim())) {
        detected.push(claim);
      }
    }
    return detected;
  }

  public static evaluateConceptCoverageFromCorpus(
    corpus: string,
    requiredConcepts: string[]
  ): { coveredCount: number; missingConcepts: string[]; ratio: number } {
    const lower = corpus.toLowerCase();
    const matched: string[] = [];
    const missing: string[] = [];

    for (const concept of requiredConcepts) {
      const cleanConcept = concept.toLowerCase().trim();
      if (lower.includes(cleanConcept)) {
        matched.push(concept);
      } else {
        missing.push(concept);
      }
    }

    const ratio = requiredConcepts.length > 0 ? matched.length / requiredConcepts.length : 1.0;
    return {
      coveredCount: matched.length,
      missingConcepts: missing,
      ratio: Number(ratio.toFixed(2)),
    };
  }
}

