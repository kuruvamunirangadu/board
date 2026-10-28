import { LearningPlan, InputInterpretation } from './types';
import { LearningPlanGenerator } from './LearningPlanGenerator';

export interface AIProviderConfig {
  provider: 'local_ollama' | 'external_api' | 'deterministic_fallback';
  ollamaBaseUrl: string;
  modelName: string;
  apiKey?: string;
  timeoutMs: number;
}

export class AIModelAdapter {
  private static config: AIProviderConfig = {
    provider: 'local_ollama',
    ollamaBaseUrl: 'http://127.0.0.1:11434',
    modelName: 'qwen2.5:0.5b',
    timeoutMs: 4000,
  };

  static updateConfig(newConfig: Partial<AIProviderConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  static getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  /**
   * Health check testing if local Ollama or configured AI is reachable.
   */
  static async checkConnection(): Promise<{ isConnected: boolean; provider: string; model: string }> {
    try {
      const res = await fetch(`${this.config.ollamaBaseUrl}/api/tags`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const data = await res.json();
        const hasModel = data.models?.some((m: any) => m.name.includes('qwen2.5'));
        return {
          isConnected: true,
          provider: 'Ollama Local Daemon',
          model: hasModel ? this.config.modelName : (data.models?.[0]?.name || this.config.modelName),
        };
      }
    } catch (e) {
      // Local ollama not responding or offline
    }

    return {
      isConnected: false,
      provider: 'Deterministic Pedagogical Engine (Reliable Fallback)',
      model: 'none',
    };
  }

  /**
   * Generates or enhances a learning plan.
   * If local Ollama or AI fails or times out, it seamlessly produces the verified deterministic plan.
   */
  static async generateLearningPlan(
    interpretation: InputInterpretation
  ): Promise<LearningPlan> {
    // 1. Generate guaranteed deterministic base plan
    const verifiedPlan = LearningPlanGenerator.generatePlan(interpretation);

    // 2. If concept is already verified and tested in capability registry, return deterministic plan directly
    if (verifiedPlan.capabilityLevel === 'verified_and_tested') {
      return verifiedPlan;
    }

    // 3. For unfamiliar or freeform topics, attempt external knowledge lookup & local AI semantic enhancement
    try {
      // 3A. Query /api/knowledge (Wikipedia, DuckDuckGo & Local Entity Synthesizer)
      const queryParam = encodeURIComponent(interpretation.originalInput);
      const isBrowser = typeof window !== 'undefined';
      const knowledgeUrl = isBrowser ? `/api/knowledge?q=${queryParam}` : `http://127.0.0.1:3000/api/knowledge?q=${queryParam}`;
      
      const kRes = await fetch(knowledgeUrl, {
        signal: AbortSignal.timeout(3000),
      });

      if (kRes.ok) {
        const kData = await kRes.json();
        if (kData.found && kData.extract) {
          verifiedPlan.title = kData.title || verifiedPlan.title;
          verifiedPlan.overview = kData.extract;
          verifiedPlan.motivation = kData.extract;
          verifiedPlan.subject = kData.category ? `Domain: ${kData.category}` : verifiedPlan.subject;
          
          if (kData.keyFacts && kData.keyFacts.length > 0) {
            verifiedPlan.assumptions = kData.keyFacts;
          } else {
            verifiedPlan.assumptions = [
              `Classification: ${kData.category || 'General Knowledge'}`,
              `Source: ${kData.source?.toUpperCase() || 'Verified External Knowledge'}`,
            ];
          }

          verifiedPlan.applications = [
            kData.url ? `Reference & Primary Source: ${kData.url}` : 'Applied across domain, industry, and real-world practice.',
          ];

          verifiedPlan.workedExamples = [
            {
              title: `Domain Analysis: ${kData.title}`,
              problemStatement: `What is the role and operational classification of "${interpretation.originalInput}"?`,
              givenValues: { query: interpretation.originalInput, category: kData.category },
              stepByStepSolution: [
                `1. Identification: ${kData.title}`,
                `2. Category: ${kData.category}`,
                `3. Scope: ${kData.extract.slice(0, 160)}...`,
              ],
              finalAnswer: `${kData.description || 'Verified real-world concept'} ✓`,
            },
          ];

          verifiedPlan.defaultExperimentState = {
            parameters: {},
            calculatedOutputs: {
              result: kData.title,
              display: `${kData.title}: ${kData.description || kData.category}`,
            },
            outputFormulas: {
              output: `${kData.title} (${kData.category})`,
            },
            statusMessage: 'Verified external knowledge entity.',
          };

          verifiedPlan.disclosures.push(`Knowledge retrieved from ${kData.source} (${kData.category}).`);
          return verifiedPlan;
        }
      }
    } catch {
      // Fallback to local Ollama directly
    }

    // 3B. Direct Local Ollama semantic enhancement
    try {
      const prompt = `You are a universal curriculum intelligence assistant. Formulate a structured study summary for "${interpretation.originalInput}".
Explain its true real-world meaning and domain (business, technology, science, organization, etc.).
DO NOT use physics formulas, parameter k, or geometric coordinates if it is not physics.
Return ONLY clean JSON with keys: "motivation" (string), "assumptions" (string array), "applications" (string array).`;

      const response = await fetch(`${this.config.ollamaBaseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.modelName,
          prompt,
          format: 'json',
          stream: false,
        }),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });

      if (response.ok) {
        const result = await response.json();
        const parsed = JSON.parse(result.response);
        if (parsed.motivation && typeof parsed.motivation === 'string') {
          verifiedPlan.motivation = parsed.motivation;
          verifiedPlan.overview = parsed.motivation;
        }
        if (Array.isArray(parsed.assumptions) && parsed.assumptions.length > 0) {
          verifiedPlan.assumptions = parsed.assumptions;
        }
        if (Array.isArray(parsed.applications) && parsed.applications.length > 0) {
          verifiedPlan.applications = parsed.applications;
        }
        verifiedPlan.disclosures.push(`AI semantic synthesis active (${this.config.modelName}).`);
      }
    } catch {
      // Graceful fallback: maintain guaranteed deterministic plan without error
    }

    return verifiedPlan;
  }
}

