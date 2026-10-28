/**
 * VisiOS — AI Experiment Explanation Service
 * Step 1: Connects AIModelAdapter with verified deterministic physics comparisons.
 * Discloses assumptions, distinguishes measured outcomes from student hypotheses,
 * and falls back safely to deterministic rule explanations when AI is offline.
 */

import { AIModelAdapter } from '@/features/learning/AIModelAdapter';
import { ExperimentDefinition, WhatIfComparison, StudentPrediction } from './ExperimentTypes';
import { ExperimentEngine } from './ExperimentEngine';

export class ExperimentExplanationService {
  /**
   * Generates a pedagogical explanation of why the experiment outcome changed.
   */
  public static async explainComparison(
    experiment: ExperimentDefinition,
    comparison: WhatIfComparison,
    prediction?: StudentPrediction | null
  ): Promise<{
    explanation: string;
    source: 'local_ai' | 'deterministic_rules';
    isSingleVariableControlled: boolean;
  }> {
    // 1. Generate guaranteed deterministic rule explanation as baseline
    const ruleExplanation = ExperimentEngine.generateRuleBasedExplanation(
      experiment,
      comparison.changedParameters,
      comparison.resultDeltas,
      comparison.isSingleVariableControlled
    );

    // 2. Test if AI model connection is available
    const conn = await AIModelAdapter.checkConnection();
    if (!conn.isConnected) {
      return {
        explanation: ruleExplanation,
        source: 'deterministic_rules',
        isSingleVariableControlled: comparison.isSingleVariableControlled,
      };
    }

    // 3. Formulate strict prompt for AIModelAdapter
    try {
      const config = AIModelAdapter.getConfig();
      const prompt = `You are VisiOS Physics Lab Tutor. Explain the outcome of this physics experiment in 2-3 concise, educational sentences.

Experiment: ${experiment.title}
Core Question: ${experiment.investigationQuestion}
Physical Assumptions: ${experiment.assumptions.join('; ')}

Parameters that changed between Run ${comparison.baselineRun.runNumber} and Run ${comparison.comparisonRun.runNumber}:
${comparison.changedParameters
  .map((p) => `- ${p.name} (${p.symbol}): changed from ${p.baseline} ${p.unit} to ${p.comparison} ${p.unit} (delta: ${p.delta > 0 ? '+' : ''}${p.delta} ${p.unit})`)
  .join('\n')}

Deterministic Numerical Results:
${comparison.resultDeltas
  .map((r) => `- ${r.name} (${r.symbol}): went from ${r.baseline} ${r.unit} to ${r.comparison} ${r.unit} (delta: ${r.delta > 0 ? '+' : ''}${r.delta} ${r.unit})`)
  .join('\n')}

Controlled Variable Status: ${
        comparison.isSingleVariableControlled
          ? 'EXACTLY ONE variable changed. State the clear causal relationship.'
          : 'MULTIPLE variables changed simultaneously. Warn the student that causation cannot be isolated to a single variable alone.'
      }

${
  prediction
    ? `Student Hypothesis: Predicted ${prediction.outputSymbol} = ${prediction.predictedValue}. Student reasoning: "${prediction.reasoning}". Address whether the physics evidence supported their intuition.`
    : ''
}

Rules:
1. Ground your explanation strictly in the verified physics formulas.
2. Do not invent any numbers not present in the results above.
3. Be encouraging and clear.`;

      const response = await fetch(`${config.ollamaBaseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.modelName,
          prompt,
          stream: false,
          options: {
            temperature: 0.2,
            num_predict: 200,
          },
        }),
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        const data = await response.json();
        const aiText = data.response?.trim();
        if (aiText && aiText.length > 30) {
          return {
            explanation: aiText,
            source: 'local_ai',
            isSingleVariableControlled: comparison.isSingleVariableControlled,
          };
        }
      }
    } catch (e) {
      // AI timeout or failure: gracefully fall back to deterministic rules
    }

    return {
      explanation: ruleExplanation,
      source: 'deterministic_rules',
      isSingleVariableControlled: comparison.isSingleVariableControlled,
    };
  }
}

