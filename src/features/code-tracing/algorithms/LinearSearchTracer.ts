/**
 * VisiOS — Linear Search Deterministic Execution Tracer
 * Traces sequential examination of array elements, comparisons, and target identification.
 */

import {
  ExecutionTrace,
  TraceStep,
  VisualArrayElement,
  ComplexityInfo,
  PredictionQuestion,
} from '../CodeTracingTypes';

export class LinearSearchTracer {
  public static readonly CODE_LINES = [
    'def linear_search(arr, target):',
    '    for i in range(len(arr)):',
    '        if arr[i] == target:',
    '            return i',
    '    return -1',
  ];

  public static readonly COMPLEXITY: ComplexityInfo = {
    bestTime: 'O(1)',
    averageTime: 'O(n)',
    worstTime: 'O(n)',
    auxiliarySpace: 'O(1)',
    timeExplanation:
      'In the worst case (element at end or absent), linear search examines every element once sequentially. Average comparisons equal (n + 1) / 2.',
    spaceExplanation:
      'Only a single loop counter index variable (i) is maintained, requiring O(1) constant auxiliary memory.',
    loopAnalysis:
      'The single for-loop iterates up to n times where n is the length of the array.',
  };

  public static trace(rawArray: number[], target: number): ExecutionTrace {
    const arr = [...(rawArray || [])].slice(0, 20);
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
        activeScope: 'linear_search',
        dataStructureState: {
          type: 'array',
          array: arrayElements.map((el) => ({ ...el, pointers: [...(el.pointers || [])] })),
          auxiliaryNotes: `Comparisons completed: ${variables.i !== undefined ? variables.i + 1 : 0}`,
        },
        conditionResult: options?.conditionResult,
        explanation,
        isTerminal: options?.isTerminal ?? false,
        prediction: options?.prediction,
      };

      steps.push(step);
      prevVars = { ...variables };
      return step;
    };

    const makeElements = (activeIdx: number, matchedIdx: number = -1): VisualArrayElement[] => {
      return arr.map((val, idx) => {
        const pointers: string[] = [];
        if (idx === activeIdx) pointers.push('i');

        let status: VisualArrayElement['status'] = 'default';
        if (matchedIdx === idx) {
          status = 'matched';
        } else if (idx === activeIdx) {
          status = 'comparing';
        } else if (idx < activeIdx) {
          status = 'eliminated';
        } else {
          status = 'default';
        }

        return {
          id: `ls-el-${idx}`,
          index: idx,
          value: val,
          status,
          pointers,
        };
      });
    };

    // Step 1: Function entry
    recordStep(
      'program_start',
      1,
      { arr: [...arr], target },
      `Entered linear_search(arr, target=${target}) with ${arr.length} elements.`,
      makeElements(-1)
    );

    // Empty array handling
    if (arr.length === 0) {
      recordStep(
        'terminal',
        5,
        { arr: [], target, result: -1 },
        'Array is empty. Loop range(0) has 0 iterations. Returns -1 immediately.',
        [],
        { isTerminal: true }
      );
      return {
        algorithmId: 'linear_search',
        algorithmName: 'Linear Search',
        language: 'python',
        codeLines: this.CODE_LINES,
        initialInput: { array: rawArray, target },
        steps,
        complexity: this.COMPLEXITY,
        totalSteps: steps.length,
        success: true,
      };
    }

    let found = false;

    for (let i = 0; i < arr.length && steps.length < 500; i++) {
      const currentVal = arr[i];

      // Prediction at i = 0
      const prediction: PredictionQuestion | undefined =
        i === 0
          ? {
              id: 'ls-pred-1',
              question: `Inspecting first element arr[0] = ${currentVal} with target = ${target}. Will this match?`,
              options:
                currentVal === target
                  ? [
                      `Yes, arr[0] == ${target}. Returns index 0 immediately (Best Case O(1))!`,
                      `No, continue to index 1`,
                      `Binary search to index len(arr)/2`,
                    ]
                  : [
                      `No, arr[0] (${currentVal}) != ${target}. Moves to next index i = 1`,
                      `Yes, arr[0] matches target`,
                      `Throws an error`,
                    ],
              correctIndex: 0,
              explanation:
                currentVal === target
                  ? `arr[0] equals ${target}. The search succeeds on the first comparison!`
                  : `arr[0] (${currentVal}) does not equal ${target}. The for-loop advances to index 1.`,
              targetStepIndex: stepIndex + 1,
            }
          : undefined;

      // Line 2: Loop iteration
      recordStep(
        'loop_iteration',
        2,
        { arr: [...arr], target, i, currentVal },
        `Loop iteration i = ${i} of ${arr.length - 1}. Examining element at index [${i}].`,
        makeElements(i),
        { prediction }
      );

      // Line 3: Compare arr[i] == target
      const isEqual = currentVal === target;
      recordStep(
        'comparison',
        3,
        { arr: [...arr], target, i, currentVal, 'arr[i] == target': isEqual },
        `Evaluating (arr[${i}] == ${target}) -> (${currentVal} == ${target}) is ${isEqual ? 'True' : 'False'}.`,
        makeElements(i, isEqual ? i : -1),
        { conditionResult: isEqual }
      );

      if (isEqual) {
        // Line 4: return i
        recordStep(
          'terminal',
          4,
          { arr: [...arr], target, i, result: i },
          `🎯 Target found at index [${i}]! Returning ${i} after ${i + 1} comparison(s).`,
          makeElements(i, i),
          { isTerminal: true }
        );
        found = true;
        break;
      }
    }

    if (!found) {
      // Line 5: return -1
      recordStep(
        'terminal',
        5,
        { arr: [...arr], target, result: -1 },
        `❌ Reached end of array. Scanned all ${arr.length} elements without match. Returning -1.`,
        makeElements(arr.length),
        { isTerminal: true }
      );
    }

    return {
      algorithmId: 'linear_search',
      algorithmName: 'Linear Search',
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

