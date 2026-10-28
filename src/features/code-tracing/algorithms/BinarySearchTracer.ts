/**
 * VisiOS — Binary Search Deterministic Execution Tracer
 * Traces binary search pointer updates, halving logic, precondition validations, and predictions.
 */

import {
  ExecutionTrace,
  TraceStep,
  VisualArrayElement,
  ComplexityInfo,
  PredictionQuestion,
} from '../CodeTracingTypes';

export class BinarySearchTracer {
  public static readonly CODE_LINES = [
    'def binary_search(arr, target):',
    '    low = 0',
    '    high = len(arr) - 1',
    '    while low <= high:',
    '        mid = (low + high) // 2',
    '        if arr[mid] == target:',
    '            return mid',
    '        elif arr[mid] < target:',
    '            low = mid + 1',
    '        else:',
    '            high = mid - 1',
    '    return -1',
  ];

  public static readonly COMPLEXITY: ComplexityInfo = {
    bestTime: 'O(1)',
    averageTime: 'O(log n)',
    worstTime: 'O(log n)',
    auxiliarySpace: 'O(1)',
    timeExplanation:
      'In each iteration, the comparison with arr[mid] cuts the remaining search space in half. The maximum number of comparisons is ⌊log₂(n)⌋ + 1.',
    spaceExplanation:
      'Iterative binary search operates in-place using three pointer variables (low, mid, high), consuming constant O(1) auxiliary space.',
    loopAnalysis:
      'The while loop runs at most ⌈log₂(n)⌉ iterations before low > high or the target is found.',
  };

