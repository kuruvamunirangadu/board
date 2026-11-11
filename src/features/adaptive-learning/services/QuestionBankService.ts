import { AssessmentQuestion, AssessmentDifficultyLevel } from '../../assessment/AssessmentContracts';
import { QuestionGenerator } from '../../assessment/QuestionGenerator';
import { QuestionValidator } from '../../assessment/QuestionValidator';

/** Curated deterministic assessment coverage. Unknown topics are deliberately unsupported. */
export class QuestionBankService {
  private static sequence = 0;

  static normalizeConceptId(conceptId: string): string | null {
    const id = conceptId.toLowerCase();
    const canonical: Record<string, string> = {
      math_linear_functions: 'math_linear_functions',
      math_linear_equations: 'math_linear_functions',
      math_fractions: 'math_fractions_basic',
      math_fractions_basic: 'math_fractions_basic',
      math_pythagorean_theorem: 'math_pythagorean_theorem',
      math_right_triangles: 'math_pythagorean_theorem',
      geometry_pythagoras: 'math_pythagorean_theorem',
      cs_binary_search: 'cs_binary_search',
      algo_binary_search: 'cs_binary_search',
      physics_f_ma: 'physics_f_ma',
      algebra_quadratic: 'algebra_quadratic',
      chem_periodic_table: 'chem_periodic_table',
      chem_ideal_gas: 'chem_ideal_gas',
      chem_chemical_bonding: 'chem_chemical_bonding',
      bio_photosynthesis: 'bio_photosynthesis',
      bio_dna_structure: 'bio_dna_structure',
      bio_punnett_genetics: 'bio_punnett_genetics',
      bio_nervous_system: 'bio_nervous_system',
    };
    return canonical[id] || null;
  }

  static supports(conceptId: string): boolean {
    return Boolean(this.normalizeConceptId(conceptId));
  }

  static getQuestion(conceptId: string, difficulty: AssessmentDifficultyLevel = 2): AssessmentQuestion | null {
    const canonicalConceptId = this.normalizeConceptId(conceptId);
    if (!canonicalConceptId) return null;
    try {
      const generated = QuestionGenerator.generate(canonicalConceptId, difficulty);
      const validation = QuestionValidator.validate(generated);
      if (!validation.isValid || generated.evaluationStrategy === 'unsupported') return null;
      this.sequence += 1;
      return { ...generated, id: `bank_${generated.conceptId}_${difficulty}_${this.sequence}` };
    } catch {
      return null;
    }
  }

  static getAssessment(conceptId: string, count = 5, startingDifficulty: AssessmentDifficultyLevel = 1): AssessmentQuestion[] {
    if (!this.supports(conceptId) || !Number.isInteger(count) || count < 1) return [];
    const questions: AssessmentQuestion[] = [];
    for (let index = 0; index < count; index += 1) {
      const difficulty = Math.min(5, startingDifficulty + index) as AssessmentDifficultyLevel;
      const question = this.getQuestion(conceptId, difficulty);
      if (!question) break;
      questions.push(question);
    }
    return questions;
  }
}
