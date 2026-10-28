/**
 * VisiOS — Recursion (Factorial) Deterministic Execution Tracer
 * Traces recursive call stack frame allocations, parameter bindings, base cases, and return unwinding.
 */

import {
  ExecutionTrace,
  TraceStep,
  CallStackFrame,
  ComplexityInfo,
  PredictionQuestion,
} from '../CodeTracingTypes';

export class RecursionTracer {
  public static readonly CODE_LINES = [
    'def factorial(n):',
    '    if n <= 1:',
    '        return 1',
    '    sub_result = factorial(n - 1)',
    '    return n * sub_result',
  ];

  public static readonly COMPLEXITY: ComplexityInfo = {
    bestTime: 'O(1)',
    averageTime: 'O(n)',
    worstTime: 'O(n)',
    auxiliarySpace: 'O(n)',
    timeExplanation:
      'For input n, the algorithm makes exactly n - 1 recursive calls before reaching the base case n <= 1. Each level performs O(1) arithmetic, totaling O(n) time.',
    spaceExplanation:
      'Each recursive invocation allocates a new activation record (call-stack frame) containing parameter n and return address. Maximum recursion depth is n, requiring O(n) auxiliary call-stack memory.',
    loopAnalysis:
      'No iterative loops. Execution flow is governed entirely by recursive function calls and call-stack unwinding.',
  };

  public static readonly MAX_N = 12;

