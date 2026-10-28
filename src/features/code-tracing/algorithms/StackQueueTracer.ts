/**
 * VisiOS — Stack and Queue Deterministic Execution Tracer
 * Traces push/pop (LIFO) and enqueue/dequeue (FIFO), peek, and underflow/overflow checks.
 */

import {
  ExecutionTrace,
  TraceStep,
  StackElement,
  QueueElement,
  ComplexityInfo,
  PredictionQuestion,
} from '../CodeTracingTypes';

export type StackQueueOp =
  | { type: 'push'; value: number | string }
  | { type: 'pop' }
  | { type: 'peek' }
  | { type: 'enqueue'; value: number | string }
  | { type: 'dequeue' };

export class StackQueueTracer {
  public static readonly STACK_CODE_LINES = [
    'class Stack:',
    '    def push(self, item):',
    '        if len(self.items) >= self.capacity: raise OverflowError()',
    '        self.items.append(item)',
    '    def pop(self):',
    '        if len(self.items) == 0: raise UnderflowError()',
    '        return self.items.pop()',
    '    def peek(self):',
    '        if len(self.items) == 0: return None',
    '        return self.items[-1]',
  ];

  public static readonly QUEUE_CODE_LINES = [
    'class Queue:',
    '    def enqueue(self, item):',
    '        if len(self.items) >= self.capacity: raise OverflowError()',
    '        self.items.append(item)',
    '    def dequeue(self):',
    '        if len(self.items) == 0: raise UnderflowError()',
    '        return self.items.pop(0)',
    '    def peek(self):',
    '        if len(self.items) == 0: return None',
    '        return self.items[0]',
  ];

  public static readonly STACK_COMPLEXITY: ComplexityInfo = {
    bestTime: 'O(1)',
    averageTime: 'O(1)',
    worstTime: 'O(1)',
    auxiliarySpace: 'O(n)',
    timeExplanation:
      'Push, pop, and peek only interact with the top pointer element of the stack, completing in constant O(1) time.',
    spaceExplanation:
      'Stores up to n elements in memory, requiring O(n) linear storage proportional to the number of stored items.',
    loopAnalysis:
      'No loops are required for standard LIFO stack operations; all mutations occur at index [-1].',
  };

  public static readonly QUEUE_COMPLEXITY: ComplexityInfo = {
    bestTime: 'O(1)',
    averageTime: 'O(1)',
    worstTime: 'O(1)',
    auxiliarySpace: 'O(n)',
    timeExplanation:
      'Enqueue adds to the rear and dequeue removes from the front. With circular buffer or linked list implementation, both operate in O(1) time.',
    spaceExplanation:
      'Stores up to n queued items awaiting processing, scaling linearly with item count (O(n)).',
    loopAnalysis:
      'FIFO queue operations execute without loops via head and tail pointers.',
  };

  public static readonly DEFAULT_STACK_OPS: StackQueueOp[] = [
    { type: 'push', value: 10 },
    { type: 'push', value: 25 },
    { type: 'peek' },
    { type: 'push', value: 42 },
    { type: 'pop' },
    { type: 'pop' },
    { type: 'pop' },
    { type: 'pop' }, // Triggers underflow
  ];

  public static readonly DEFAULT_QUEUE_OPS: StackQueueOp[] = [
    { type: 'enqueue', value: 'PrintJob 1' },
    { type: 'enqueue', value: 'PrintJob 2' },
    { type: 'peek' },
    { type: 'dequeue' },
    { type: 'enqueue', value: 'PrintJob 3' },
    { type: 'dequeue' },
    { type: 'dequeue' },
    { type: 'dequeue' }, // Triggers underflow
  ];

