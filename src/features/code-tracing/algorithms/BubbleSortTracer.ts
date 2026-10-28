/**
 * VisiOS — Bubble Sort Deterministic Execution Tracer
 * Traces adjacent comparisons, element swaps, pass progression, and early-termination optimization.
 */

import {
  ExecutionTrace,
  TraceStep,
  VisualArrayElement,
  ComplexityInfo,
  PredictionQuestion,
} from '../CodeTracingTypes';

export class BubbleSortTracer {
  public static readonly CODE_LINES = [
    'def bubble_sort(arr):',
    '    n = len(arr)',
    '    for i in range(n):',
    '        swapped = False',
    '        for j in range(0, n - i - 1):',
    '            if arr[j] > arr[j + 1]:',
    '                arr[j], arr[j + 1] = arr[j + 1], arr[j]',
    '                swapped = True',
    '        if not swapped:',
    '            break',
    '    return arr',
  ];

  public static readonly COMPLEXITY: ComplexityInfo = {
    bestTime: 'O(n)',
    averageTime: 'O(n²)',
    worstTime: 'O(n²)',
    auxiliarySpace: 'O(1)',
    timeExplanation:
      'With the `swapped` flag optimization, an already-sorted array requires only 1 pass of (n - 1) comparisons (O(n)). In the average and worst cases (reversed), nested loops require n(n - 1)/2 comparisons and swaps (O(n²)).',
    spaceExplanation:
      'Bubble sort operates purely in-place, swapping adjacent elements inside the original buffer without additional memory allocation (O(1)).',
    loopAnalysis:
      'Outer loop runs up to n passes; inner loop compares n - i - 1 adjacent pairs per pass.',
  };

