import { AnswerEvaluator } from '../../assessment/AnswerEvaluator';
import { AssessmentQuestion, AnswerEvaluation } from '../../assessment/AssessmentContracts';

/** Deterministic adapter over the existing math and structured answer evaluators. */
export class AnswerEvaluationEngine {
  static evaluate(question: AssessmentQuestion, answer: string | number, steps?: string[]): AnswerEvaluation {
    return AnswerEvaluator.evaluate(question, answer, steps);
  }
}
