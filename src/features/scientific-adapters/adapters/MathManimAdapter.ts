/**
 * VisiOS — Manim Mathematical Animation Adapter
 *
 * Generates Manim Community scene definitions and SVG animation keyframe sequences
 * for step-by-step mathematical derivations, geometry proofs, and calculus animations.
 * License: MIT
 */

import {
  AdapterExecutionRequest,
  AdapterExecutionResult,
  IntegrationHealthStatus,
  ScientificAdapter,
  ScientificIntegrationMetadata,
} from '../types';

export interface ManimKeyframe {
  stepIndex: number;
  label: string;
  latexExpression: string;
  explanation: string;
  svgVisual: string;
  durationSeconds: number;
}

export interface ManimSceneSpecification {
  sceneName: string;
  title: string;
  pythonScript: string;
  totalDurationSeconds: number;
  keyframes: ManimKeyframe[];
}

export class MathManimAdapter implements ScientificAdapter {
  public metadata: ScientificIntegrationMetadata = {
    id: 'manim',
    subject: 'mathematics',
    name: 'Manim Mathematical Animation Engine',
    version: '0.19.0',
    description: 'Programmatic mathematical animation engine for step-by-step proofs, geometric derivations, and calculus visual storytelling.',
    license: 'MIT',
    licenseNotice: 'Copyright 2026 The Manim Community Developers. Licensed under the MIT License.',
    healthStatus: 'available',
    capabilities: [
      'mathematical_proof_animation',
      'latex_equation_transformation',
      'calculus_tangent_sweep',
      'vector_transformation_animation',
      'geometric_dissection_transitions',
      'manim_python_scene_generation',
    ],
    resourceLimits: {
      maxMemoryMb: 512,
      maxExecutionTimeMs: 15000,
      concurrentInstances: 2,
    },
    documentationUrl: 'https://docs.manim.community/',
    browserExecutionSupported: true,
    requiresBackendService: false,
  };

  public async checkHealth(): Promise<IntegrationHealthStatus> {
    return 'available';
  }

  public reset(): void {
    // Stateless
  }

  /**
   * Generates a complete Manim Community Python scene script.
   */
  public generatePythonScript(sceneName: string, title: string, steps: { latex: string; explanation: string }[]): string {
    const formattedSteps = steps
      .map(
        (s, idx) => `
        # Step ${idx + 1}
        step_${idx + 1} = MathTex(r"${s.latex.replace(/\\/g, '\\\\')}").scale(1.1)
        step_${idx + 1}.next_to(title, DOWN, buff=1.0)
        expl_${idx + 1} = Text("${s.explanation}", font_size=24, color=GRAY_B)
        expl_${idx + 1}.next_to(step_${idx + 1}, DOWN, buff=0.6)
        
        ${idx === 0 ? `self.play(Write(step_1), FadeIn(expl_1))` : `self.play(Transform(step_${idx}, step_${idx + 1}), Transform(expl_${idx}, expl_${idx + 1}))`}
        self.wait(1.5)
`
      )
      .join('\n');

    return `from manim import *

class ${sceneName}(Scene):
    def construct(self):
        # Header title
        title = Title("${title}", font_size=38, color=BLUE_B)
        self.play(Write(title))
        self.wait(0.5)

${formattedSteps}
        self.wait(2)
`;
  }

  /**
   * Generates interactive SVG keyframes directly in the browser so students can
   * scrub step-by-step through the mathematical derivation without waiting for an external ffmpeg render.
   */
  public generateKeyframes(steps: { latex: string; explanation: string }[]): ManimKeyframe[] {
    return steps.map((s, idx) => {
      const progress = ((idx + 1) / steps.length) * 100;
      const angle = (idx / Math.max(1, steps.length - 1)) * Math.PI;
      const cx = 150 + Math.cos(angle) * 80;
      const cy = 110 - Math.sin(angle) * 40;

      const svg = `
<svg width="400" height="240" viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" style="background:#030712; border-radius:12px;">
  <defs>
    <linearGradient id="grad_${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#3b82f6" />
    </linearGradient>
  </defs>
  
  <!-- Step indicator line -->
  <line x1="40" y1="20" x2="360" y2="20" stroke="#1f2937" stroke-width="4" stroke-linecap="round"/>
  <line x1="40" y1="20" x2="${40 + (320 * progress) / 100}" y2="20" stroke="#6366f1" stroke-width="4" stroke-linecap="round"/>
  
  <!-- Animated focal point -->
  <circle cx="${cx}" cy="${cy}" r="10" fill="url(#grad_${idx})" stroke="#ffffff" stroke-width="2">
    <animate attributeName="r" values="8;11;8" dur="2s" repeatCount="indefinite"/>
  </circle>
  
  <!-- Mathematical step banner -->
  <rect x="30" y="55" width="340" height="80" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
  <text x="50" y="85" fill="#a5b4fc" font-size="12" font-family="sans-serif" font-weight="bold">STEP ${idx + 1} OF ${steps.length}</text>
  <text x="50" y="115" fill="#ffffff" font-size="15" font-family="monospace" font-weight="bold">${s.latex.replace(/\\/g, '')}</text>
  
  <!-- Step Explanation -->
  <text x="35" y="165" fill="#94a3b8" font-size="12" font-family="sans-serif">${s.explanation.slice(0, 50)}</text>
  <text x="35" y="185" fill="#64748b" font-size="11" font-family="sans-serif">${s.explanation.slice(50, 110)}</text>
</svg>
`.trim();

      return {
        stepIndex: idx + 1,
        label: `Step ${idx + 1}`,
        latexExpression: s.latex,
        explanation: s.explanation,
        svgVisual: svg,
        durationSeconds: 2.0,
      };
    });
  }

  public async execute(request: AdapterExecutionRequest): Promise<AdapterExecutionResult> {
    const t0 = performance.now();

    try {
      switch (request.action) {
        case 'generate_scene': {
          const title = request.payload.title || 'Mathematical Derivation';
          const sceneName = (request.payload.sceneName || 'MathDerivationScene').replace(/[^a-zA-Z0-9_]/g, '');
          const steps: { latex: string; explanation: string }[] = request.payload.steps || [
            { latex: 'f(x) = \\tan^2(x) + \\cot^2(x)', explanation: 'Initial trigonometric identity expression' },
            { latex: 'f(x) = \\tan^2(x) + \\frac{1}{\\tan^2(x)}', explanation: 'Reciprocal identity substitution' },
            { latex: 'f(x) = 4\\csc^2(2x) - 2', explanation: 'Double angle simplification' },
          ];

          const pythonScript = this.generatePythonScript(sceneName, title, steps);
          const keyframes = this.generateKeyframes(steps);
          const totalDurationSeconds = keyframes.reduce((acc, k) => acc + k.durationSeconds, 0);

          return {
            success: true,
            adapterId: 'manim',
            action: request.action,
            output: {
              sceneName,
              title,
              pythonScript,
              totalDurationSeconds,
              keyframes,
            },
            executionTimeMs: performance.now() - t0,
          };
        }

        default:
          return {
            success: false,
            adapterId: 'manim',
            action: request.action,
            output: null,
            error: `Unsupported Manim action: ${request.action}`,
            executionTimeMs: performance.now() - t0,
          };
      }
    } catch (err: any) {
      return {
        success: false,
        adapterId: 'manim',
        action: request.action,
        output: null,
        error: err.message || 'Manim execution error',
        executionTimeMs: performance.now() - t0,
      };
    }
  }
}
