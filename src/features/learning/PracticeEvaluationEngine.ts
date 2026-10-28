/**
 * VisiOS — Practice Evaluation & Guided Learning Session Engine
 * Provides deterministic grading for multiple-choice and short-answer questions,
 * formative feedback, misconception alerts, and the 8-step guided learning progression.
 */

import {
  LearningPlan,
  PracticeQuestion,
  PracticeExerciseFeedback,
  GuidedLearningSession,
  GuidedLessonStepDefinition,
  GuidedLessonStep,
} from './types';

export interface ShortAnswerQuestion {
  id: string;
  question: string;
  expectedAnswer: string | number;
  tolerance?: number;
  unit?: string;
  explanation: string;
  hint: string;
}

export class PracticeEvaluationEngine {
  /**
   * Evaluates a multiple-choice answer against a practice question.
   */
  public static evaluateMultipleChoice(
    question: PracticeQuestion,
    selectedIndex: number
  ): PracticeExerciseFeedback {
    const isCorrect = selectedIndex === question.correctIndex;

    return {
      isCorrect,
      score: isCorrect ? 100 : 0,
      explanation: question.explanation,
      misconceptionAlert: !isCorrect ? question.misconceptionAlert : undefined,
      hint: !isCorrect ? question.hint : undefined,
      retryAllowed: !isCorrect,
    };
  }

  /**
   * Deterministically evaluates a short-answer or numerical response.
   */
  public static evaluateShortAnswer(
    question: ShortAnswerQuestion,
    userRawInput: string | number
  ): PracticeExerciseFeedback {
    const rawStr = String(userRawInput).trim();

    if (!rawStr) {
      return {
        isCorrect: false,
        score: 0,
        explanation: 'Please enter an answer before submitting.',
        hint: question.hint,
        retryAllowed: true,
      };
    }

    // 1. Numerical Comparison with Tolerance
    const expectedNum = typeof question.expectedAnswer === 'number'
      ? question.expectedAnswer
      : parseFloat(String(question.expectedAnswer));

    const cleanedUser = rawStr.replace(/[^0-9.-]/g, '');
    const userNum = parseFloat(cleanedUser);

    if (!isNaN(expectedNum) && !isNaN(userNum)) {
      const tolerance = question.tolerance ?? 0.05;
      const isWithinTolerance = Math.abs(userNum - expectedNum) <= tolerance;

      return {
        isCorrect: isWithinTolerance,
        score: isWithinTolerance ? 100 : 0,
        explanation: isWithinTolerance
          ? `Correct! Expected ${expectedNum}${question.unit ? ` ${question.unit}` : ''}. ${question.explanation}`
          : `Incorrect. You entered ${userNum}, but the expected value is ${expectedNum}${question.unit ? ` ${question.unit}` : ''}. ${question.explanation}`,
        hint: !isWithinTolerance ? question.hint : undefined,
        retryAllowed: !isWithinTolerance,
      };
    }

    // 2. Text Comparison
    const normalizedUser = rawStr.toLowerCase().replace(/\s+/g, ' ');
    const normalizedExpected = String(question.expectedAnswer).toLowerCase().trim();
    const isExact = normalizedUser.includes(normalizedExpected) || normalizedExpected.includes(normalizedUser);

    return {
      isCorrect: isExact,
      score: isExact ? 100 : 0,
      explanation: isExact
        ? `Correct! ${question.explanation}`
        : `Incorrect. Expected "${question.expectedAnswer}". ${question.explanation}`,
      hint: !isExact ? question.hint : undefined,
      retryAllowed: !isExact,
    };
  }

  /**
   * Constructs an 8-step guided lesson progression from a validated learning plan.
   */
  public static buildGuidedSession(plan: LearningPlan): GuidedLearningSession {
    const steps: GuidedLessonStepDefinition[] = [
      {
        step: 'concept_meaning',
        number: 1,
        title: 'What It Means',
        subtitle: 'Core Concept Definition',
        summary: plan.overview || 'Fundamental definition and conceptual baseline.',
      },
      {
        step: 'why_it_matters',
        number: 2,
        title: 'Why It Matters',
        subtitle: 'Real-World Motivation',
        summary: plan.motivation || 'Why this concept is essential across scientific and computing practice.',
      },
      {
        step: 'prerequisites',
        number: 3,
        title: 'Prerequisites',
        subtitle: 'Foundational Knowledge',
        summary:
          plan.prerequisites && plan.prerequisites.length > 0
            ? plan.prerequisites.join(' • ')
            : 'Basic algebraic and conceptual reasoning.',
      },
      {
        step: 'step_by_step',
        number: 4,
        title: 'Step-by-Step Explanation',
        subtitle: 'Derivation & Rules',
        summary:
          plan.derivationSteps && plan.derivationSteps.length > 0
            ? plan.derivationSteps.map((s) => `${s.stepNumber}. ${s.expression} (${s.explanation})`).join('\n')
            : (plan.assumptions?.join(' • ') || 'Key operational assumptions and principles.'),
      },
      {
        step: 'worked_example',
        number: 5,
        title: 'Worked Example',
        subtitle: 'Concrete Problem Walkthrough',
        summary:
          plan.workedExamples && plan.workedExamples.length > 0
            ? `${plan.workedExamples[0].title}: ${plan.workedExamples[0].problemStatement} ⇒ ${plan.workedExamples[0].finalAnswer}`
            : 'Guided example demonstrating step-by-step application.',
      },
      {
        step: 'interactive_exploration',
        number: 6,
        title: 'Interactive Exploration',
        subtitle: 'Hands-on Simulation',
        summary: plan.visualizationPlan.description || 'Manipulate parameters and observe real state changes.',
      },
      {
        step: 'practice_exercise',
        number: 7,
        title: 'Practice Exercise',
        subtitle: 'Knowledge Check & Feedback',
        summary:
          plan.practiceQuestions && plan.practiceQuestions.length > 0
            ? plan.practiceQuestions[0].question
            : 'Self-assessment question with immediate grading and rationale.',
      },
      {
        step: 'recap',
        number: 8,
        title: 'Concise Recap',
        subtitle: 'Key Takeaways & Applications',
        summary:
          plan.applications && plan.applications.length > 0
            ? plan.applications.slice(0, 3).join(' • ')
            : 'Summary of rules, limitations, and key takeaways.',
      },
    ];

    return {
      topic: plan.title,
      conceptId: plan.conceptId,
      currentStep: 'concept_meaning',
      completedSteps: [],
      steps,
      isCompleted: false,
    };
  }