  public static trace(rawArray: number[]): ExecutionTrace {
    const arr = [...(rawArray || [5, 2, 8, 1, 9])].slice(0, 16); // Bounded to prevent runaway steps
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
        activeScope: 'bubble_sort',
        dataStructureState: {
          type: 'array',
          array: arrayElements.map((el) => ({ ...el, pointers: [...(el.pointers || [])] })),
          auxiliaryNotes: `Pass ${variables.i !== undefined ? variables.i + 1 : 0} | Swaps this pass: ${
            variables.swapsThisPass ?? 0
          }`,
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

    const makeElements = (
      currentArr: number[],
      j: number = -1,
      comparingOther: number = -1,
      sortedFromIdx: number = currentArr.length,
      swapping: boolean = false
    ): VisualArrayElement[] => {
      return currentArr.map((val, idx) => {
        const pointers: string[] = [];
        if (idx === j) pointers.push('j');
        if (idx === comparingOther) pointers.push('j+1');

        let status: VisualArrayElement['status'] = 'default';
        if (idx >= sortedFromIdx) {
          status = 'sorted';
        } else if (swapping && (idx === j || idx === comparingOther)) {
          status = 'swapped';
        } else if (idx === j || idx === comparingOther) {
          status = 'comparing';
        }

        return {
          id: `bubble-el-${idx}`,
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
      { arr: [...arr] },
      `Entered bubble_sort(arr) with array [${arr.join(', ')}].`,
      makeElements(arr)
    );

    const n = arr.length;
    // Step 2: n = len(arr)
    recordStep(
      'variable_decl',
      2,
      { arr: [...arr], n },
      `Computed array length n = len(arr) = ${n}.`,
      makeElements(arr)
    );

    if (n <= 1) {
      recordStep(
        'terminal',
        11,
        { arr: [...arr], n, result: [...arr] },
        `Array has length ${n} (<= 1), already sorted. Returning immediately.`,
        makeElements(arr, -1, -1, 0),
        { isTerminal: true }
      );
      return {
        algorithmId: 'bubble_sort',
        algorithmName: 'Bubble Sort',
        language: 'python',
        codeLines: this.CODE_LINES,
        initialInput: { array: rawArray },
        steps,
        complexity: this.COMPLEXITY,
        totalSteps: steps.length,
        success: true,
      };
    }

    let predictionAttached = false;

    // Outer loop passes
    for (let i = 0; i < n && steps.length < 500; i++) {
      // Step 3: Outer loop pass i
      recordStep(
        'loop_iteration',
        3,
        { arr: [...arr], n, i },
        `Starting pass i = ${i}. Bubble pass ${i + 1} will position the ${i + 1}th largest element at index ${n - i - 1}.`,
        makeElements(arr, -1, -1, n - i)
      );

      // Step 4: swapped = False
      let swapped = false;
      let swapsThisPass = 0;
      recordStep(
        'assignment',
        4,
        { arr: [...arr], n, i, swapped: false, swapsThisPass },
        `Initialized swapped = False for pass ${i + 1}. If no swaps occur, the array is confirmed sorted.`,
        makeElements(arr, -1, -1, n - i)
      );

      // Inner loop
      for (let j = 0; j < n - i - 1 && steps.length < 500; j++) {
        // Step 5: Inner loop iteration j
        recordStep(
          'loop_iteration',
          5,
          { arr: [...arr], n, i, j, 'n - i - 1': n - i - 1, swapped, swapsThisPass },
          `Inner loop j = ${j}. Inspecting adjacent pair arr[${j}] (${arr[j]}) and arr[${j + 1}] (${arr[j + 1]}).`,
          makeElements(arr, j, j + 1, n - i)
        );

        // Prediction at the first comparison
        let prediction: PredictionQuestion | undefined;
        if (!predictionAttached) {
          predictionAttached = true;
          const shouldSwap = arr[j] > arr[j + 1];
          prediction = {
            id: 'bubble-pred-1',
            question: `arr[${j}] is ${arr[j]} and arr[${j + 1}] is ${arr[j + 1]}. Will they be swapped?`,
            options: shouldSwap
              ? [
                  `Yes, because arr[${j}] (${arr[j]}) > arr[${j + 1}] (${arr[j + 1]}).`,
                  `No, they are already in relative order.`,
                  `The array terminates immediately.`,
                ]
              : [
                  `No, because arr[${j}] (${arr[j]}) <= arr[${j + 1}] (${arr[j + 1]}).`,
                  `Yes, adjacent elements always swap.`,
                  `The outer loop breaks.`,
                ],
            correctIndex: 0,
            explanation: shouldSwap
              ? `Since ${arr[j]} > ${arr[j + 1]}, they are inverted and must be swapped so the larger element floats rightward.`
              : `Since ${arr[j]} <= ${arr[j + 1]}, they are in correct non-decreasing order. No swap needed.`,
            targetStepIndex: stepIndex + 1,
          };
        }

        // Step 6: Compare arr[j] > arr[j + 1]
        const needSwap = arr[j] > arr[j + 1];
        recordStep(
          'comparison',
          6,
          {
            arr: [...arr],
            n,
            i,
            j,
            'arr[j]': arr[j],
            'arr[j+1]': arr[j + 1],
            'arr[j] > arr[j + 1]': needSwap,
            swapped,
            swapsThisPass,
          },
          `Evaluated (arr[${j}] > arr[${j + 1}]) -> (${arr[j]} > ${arr[j + 1]}) is ${needSwap ? 'True' : 'False'}.`,
          makeElements(arr, j, j + 1, n - i),
          { conditionResult: needSwap, prediction }
        );

        if (needSwap) {
          // Step 7: Swap elements
          const temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;
          swapped = true;
          swapsThisPass++;

          recordStep(
            'swap',
            7,
            { arr: [...arr], n, i, j, swapped: true, swapsThisPass },
            `Swapped arr[${j}] and arr[${j + 1}]. Larger value ${arr[j + 1]} bubbled forward to index ${j + 1}.`,
            makeElements(arr, j, j + 1, n - i, true)
          );

          // Step 8: swapped = True
          recordStep(
            'assignment',
            8,
            { arr: [...arr], n, i, j, swapped: true, swapsThisPass },
            `Set swapped = True to indicate modifications occurred in this pass.`,
            makeElements(arr, j, j + 1, n - i)
          );
        }
      }

      // Mark the placed element as sorted
      const settledIdx = n - i - 1;

      // Step 9: Check not swapped (Early Termination Check)
      recordStep(
        'condition_eval',
        9,
        { arr: [...arr], n, i, swapped, swapsThisPass, 'not swapped': !swapped },
        `Checking if not swapped: swapped is ${swapped ? 'True' : 'False'}. (${swapsThisPass} swap(s) performed in pass ${i + 1}).`,
        makeElements(arr, -1, -1, settledIdx),
        { conditionResult: !swapped }
      );

      if (!swapped) {
        // Step 10: break early
        recordStep(
          'terminal',
          10,
          { arr: [...arr], n, i, swapped: false, result: [...arr] },
          `⚡ Early Termination Triggered: Zero swaps in pass ${i + 1}! The array is completely sorted. Breaking loop (Best Case O(n)).`,
          makeElements(arr, -1, -1, 0),
          { isTerminal: true }
        );
        break;
      }
    }

    // Step 11: Final return
    if (!steps[steps.length - 1].isTerminal) {
      recordStep(
        'terminal',
        11,
        { arr: [...arr], n, result: [...arr] },
        `🎉 Bubble sort completed. All elements sorted: [${arr.join(', ')}]. Returning array.`,
        makeElements(arr, -1, -1, 0),
        { isTerminal: true }
      );
    }

    return {
      algorithmId: 'bubble_sort',
      algorithmName: 'Bubble Sort',
      language: 'python',
      codeLines: this.CODE_LINES,
      initialInput: { array: rawArray },
      steps,
      complexity: this.COMPLEXITY,
      totalSteps: steps.length,
      success: true,
    };
  }
}