  /**
   * Traces Stack execution
   */
  public static traceStack(
    operations: StackQueueOp[] = this.DEFAULT_STACK_OPS,
    capacity: number = 8
  ): ExecutionTrace {
    const steps: TraceStep[] = [];
    let stepIndex = 0;
    let prevVars: Record<string, any> = {};
    const items: Array<number | string> = [];

    const makeStackElements = (activeTop?: number | string): StackElement[] => {
      return items.map((val, idx) => ({
        id: `stk-${idx}-${val}`,
        value: val,
        label: idx === items.length - 1 ? 'TOP' : `Index [${idx}]`,
        isTop: idx === items.length - 1,
      }));
    };

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

      const step: TraceStep = {
        stepIndex: stepIndex++,
        eventType,
        lineNumber,
        codeLine: this.STACK_CODE_LINES[lineNumber - 1] || '',
        variables: { ...variables },
        previousVariables: { ...prevVars },
        changedVariables: changedVars,
        activeScope: 'Stack',
        dataStructureState: {
          type: 'stack',
          stack: makeStackElements(),
          auxiliaryNotes: `Stack size: ${items.length} / ${capacity} | Top: ${
            items.length > 0 ? items[items.length - 1] : 'Empty'
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

    // Step 0: Stack Init
    recordStep(
      'program_start',
      1,
      { items: [...items], capacity, size: 0 },
      `Initialized new empty Stack (LIFO: Last-In, First-Out) with max capacity ${capacity}.`
    );

    let predAttached = false;

    for (const op of operations) {
      if (steps.length >= 500) break;

      if (op.type === 'push') {
        const val = op.value;
        // Line 2: def push
        recordStep(
          'call',
          2,
          { items: [...items], capacity, operation: `push(${val})`, item: val },
          `Called stack.push(${val}). Item prepared to be placed on top of stack.`
        );

        // Line 3: Overflow check
        const isOverflow = items.length >= capacity;
        recordStep(
          'condition_eval',
          3,
          { items: [...items], size: items.length, capacity, 'size >= capacity': isOverflow },
          `Checking capacity: (${items.length} >= ${capacity}) is ${isOverflow ? 'True' : 'False'}.`,
          { conditionResult: isOverflow }
        );

        if (isOverflow) {
          recordStep(
            'error',
            3,
            { items: [...items], size: items.length, capacity, error: 'OverflowError' },
            `❌ Stack Overflow Error: Cannot push to full stack (capacity ${capacity} exceeded).`,
            { errorMessage: 'Stack Overflow: Capacity exceeded.' }
          );
          continue;
        }

        // Line 4: append
        items.push(val);
        recordStep(
          'mutation',
          4,
          { items: [...items], size: items.length, top: val },
          `Pushed ${val} onto stack top. New stack height: ${items.length}.`
        );
      } else if (op.type === 'peek') {
        // Line 8: def peek
        recordStep(
          'call',
          8,
          { items: [...items], size: items.length, operation: 'peek()' },
          `Called stack.peek() to inspect top item without removal.`
        );

        // Line 9: empty check
        const isEmpty = items.length === 0;
        recordStep(
          'condition_eval',
          9,
          { items: [...items], size: items.length, 'size == 0': isEmpty },
          `Checking if stack is empty: (${items.length} == 0) is ${isEmpty ? 'True' : 'False'}.`,
          { conditionResult: isEmpty }
        );

        const peeked = isEmpty ? null : items[items.length - 1];
        // Line 10: return top
        recordStep(
          'return',
          10,
          { items: [...items], size: items.length, peekedResult: peeked },
          `Peek returned ${peeked !== null ? peeked : 'None'}. Stack items remain untouched.`
        );
      } else if (op.type === 'pop') {
        // Line 5: def pop
        let prediction: PredictionQuestion | undefined;
        if (!predAttached && items.length > 1) {
          predAttached = true;
          const expectedTop = items[items.length - 1];
          prediction = {
            id: 'stack-pred-1',
            question: `Stack currently contains [${items.join(', ')}]. What value will pop() return?`,
            options: [
              `Value ${expectedTop} (the top element placed most recently)`,
              `Value ${items[0]} (the bottom element placed first)`,
              `UnderflowError`,
            ],
            correctIndex: 0,
            explanation: `Because a stack is LIFO (Last-In, First-Out), pop() always retrieves the most recently pushed item: ${expectedTop}.`,
            targetStepIndex: stepIndex + 1,
          };
        }

        recordStep(
          'call',
          5,
          { items: [...items], size: items.length, operation: 'pop()' },
          `Called stack.pop(). Attempting to remove and return top element.`,
          { prediction }
        );

        // Line 6: Underflow check
        const isUnderflow = items.length === 0;
        recordStep(
          'condition_eval',
          6,
          { items: [...items], size: items.length, 'size == 0': isUnderflow },
          `Evaluating underflow check: (${items.length} == 0) is ${isUnderflow ? 'True' : 'False'}.`,
          { conditionResult: isUnderflow }
        );

        if (isUnderflow) {
          recordStep(
            'error',
            6,
            { items: [], size: 0, error: 'UnderflowError' },
            `⚠️ Stack Underflow: Cannot pop from empty stack (size is 0).`,
            { errorMessage: 'Stack Underflow: Attempted to pop from empty stack.' }
          );
          continue;
        }

        // Line 7: return items.pop()
        const popped = items.pop();
        recordStep(
          'return',
          7,
          { items: [...items], size: items.length, poppedValue: popped },
          `Popped and returned top value ${popped}. Remaining stack height: ${items.length}.`
        );
      }
    }

    // Terminal step
    recordStep(
      'terminal',
      1,
      { items: [...items], size: items.length, finalState: 'completed' },
      `Completed all stack operations. Final elements in stack: [${items.join(', ')}].`,
      { isTerminal: true }
    );

    return {
      algorithmId: 'stack_operations',
      algorithmName: 'Stack (LIFO) Operations',
      language: 'python',
      codeLines: this.STACK_CODE_LINES,
      initialInput: { operations, capacity },
      steps,
      complexity: this.STACK_COMPLEXITY,
      totalSteps: steps.length,
      success: true,
    };
  }

  /**
   * Traces Queue execution
   */
  public static traceQueue(
    operations: StackQueueOp[] = this.DEFAULT_QUEUE_OPS,
    capacity: number = 8
  ): ExecutionTrace {
    const steps: TraceStep[] = [];
    let stepIndex = 0;
    let prevVars: Record<string, any> = {};
    const items: Array<number | string> = [];

    const makeQueueElements = (): QueueElement[] => {
      return items.map((val, idx) => ({
        id: `q-${idx}-${val}`,
        value: val,
        label: idx === 0 ? 'FRONT' : idx === items.length - 1 ? 'REAR' : `Pos [${idx}]`,
        isFront: idx === 0,
        isRear: idx === items.length - 1,
      }));
    };

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

      const step: TraceStep = {
        stepIndex: stepIndex++,
        eventType,
        lineNumber,
        codeLine: this.QUEUE_CODE_LINES[lineNumber - 1] || '',
        variables: { ...variables },
        previousVariables: { ...prevVars },
        changedVariables: changedVars,
        activeScope: 'Queue',
        dataStructureState: {
          type: 'queue',
          queue: makeQueueElements(),
          auxiliaryNotes: `Queue length: ${items.length} / ${capacity} | Front: ${
            items.length > 0 ? items[0] : 'Empty'
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

    // Step 0: Queue Init
    recordStep(
      'program_start',
      1,
      { items: [...items], capacity, size: 0 },
      `Initialized new empty Queue (FIFO: First-In, First-Out) with max capacity ${capacity}.`
    );

    let predAttached = false;

    for (const op of operations) {
      if (steps.length >= 500) break;

      if (op.type === 'enqueue') {
        const val = op.value;
        // Line 2: def enqueue
        recordStep(
          'call',
          2,
          { items: [...items], capacity, operation: `enqueue("${val}")`, item: val },
          `Called queue.enqueue("${val}"). Queuing item at rear position.`
        );

        // Line 3: Overflow check
        const isOverflow = items.length >= capacity;
        recordStep(
          'condition_eval',
          3,
          { items: [...items], size: items.length, capacity, 'size >= capacity': isOverflow },
          `Checking capacity: (${items.length} >= ${capacity}) is ${isOverflow ? 'True' : 'False'}.`,
          { conditionResult: isOverflow }
        );

        if (isOverflow) {
          recordStep(
            'error',
            3,
            { items: [...items], size: items.length, capacity, error: 'OverflowError' },
            `❌ Queue Overflow Error: Queue capacity ${capacity} reached. Cannot enqueue.`,
            { errorMessage: 'Queue Overflow: Capacity exceeded.' }
          );
          continue;
        }

        // Line 4: append
        items.push(val);
        recordStep(
          'mutation',
          4,
          { items: [...items], size: items.length, rear: val },
          `Enqueued "${val}" at rear. New queue length: ${items.length}.`
        );
      } else if (op.type === 'peek') {
        recordStep(
          'call',
          8,
          { items: [...items], size: items.length, operation: 'peek()' },
          `Called queue.peek() to view front item without dequeueing.`
        );

        const isEmpty = items.length === 0;
        recordStep(
          'condition_eval',
          9,
          { items: [...items], size: items.length, 'size == 0': isEmpty },
          `Checking if queue is empty: (${items.length} == 0) is ${isEmpty ? 'True' : 'False'}.`,
          { conditionResult: isEmpty }
        );

        const peeked = isEmpty ? null : items[0];
        recordStep(
          'return',
          10,
          { items: [...items], size: items.length, peekedResult: peeked },
          `Peek returned ${peeked !== null ? `"${peeked}"` : 'None'}. Front item preserved.`
        );
      } else if (op.type === 'dequeue') {
        let prediction: PredictionQuestion | undefined;
        if (!predAttached && items.length > 1) {
          predAttached = true;
          const expectedFront = items[0];
          prediction = {
            id: 'queue-pred-1',
            question: `Queue has [${items.map((x) => `"${x}"`).join(', ')}]. Which item will dequeue() remove?`,
            options: [
              `"${expectedFront}" (the front element that entered first)`,
              `"${items[items.length - 1]}" (the rear element that entered last)`,
              `UnderflowError`,
            ],
            correctIndex: 0,
            explanation: `Because a queue is FIFO (First-In, First-Out), dequeue() removes the earliest arrived item at the front: "${expectedFront}".`,
            targetStepIndex: stepIndex + 1,
          };
        }

        recordStep(
          'call',
          5,
          { items: [...items], size: items.length, operation: 'dequeue()' },
          `Called queue.dequeue(). Attempting to remove and return front element.`,
          { prediction }
        );

        // Line 6: Underflow check
        const isUnderflow = items.length === 0;
        recordStep(
          'condition_eval',
          6,
          { items: [...items], size: items.length, 'size == 0': isUnderflow },
          `Evaluating underflow check: (${items.length} == 0) is ${isUnderflow ? 'True' : 'False'}.`,
          { conditionResult: isUnderflow }
        );

        if (isUnderflow) {
          recordStep(
            'error',
            6,
            { items: [], size: 0, error: 'UnderflowError' },
            `⚠️ Queue Underflow: Cannot dequeue from empty queue (length is 0).`,
            { errorMessage: 'Queue Underflow: Attempted to dequeue from empty queue.' }
          );
          continue;
        }

        // Line 7: pop(0)
        const dequeued = items.shift();
        recordStep(
          'return',
          7,
          { items: [...items], size: items.length, dequeuedValue: dequeued },
          `Dequeued and served front value "${dequeued}". Remaining queue length: ${items.length}.`
        );
      }
    }

    recordStep(
      'terminal',
      1,
      { items: [...items], size: items.length, finalState: 'completed' },
      `Completed all queue operations. Final elements in queue: [${items.join(', ')}].`,
      { isTerminal: true }
    );

    return {
      algorithmId: 'queue_operations',
      algorithmName: 'Queue (FIFO) Operations',
      language: 'python',
      codeLines: this.QUEUE_CODE_LINES,
      initialInput: { operations, capacity },
      steps,
      complexity: this.QUEUE_COMPLEXITY,
      totalSteps: steps.length,
      success: true,
    };
  }
}