  /**
   * Advances a guided session to the next step.
   */
  public static advanceSession(session: GuidedLearningSession): GuidedLearningSession {
    const currentIndex = session.steps.findIndex((s) => s.step === session.currentStep);
    if (currentIndex < 0 || currentIndex >= session.steps.length - 1) {
      return {
        ...session,
        isCompleted: true,
        completedSteps: Array.from(new Set([...session.completedSteps, session.currentStep])),
      };
    }

    const nextStep = session.steps[currentIndex + 1].step;
    return {
      ...session,
      currentStep: nextStep,
      completedSteps: Array.from(new Set([...session.completedSteps, session.currentStep])),
      isCompleted: currentIndex + 1 === session.steps.length - 1,
    };
  }

  /**
   * Rewinds a guided session to the previous step.
   */
  public static rewindSession(session: GuidedLearningSession): GuidedLearningSession {
    const currentIndex = session.steps.findIndex((s) => s.step === session.currentStep);
    if (currentIndex <= 0) return session;

    return {
      ...session,
      currentStep: session.steps[currentIndex - 1].step,
    };
  }

  /**
   * Generates a context-specific short-answer practice question for a learning plan.
   */
  public static getDefaultShortAnswerQuestion(plan: LearningPlan): ShortAnswerQuestion {
    const conceptLower = (plan.conceptId + ' ' + plan.title).toLowerCase();

    if (conceptLower.includes('f_ma') || conceptLower.includes('force') || conceptLower.includes('newton')) {
      return {
        id: 'sa-f-ma',
        question: 'Calculate the net force (in Newtons) required to accelerate a 5 kg mass at 4 m/s².',
        expectedAnswer: 20,
        tolerance: 0.1,
        unit: 'N',
        explanation: 'According to Newton\'s Second Law, F = m · a = 5 kg · 4 m/s² = 20 N.',
        hint: 'Use the formula F = m · a. Multiply mass (5 kg) by acceleration (4 m/s²).',
      };
    }

    if (conceptLower.includes('binary search')) {
      return {
        id: 'sa-bs-log',
        question: 'In the worst case, how many comparisons does binary search require for a sorted array of 1024 elements?',
        expectedAnswer: 10,
        tolerance: 0,
        unit: 'comparisons',
        explanation: 'Binary search halves the search space each step: log₂(1024) = 10 comparisons.',
        hint: 'Calculate log₂(N) where N = 1024.',
      };
    }

    if (conceptLower.includes('stack') || conceptLower.includes('queue') || conceptLower.includes('data structure')) {
      return {
        id: 'sa-ds-complexity',
        question: 'What is the time complexity of pushing an element to the top of a stack (e.g. O(1))?',
        expectedAnswer: 'O(1)',
        explanation: 'Push operates directly on the top pointer without traversing elements, taking O(1) constant time.',
        hint: 'Does pushing depend on the number of elements already in the stack?',
      };
    }

    if (conceptLower.includes('pythagoras') || conceptLower.includes('triangle')) {
      return {
        id: 'sa-pythagoras',
        question: 'In a right triangle with legs a = 3 and b = 4, what is the length of hypotenuse c?',
        expectedAnswer: 5,
        tolerance: 0.1,
        explanation: 'c = √(a² + b²) = √(9 + 16) = √25 = 5.',
        hint: 'Use Pythagoras theorem: a² + b² = c².',
      };
    }

    // Default concept short-answer fallback
    return {
      id: `sa-${plan.conceptId}`,
      question: `What is the primary governing principle of ${plan.title}?`,
      expectedAnswer: plan.title,
      explanation: plan.overview || 'Fundamental conceptual principle.',
      hint: 'Recall the definition introduced in the overview section.',
    };
  }
}
