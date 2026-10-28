/**
 * VisiOS — Phase 4: Misconception Detector
 * Rule-based, testable detection of domain misconceptions across STEM concepts.
 * Accumulates empirical evidence; requires repeated observations before confirming with high confidence.
 */

import { StudentInteraction, MisconceptionMatch } from './AdaptiveLearningContracts';
import { VALIDATED_MISCONCEPTIONS } from './misconception-catalog';

export interface MisconceptionRule {
  id: string;
  conceptId: string;
  name: string;
  description: string;
  matcher: (interaction: StudentInteraction) => boolean;
  remedialExplanation: string;
  remedialAction: string;
}

export const EXPLICIT_MISCONCEPTION_RULES: MisconceptionRule[] = [
  {
    id: 'misc_fractions_direct_addition',
    conceptId: 'math_fractions',
    name: 'Direct Numerator/Denominator Addition Fallacy',
    description: 'Learner adds numerators and denominators directly (e.g., 1/2 + 1/3 = 2/5) without finding a common denominator.',
    matcher: (interaction) => {
      if (interaction.conceptId !== 'math_fractions' && !interaction.conceptId.includes('fraction')) {
        return false;
      }
      const ans = String(interaction.selectedAnswer || '').replace(/\s/g, '');
      // Common distractor answers: 2/5 for 1/2 + 1/3, 2/6, etc.
      return ans === '2/5' || ans === '2/6' || ans.includes('add numerators and denominators');
    },
    remedialExplanation: 'Fractions represent equal parts of a whole. To combine them, you must express both in identical partition units using a common denominator before adding numerators.',
    remedialAction: 'Visualize fractional bars with common partitioning.',
  },
  {
    id: 'misc_linear_slope_intercept_swap',
    conceptId: 'math_linear_functions',
    name: 'Slope-Intercept Inversion Fallacy',
    description: 'Learner treats the constant term as the slope or the coefficient of x as the intercept (e.g. For y = 2x + 3, claiming slope is 3).',
    matcher: (interaction) => {
      if (interaction.conceptId !== 'math_linear_functions' && !interaction.conceptId.includes('linear')) {
        return false;
      }
      const ans = String(interaction.selectedAnswer || '').trim();
      return ans === '3' || ans.toLowerCase().includes('slope is 3') || ans.toLowerCase().includes('intercept is 2');
    },
    remedialExplanation: 'In slope-intercept form y = mx + b, m is the rate of change (slope) multiplied by x, and b is the constant starting value where the line crosses the y-axis at x = 0.',
    remedialAction: 'Plot y = 2x + 3 with animated step-by-step slope triangle.',
  },
  {
    id: 'misc_binary_search_unsorted',
    conceptId: 'cs_binary_search',
    name: 'Unsorted Array Binary Search Assumption',
    description: 'Learner attempts to run or expects binary search to succeed on an unsorted array without prior ordering.',
    matcher: (interaction) => {
      if (interaction.conceptId !== 'cs_binary_search' && !interaction.conceptId.includes('binary_search')) {
        return false;
      }
      const ans = String(interaction.selectedAnswer || '').toLowerCase();
      return ans.includes('works on any array') || ans.includes('unsorted') || ans.includes('ordering is not required');
    },
    remedialExplanation: 'Binary search discards half the search interval at each step based on the invariant that elements to the left are smaller and to the right are larger. On an unsorted array, this invariant is violated.',
    remedialAction: 'Trace binary search failure on an unsorted array.',
  },
  {
    id: 'misc_newton_mass_acceleration_fallacy',
    conceptId: 'physics_f_ma',
    name: 'Force-Acceleration Independence Fallacy',
    description: 'Learner believes acceleration is independent of applied force or that heavier objects always have greater acceleration under constant force.',
    matcher: (interaction) => {
      if (interaction.conceptId !== 'physics_f_ma' && !interaction.conceptId.includes('physics_f')) {
        return false;
      }
      const ans = String(interaction.selectedAnswer || '').toLowerCase();
      return ans.includes('acceleration is constant regardless of force') || ans.includes('mass does not affect acceleration');
    },
    remedialExplanation: 'Newton second law states a = F_net / m. For a fixed mass, acceleration is directly proportional to net force; for a fixed force, acceleration is inversely proportional to mass.',
    remedialAction: 'Interactive force-mass slider simulation.',
  },
];

export class MisconceptionDetector {
  /**
   * Inspect a single interaction and check for potential matches against explicit rules.
   */
  public static detectInInteraction(interaction: StudentInteraction): MisconceptionRule | null {
    if (interaction.isCorrect) return null;

    for (const rule of EXPLICIT_MISCONCEPTION_RULES) {
      if (rule.matcher(interaction)) {
        return rule;
      }
    }

    // Also check validated catalog from research packs
    if (interaction.detectedMisconceptionId) {
      const catalogEntry = VALIDATED_MISCONCEPTIONS[interaction.detectedMisconceptionId];
      if (catalogEntry) {
        return {
          id: catalogEntry.id,
          conceptId: catalogEntry.conceptId,
          name: catalogEntry.name,
          description: catalogEntry.description,
          matcher: () => true,
          remedialExplanation: catalogEntry.remedialExplanation,
          remedialAction: catalogEntry.remedialIntervention,
        };
      }
    }

    return null;
  }

  /**
   * Evaluates all interactions for a student and concept.
   * STRICT PRINCIPLE: A single incorrect answer does NOT confirm a misconception (confidence remains low < 0.5).
   * Multiple occurrences increase confidence (>= 0.75 for 2+, >= 0.9 for 3+).
   */
  public static analyzeMisconceptions(
    conceptId: string,
    interactions: StudentInteraction[]
  ): MisconceptionMatch[] {
    const conceptErrors = interactions.filter(
      (i) => i.conceptId === conceptId && !i.isCorrect
    );

    const matchCounts = new Map<string, { rule: MisconceptionRule; count: number }>();

    for (const error of conceptErrors) {
      const matched = this.detectInInteraction(error);
      if (matched) {
        const existing = matchCounts.get(matched.id);
        if (existing) {
          existing.count++;
        } else {
          matchCounts.set(matched.id, { rule: matched, count: 1 });
        }
      }
    }

    const results: MisconceptionMatch[] = [];

    for (const [id, { rule, count }] of Array.from(matchCounts.entries())) {
      // Confidence formula: 1 occurrence = 0.35 (potential), 2 = 0.75 (likely), 3+ = 0.95 (confirmed)
      const confidence =
        count >= 3 ? 0.95 : count === 2 ? 0.75 : 0.35;

      results.push({
        misconceptionId: id,
        conceptId,
        name: rule.name,
        confidence,
        evidenceCount: count,
        remedialExplanation: rule.remedialExplanation,
        remedialAction: rule.remedialAction,
      });
    }

    return results;
  }
}