  public static trace(rawN: number = 4): ExecutionTrace {
    const steps: TraceStep[] = [];
    let stepIndex = 0;
    let prevVars: Record<string, any> = {};

    const callStack: CallStackFrame[] = [];

    const recordStep = (
      eventType: TraceStep['eventType'],
      lineNumber: number,
      variables: Record<string, any>,
      explanation: string,
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

      // Deep clone call stack frames
      const clonedStack: CallStackFrame[] = callStack.map((f) => ({
        ...f,
        arguments: { ...f.arguments },
        localVariables: { ...f.localVariables },
      }));

      const step: TraceStep = {
        stepIndex: stepIndex++,
        eventType,
        lineNumber,
        codeLine: this.CODE_LINES[lineNumber - 1] || '',
        variables: { ...variables },
        previousVariables: { ...prevVars },
        changedVariables: changedVars,
        activeScope: callStack.length > 0 ? `factorial(n=${callStack[callStack.length - 1].arguments.n})` : 'global',
        dataStructureState: {
          type: 'call_stack',
          callStack: clonedStack,
          auxiliaryNotes: `Call stack depth: ${callStack.length} | Top frame: ${
            callStack.length > 0 ? `factorial(${callStack[callStack.length - 1].arguments.n})` : 'empty'
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

    // Bounds checking
    const n = Math.floor(rawN);
    if (isNaN(n) || n < 0) {
      recordStep(
        'error',
        1,
        { n: rawN },
        `❌ Input Error: Factorial is only defined for non-negative integers (n >= 0). Received: ${rawN}.`,
        { isTerminal: true, errorMessage: 'Domain error: n must be a non-negative integer.' }
      );
      return {
        algorithmId: 'recursion_factorial',
        algorithmName: 'Recursion (Factorial Call Stack)',
        language: 'python',
        codeLines: this.CODE_LINES,
        initialInput: { n: rawN },
        steps,
        complexity: this.COMPLEXITY,
        totalSteps: steps.length,
        success: false,
        errorMessage: 'Domain error: n must be a non-negative integer.',
      };
    }

    if (n > this.MAX_N) {
      recordStep(
        'error',
        1,
        { n, maxAllowed: this.MAX_N },
        `⚠️ Safety Boundary Exceeded: Recursion tracing supports n <= ${this.MAX_N} to avoid call stack overflow. Received: n = ${n}.`,
        { isTerminal: true, errorMessage: `Input exceeds safety limit of n <= ${this.MAX_N}.` }
      );
      return {
        algorithmId: 'recursion_factorial',
        algorithmName: 'Recursion (Factorial Call Stack)',
        language: 'python',
        codeLines: this.CODE_LINES,
        initialInput: { n },
        steps,
        complexity: this.COMPLEXITY,
        totalSteps: steps.length,
        success: false,
        errorMessage: `Input exceeds safety limit of n <= ${this.MAX_N}.`,
      };
    }

    // Step 0: Global caller invocation
    recordStep(
      'program_start',
      1,
      { initial_n: n },
      `Initial invocation: factorial(n=${n}). Allocating execution context.`
    );

    let predAttached = false;

    // Recursive helper that models exact call and return frames
    const runFactorial = (currentN: number): number => {
      // Line 1: def factorial(n) -> Push new stack frame
      const frame: CallStackFrame = {
        frameId: `frame-n-${currentN}`,
        functionName: 'factorial',
        arguments: { n: currentN },
        localVariables: { n: currentN },
        lineNumber: 1,
        isUnwinding: false,
      };
      callStack.push(frame);

      recordStep(
        'call',
        1,
        { n: currentN, stackDepth: callStack.length },
        `[PUSH] Pushed activation frame for factorial(n=${currentN}) to stack (Depth ${callStack.length}).`
      );

      // Line 2: if n <= 1
      const isBaseCase = currentN <= 1;
      frame.lineNumber = 2;

      let prediction: PredictionQuestion | undefined;
      if (!predAttached && isBaseCase) {
        predAttached = true;
        prediction = {
          id: 'rec-pred-1',
          question: `factorial(${currentN}): Evaluating if n <= 1. Does this trigger the base case?`,
          options: [
            `Yes, (${currentN} <= 1) is True. Base case reached; return 1 directly without further recursive calls.`,
            `No, recurse to factorial(${currentN - 1})`,
            `Return 0`,
          ],
          correctIndex: 0,
          explanation: `When n is ${currentN}, the base condition (n <= 1) is satisfied. Recursion stops here and begins unwinding.`,
          targetStepIndex: stepIndex + 1,
        };
      }

      recordStep(
        'condition_eval',
        2,
        { n: currentN, 'n <= 1': isBaseCase, stackDepth: callStack.length },
        `Evaluating base case condition (${currentN} <= 1): ${isBaseCase ? 'True (Base Case)' : 'False (Recursive Step)'}.`,
        { conditionResult: isBaseCase, prediction }
      );

      if (isBaseCase) {
        // Line 3: return 1
        frame.lineNumber = 3;
        frame.returnValue = 1;
        frame.isUnwinding = true;

        recordStep(
          'return',
          3,
          { n: currentN, returnValue: 1, stackDepth: callStack.length },
          `Base case hit: factorial(${currentN}) returns 1. Starting call-stack unwinding phase.`
        );

        callStack.pop();
        return 1;
      }

      // Line 4: sub_result = factorial(n - 1)
      frame.lineNumber = 4;
      recordStep(
        'call',
        4,
        { n: currentN, nextCall: `factorial(${currentN - 1})`, stackDepth: callStack.length },
        `Pausing current frame factorial(n=${currentN}) to compute sub_result = factorial(${currentN - 1}).`
      );

      const subResult = runFactorial(currentN - 1);

      // Resumed after subcall returns
      frame.lineNumber = 4;
      frame.localVariables.sub_result = subResult;
      recordStep(
        'assignment',
        4,
        { n: currentN, sub_result: subResult, stackDepth: callStack.length },
        `Resumed factorial(n=${currentN}). Received sub_result = ${subResult} from child frame.`
      );

      // Line 5: return n * sub_result
      const finalVal = currentN * subResult;
      frame.lineNumber = 5;
      frame.returnValue = finalVal;
      frame.isUnwinding = true;

      recordStep(
        'return',
        5,
        { n: currentN, sub_result: subResult, calculation: `${currentN} * ${subResult}`, returnValue: finalVal },
        `[POP] factorial(n=${currentN}) computes ${currentN} * ${subResult} = ${finalVal} and returns. Popping frame (Depth ${callStack.length}).`
      );

      callStack.pop();
      return finalVal;
    };

    const finalAnswer = runFactorial(n);

    // Final terminal step
    recordStep(
      'terminal',
      5,
      { n, finalResult: finalAnswer },
      `🎯 Recursion fully unwound. factorial(${n}) = ${finalAnswer}. Call stack empty.`,
      { isTerminal: true }
    );

    return {
      algorithmId: 'recursion_factorial',
      algorithmName: 'Recursion (Factorial Call Stack)',
      language: 'python',
      codeLines: this.CODE_LINES,
      initialInput: { n },
      steps,
      complexity: this.COMPLEXITY,
      totalSteps: steps.length,
      success: true,
    };
  }
}

