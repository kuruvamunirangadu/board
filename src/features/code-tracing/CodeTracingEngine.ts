/**
 * VisiOS — Unified Code Tracing Engine
 * Central dispatcher, execution manager, and session state coordinator for deterministic algorithm traces.
 */

import {
  ExecutionTrace,
  CodeTracingSessionState,
  TraceStep,
  PredictionQuestion,
} from './CodeTracingTypes';
import { BinarySearchTracer } from './algorithms/BinarySearchTracer';
import { LinearSearchTracer } from './algorithms/LinearSearchTracer';
import { BubbleSortTracer } from './algorithms/BubbleSortTracer';
import { StackQueueTracer } from './algorithms/StackQueueTracer';
import { RecursionTracer } from './algorithms/RecursionTracer';

export interface AlgorithmMetadata {
  id: string;
  name: string;
  category: 'searching' | 'sorting' | 'data_structures' | 'recursion';
  description: string;
  defaultInput: any;
}

export class CodeTracingEngine {
  public static readonly AVAILABLE_ALGORITHMS: AlgorithmMetadata[] = [
    {
      id: 'binary_search',
      name: 'Binary Search',
      category: 'searching',
      description: 'Divide-and-conquer search on sorted array using low, mid, and high pointers.',
      defaultInput: { array: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91], target: 23 },
    },
    {
      id: 'linear_search',
      name: 'Linear Search',
      category: 'searching',
      description: 'Sequential scanning of elements from start to end without sort precondition.',
      defaultInput: { array: [15, 42, 8, 23, 99, 4], target: 23 },
    },
    {
      id: 'bubble_sort',
      name: 'Bubble Sort',
      category: 'sorting',
      description: 'Adjacent comparison sort with early-termination flag on sorted input.',
      defaultInput: { array: [29, 10, 14, 37, 13] },
    },
    {
      id: 'stack_operations',
      name: 'Stack (LIFO)',
      category: 'data_structures',
      description: 'Last-In, First-Out stack with push, pop, peek, and underflow guards.',
      defaultInput: {
        operations: StackQueueTracer.DEFAULT_STACK_OPS,
        capacity: 8,
      },
    },
    {
      id: 'queue_operations',
      name: 'Queue (FIFO)',
      category: 'data_structures',
      description: 'First-In, First-Out queue with enqueue, dequeue, peek, and underflow guards.',
      defaultInput: {
        operations: StackQueueTracer.DEFAULT_QUEUE_OPS,
        capacity: 8,
      },
    },
    {
      id: 'recursion_factorial',
      name: 'Recursion (Factorial)',
      category: 'recursion',
      description: 'Step-by-step call-stack frame growth, base case evaluation, and unwinding.',
      defaultInput: { n: 4 },
    },
  ];

  /**
   * Generates a complete deterministic execution trace for any supported algorithm.
   */
  public static executeTrace(algorithmId: string, input?: any): ExecutionTrace {
    switch (algorithmId) {
      case 'binary_search': {
        const arr = input?.array ?? [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
        const target = input?.target ?? 23;
        return BinarySearchTracer.trace(arr, target);
      }

      case 'linear_search': {
        const arr = input?.array ?? [15, 42, 8, 23, 99, 4];
        const target = input?.target ?? 23;
        return LinearSearchTracer.trace(arr, target);
      }

      case 'bubble_sort': {
        const arr = input?.array ?? [29, 10, 14, 37, 13];
        return BubbleSortTracer.trace(arr);
      }

      case 'stack_operations': {
        const ops = input?.operations ?? StackQueueTracer.DEFAULT_STACK_OPS;
        const capacity = input?.capacity ?? 8;
        return StackQueueTracer.traceStack(ops, capacity);
      }

      case 'queue_operations': {
        const ops = input?.operations ?? StackQueueTracer.DEFAULT_QUEUE_OPS;
        const capacity = input?.capacity ?? 8;
        return StackQueueTracer.traceQueue(ops, capacity);
      }

      case 'recursion_factorial': {
        const n = input?.n ?? 4;
        return RecursionTracer.trace(n);
      }

      default:
        // Default fallback to binary search
        return BinarySearchTracer.trace([2, 5, 8, 12, 16, 23, 38, 56, 72, 91], 23);
    }
  }

  /**
   * Initializes a playback session state for an execution trace.
   */
  public static createInitialSession(
    algorithmId: string,
    inputConfig: any,
    trace: ExecutionTrace
  ): CodeTracingSessionState {
    const firstStep = trace.steps[0];
    return {
      algorithmId,
      currentStepIndex: 0,
      isPlaying: false,
      playbackSpeedMs: 1200,
      inputConfig,
      pendingPrediction: firstStep?.prediction || null,
      predictionAnswered: false,
      userPredictionChoice: null,
      predictionFeedback: null,
    };
  }

  /**
   * Steps forward safely, checking for predictions.
   */
  public static stepForward(
    session: CodeTracingSessionState,
    trace: ExecutionTrace
  ): CodeTracingSessionState {
    if (session.currentStepIndex >= trace.steps.length - 1) {
      return { ...session, isPlaying: false };
    }

    const nextIndex = session.currentStepIndex + 1;
    const nextStep = trace.steps[nextIndex];

    return {
      ...session,
      currentStepIndex: nextIndex,
      pendingPrediction: nextStep?.prediction || null,
      predictionAnswered: false,
      userPredictionChoice: null,
      predictionFeedback: null,
      isPlaying: nextIndex === trace.steps.length - 1 ? false : session.isPlaying,
    };
  }

  /**
   * Steps backward safely.
   */
  public static stepBackward(
    session: CodeTracingSessionState,
    trace: ExecutionTrace
  ): CodeTracingSessionState {
    if (session.currentStepIndex <= 0) return session;

    const prevIndex = session.currentStepIndex - 1;
    const prevStep = trace.steps[prevIndex];

    return {
      ...session,
      currentStepIndex: prevIndex,
      pendingPrediction: prevStep?.prediction || null,
      predictionAnswered: false,
      userPredictionChoice: null,
      predictionFeedback: null,
      isPlaying: false,
    };
  }

  /**
   * Jumps directly to any step index.
   */
  public static jumpToStep(
    session: CodeTracingSessionState,
    trace: ExecutionTrace,
    targetIndex: number
  ): CodeTracingSessionState {
    const clampedIndex = Math.max(0, Math.min(targetIndex, trace.steps.length - 1));
    const step = trace.steps[clampedIndex];

    return {
      ...session,
      currentStepIndex: clampedIndex,
      pendingPrediction: step?.prediction || null,
      predictionAnswered: false,
      userPredictionChoice: null,
      predictionFeedback: null,
      isPlaying: false,
    };
  }

  /**
   * Resets playback session back to step 0.
   */
  public static resetSession(
    session: CodeTracingSessionState,
    trace: ExecutionTrace
  ): CodeTracingSessionState {
    const firstStep = trace.steps[0];
    return {
      ...session,
      currentStepIndex: 0,
      isPlaying: false,
      pendingPrediction: firstStep?.prediction || null,
      predictionAnswered: false,
      userPredictionChoice: null,
      predictionFeedback: null,
    };
  }

  /**
   * Evaluates user prediction selection.
   */
  public static evaluatePrediction(
    session: CodeTracingSessionState,
    choiceIndex: number,
    prediction: PredictionQuestion
  ): CodeTracingSessionState {
    const isCorrect = choiceIndex === prediction.correctIndex;
    return {
      ...session,
      predictionAnswered: true,
      userPredictionChoice: choiceIndex,
      predictionFeedback: {
        isCorrect,
        explanation: prediction.explanation,
      },
    };
  }
}