  /**
   * Validates if the array is sorted in non-decreasing order.
   */
  public static isSorted(arr: number[]): boolean {
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] < arr[i - 1]) return false;
    }
    return true;
  }

  /**
   * Generates a complete deterministic execution trace.
   */
  public static trace(rawArray: number[], target: number): ExecutionTrace {
    const arr = [...(rawArray || [])].slice(0, 20); // Clamp to max 20 elements
    const steps: TraceStep[] = [];
    let stepIndex = 0;
    let prevVars: Record<string, any> = {};

    const recordStep = (
      eventType: TraceStep['eventType'],
      lineNumber: number,
      variables: Record<string, any>,
      explanation: string,
      arrayElements: VisualArrayElement[],
      options?: {
        conditionResult?: boolean;
        isTerminal?: boolean;
        prediction?: PredictionQuestion;
        errorMessage?: string;
      }
    ) => {
      const changedVars: string[] = [];
      for (const key of Object.keys(variables)) {
        if (prevVars[key] !== variables[key]) {
          changedVars.push(key);
        }
      }

      const step: TraceStep = {
        stepIndex: stepIndex++,
        eventType,
        lineNumber,
        codeLine: this.CODE_LINES[lineNumber - 1] || '',
        variables: { ...variables },
        previousVariables: { ...prevVars },
        changedVariables: changedVars,
        activeScope: 'binary_search',
        dataStructureState: {
          type: 'array',
          array: arrayElements.map((el) => ({ ...el, pointers: [...(el.pointers || [])] })),
          auxiliaryNotes: `Search space size: ${
            variables.low !== undefined && variables.high !== undefined && variables.low <= variables.high
              ? variables.high - variables.low + 1
              : 0
          }`,
        },
        conditionResult: options?.conditionResult,
        explanation,
        isTerminal: options?.isTerminal ?? false,
        prediction: options?.prediction,
        errorMessage: options?.errorMessage,
      };

      steps.push(step);
      prevVars = { ...variables };
      return step;
    };

    const makeElements = (
      low: number,
      high: number,
      mid: number = -1,
      matchedIdx: number = -1
    ): VisualArrayElement[] => {
      return arr.map((val, idx) => {
        const pointers: string[] = [];
        if (idx === low) pointers.push('low');
        if (idx === mid) pointers.push('mid');
        if (idx === high) pointers.push('high');

        let status: VisualArrayElement['status'] = 'default';
        if (matchedIdx === idx) {
          status = 'matched';
        } else if (idx === mid) {
          status = 'comparing';
        } else if (idx < low || idx > high) {
          status = 'eliminated';
        } else {
          status = 'active';
        }

        return {
          id: `bs-el-${idx}`,
          index: idx,
          value: val,
          status,
          pointers,
        };
      });
    };

    // Step 0: Precondition Check
    if (!this.isSorted(arr)) {
      recordStep(
        'error',
        1,
        { arr: [...arr], target },
        `❌ Precondition Violation: Binary search requires array to be sorted. Received unsorted input: [${arr.join(', ')}].`,
        arr.map((val, idx) => ({
          id: `bs-el-${idx}`,
          index: idx,
          value: val,
          status: 'default',
        })),
        {
          isTerminal: true,
          errorMessage: 'Precondition violation: Array must be sorted in ascending order.',
        }
      );

      return {
        algorithmId: 'binary_search',
        algorithmName: 'Binary Search',
        language: 'python',
        codeLines: this.CODE_LINES,
        initialInput: { array: rawArray, target },
        steps,
        complexity: this.COMPLEXITY,
        totalSteps: steps.length,
        success: false,
        errorMessage: 'Precondition violation: Array must be sorted.',
      };
    }

    // Step 1: Function entry
    recordStep(
      'program_start',
      1,
      { arr: [...arr], target },
      `Entered binary_search(arr, target=${target}) with ${arr.length} sorted elements.`,
      makeElements(0, arr.length - 1)
    );

    // Empty array check
    if (arr.length === 0) {
      recordStep(
        'terminal',
        12,
        { arr: [], target, result: -1 },
        'Array is empty (0 elements). Returns -1 immediately because search interval is empty.',
        [],
        { isTerminal: true }
      );
      return {
        algorithmId: 'binary_search',
        algorithmName: 'Binary Search',
        language: 'python',
        codeLines: this.CODE_LINES,
        initialInput: { array: rawArray, target },
        steps,
        complexity: this.COMPLEXITY,
        totalSteps: steps.length,
        success: true,
      };
    }

    // Step 2: Initialize low = 0
    let low = 0;
    recordStep(
      'variable_decl',
      2,
      { arr: [...arr], target, low },
      `Initialized pointer low = 0 (first element arr[0] = ${arr[0]}).`,
      makeElements(low, arr.length - 1)
    );

    // Step 3: Initialize high = len(arr) - 1
    let high = arr.length - 1;
    recordStep(
      'variable_decl',
      3,
      { arr: [...arr], target, low, high },
      `Initialized pointer high = len(arr) - 1 = ${high} (last element arr[${high}] = ${arr[high]}).`,
      makeElements(low, high)
    );

    let found = false;
    let iteration = 0;

    while (low <= high && steps.length < 500) {
      iteration++;

      // Step 4: Evaluate while low <= high
      const whileCond = low <= high;
      recordStep(
        'condition_eval',
        4,
        { arr: [...arr], target, low, high, iteration },
        `Evaluating while low <= high: (${low} <= ${high}) is True. Interval size is ${high - low + 1}.`,
        makeElements(low, high),
        { conditionResult: whileCond }
      );

      // Step 5: Compute mid
      const mid = Math.floor((low + high) / 2);
      const midVal = arr[mid];

      // Attach a prediction question on the first iteration
      const prediction: PredictionQuestion | undefined =
        iteration === 1
          ? {
              id: 'bs-pred-1',
              question: `Comparing arr[${mid}] = ${midVal} with target = ${target}. What will the algorithm conclude?`,
              options:
                midVal === target
                  ? [
                      `arr[${mid}] == ${target} (Found target!)`,
                      `arr[${mid}] < ${target} (Search right half)`,
                      `arr[${mid}] > ${target} (Search left half)`,
                    ]
                  : midVal < target
                  ? [
                      `arr[${mid}] < ${target} (Search right half: low = mid + 1)`,
                      `arr[${mid}] > ${target} (Search left half: high = mid - 1)`,
                      `arr[${mid}] == ${target} (Found target)`,
                    ]
                  : [
                      `arr[${mid}] > ${target} (Search left half: high = mid - 1)`,
                      `arr[${mid}] < ${target} (Search right half: low = mid + 1)`,
                      `arr[${mid}] == ${target} (Found target)`,
                    ],
              correctIndex: 0,
              explanation:
                midVal === target
                  ? `arr[${mid}] equals ${target}. Target is located at index ${mid}!`
                  : midVal < target
                  ? `arr[${mid}] (${midVal}) is less than target (${target}). Since array is sorted, all elements at index <= ${mid} are discarded.`
                  : `arr[${mid}] (${midVal}) is greater than target (${target}). Since array is sorted, all elements at index >= ${mid} are discarded.`,
              targetStepIndex: stepIndex + 1,
            }
          : undefined;

      recordStep(
        'assignment',
        5,
        { arr: [...arr], target, low, high, mid, midVal },
        `Calculated mid = (${low} + ${high}) // 2 = ${mid}. Inspecting element arr[${mid}] = ${midVal}.`,
        makeElements(low, high, mid),
        { prediction }
      );

      // Step 6: Check arr[mid] == target
      const isEqual = midVal === target;
      recordStep(
        'comparison',
        6,
        { arr: [...arr], target, low, high, mid, midVal, 'arr[mid] == target': isEqual },
        `Evaluated (arr[${mid}] == ${target}) -> (${midVal} == ${target}) is ${isEqual ? 'True' : 'False'}.`,
        makeElements(low, high, mid, isEqual ? mid : -1),
        { conditionResult: isEqual }
      );

      if (isEqual) {
        // Step 7: Return mid
        recordStep(
          'terminal',
          7,
          { arr: [...arr], target, low, high, mid, result: mid },
          `🎯 Match confirmed! Returning index ${mid}. Target ${target} found in ${iteration} iteration(s).`,
          makeElements(low, high, mid, mid),
          { isTerminal: true }
        );
        found = true;
        break;
      }

      // Step 8: Check arr[mid] < target
      const isLess = midVal < target;
      recordStep(
        'comparison',
        8,
        { arr: [...arr], target, low, high, mid, midVal, 'arr[mid] < target': isLess },
        `Evaluated (arr[${mid}] < ${target}) -> (${midVal} < ${target}) is ${isLess ? 'True' : 'False'}.`,
        makeElements(low, high, mid),
        { conditionResult: isLess }
      );

      if (isLess) {
        // Step 9: low = mid + 1
        low = mid + 1;
        recordStep(
          'assignment',
          9,
          { arr: [...arr], target, low, high, mid },
          `Since ${midVal} < ${target}, target must lie in right half. Updated low = mid + 1 = ${low}. Discarded left half [0..${mid}].`,
          makeElements(low, high)
        );
      } else {
        // Step 11: high = mid - 1
        high = mid - 1;
        recordStep(
          'assignment',
          11,
          { arr: [...arr], target, low, high, mid },
          `Since ${midVal} > ${target}, target must lie in left half. Updated high = mid - 1 = ${high}. Discarded right half [${mid}..${arr.length - 1}].`,
          makeElements(low, high)
        );
      }
    }

    if (!found) {
      // Loop condition became false
      recordStep(
        'condition_eval',
        4,
        { arr: [...arr], target, low, high },
        `Loop terminated: low (${low}) > high (${high}) is False. Search interval exhausted without match.`,
        makeElements(low, high),
        { conditionResult: false }
      );

      // Step 12: Return -1
      recordStep(
        'terminal',
        12,
        { arr: [...arr], target, low, high, result: -1 },
        `❌ Target ${target} is not in the array. Returning -1 after ${iteration} comparison round(s).`,
        makeElements(low, high),
        { isTerminal: true }
      );
    }

    return {
      algorithmId: 'binary_search',
      algorithmName: 'Binary Search',
      language: 'python',
      codeLines: this.CODE_LINES,
      initialInput: { array: rawArray, target },
      steps,
      complexity: this.COMPLEXITY,
      totalSteps: steps.length,
      success: true,
    };
  }
}

