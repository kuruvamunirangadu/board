/**
 * VisiOS — Interactive Data Structure Operations Engine
 * Implements deterministic operations for Arrays, Stacks, Queues, and Linked Lists.
 * Displays state changes, operation logs, and asymptotic time complexity badges.
 */

import { DataStructureState, DataStructureType } from './types';

export class DataStructureEngine {
  /**
   * Creates initial default state for a data structure.
   */
  public static createInitialState(type: DataStructureType = 'stack'): DataStructureState {
    switch (type) {
      case 'array':
        return {
          structureType: 'array',
          elements: [
            { id: 'arr-0', value: 14, label: '[0]' },
            { id: 'arr-1', value: 29, label: '[1]' },
            { id: 'arr-2', value: 43, label: '[2]' },
            { id: 'arr-3', value: 78, label: '[3]' },
            { id: 'arr-4', value: 92, label: '[4]' },
          ],
          highlightedIndices: [0],
          lastOperation: 'Initialized contiguous 5-element array',
          operationLog: ['Allocated contiguous memory block at Base 0x1000'],
          timeComplexity: 'O(1) Random Access',
        };

      case 'stack':
        return {
          structureType: 'stack',
          elements: [
            { id: 'stk-0', value: 'call_init()', label: 'Bottom [0]' },
            { id: 'stk-1', value: 'calc_metrics()', label: 'Frame [1]' },
            { id: 'stk-2', value: 'render_ui()', label: 'Top [2]' },
          ],
          highlightedIndices: [2],
          lastOperation: 'Initialized call stack with 3 frames',
          operationLog: ['Pushed call_init()', 'Pushed calc_metrics()', 'Pushed render_ui() [TOP]'],
          timeComplexity: 'O(1) LIFO Push/Pop',
        };

      case 'queue':
        return {
          structureType: 'queue',
          elements: [
            { id: 'q-0', value: 'Task A', label: 'Front [0]' },
            { id: 'q-1', value: 'Task B', label: 'Mid [1]' },
            { id: 'q-2', value: 'Task C', label: 'Rear [2]' },
          ],
          highlightedIndices: [0],
          lastOperation: 'Initialized FIFO task queue',
          operationLog: ['Enqueued Task A [FRONT]', 'Enqueued Task B', 'Enqueued Task C [REAR]'],
          timeComplexity: 'O(1) FIFO Enqueue/Dequeue',
        };

      case 'linked_list':
        return {
          structureType: 'linked_list',
          elements: [
            { id: 'll-0', value: 'Node 10', label: 'Head →' },
            { id: 'll-1', value: 'Node 25', label: 'Next →' },
            { id: 'll-2', value: 'Node 60', label: 'Tail → ∅' },
          ],
          highlightedIndices: [0],
          lastOperation: 'Initialized singly-linked list (3 nodes)',
          operationLog: ['Head points to Node 10', 'Node 10 points to Node 25', 'Node 25 points to Node 60 (Tail)'],
          timeComplexity: 'O(1) Prepend / O(n) Traversal',
        };
    }
  }

  // =========================================================================
  // STACK OPERATIONS (LIFO)
  // =========================================================================

  public static stackPush(state: DataStructureState, val: string | number = `item_${state.elements.length + 1}`): DataStructureState {
    const newElements = [
      ...state.elements,
      {
        id: `stk-${Date.now()}-${state.elements.length}`,
        value: val,
        label: `Top [${state.elements.length}]`,
      },
    ];

    // Update labels
    for (let i = 0; i < newElements.length - 1; i++) {
      newElements[i].label = i === 0 ? 'Bottom [0]' : `Frame [${i}]`;
    }

    const logEntry = `Pushed "${val}" to stack top. Stack height: ${newElements.length}`;
    return {
      ...state,
      elements: newElements,
      highlightedIndices: [newElements.length - 1],
      lastOperation: `push("${val}")`,
      operationLog: [logEntry, ...state.operationLog.slice(0, 7)],
      timeComplexity: 'O(1) Time / O(1) Space',
    };
  }

  public static stackPop(state: DataStructureState): DataStructureState {
    if (state.elements.length === 0) {
      return {
        ...state,
        lastOperation: 'pop() [Stack Underflow: Empty]',
        operationLog: ['Cannot pop from empty stack (Stack Underflow)', ...state.operationLog.slice(0, 7)],
        timeComplexity: 'O(1)',
      };
    }

    const popped = state.elements[state.elements.length - 1];
    const newElements = state.elements.slice(0, -1);

    if (newElements.length > 0) {
      newElements[newElements.length - 1].label = `Top [${newElements.length - 1}]`;
    }

    const logEntry = `Popped "${popped.value}" from stack top. Remaining height: ${newElements.length}`;
    return {
      ...state,
      elements: newElements,
      highlightedIndices: newElements.length > 0 ? [newElements.length - 1] : [],
      lastOperation: `pop() ⇒ "${popped.value}"`,
      operationLog: [logEntry, ...state.operationLog.slice(0, 7)],
      timeComplexity: 'O(1) Time',
    };
  }

  // =========================================================================
  // QUEUE OPERATIONS (FIFO)
  // =========================================================================

  public static queueEnqueue(state: DataStructureState, val: string | number = `Task ${String.fromCharCode(65 + state.elements.length)}`): DataStructureState {
    const newElements = [
      ...state.elements,
      {
        id: `q-${Date.now()}-${state.elements.length}`,
        value: val,
        label: `Rear [${state.elements.length}]`,
      },
    ];

    if (newElements.length > 1) {
      newElements[0].label = 'Front [0]';
    }

    const logEntry = `Enqueued "${val}" at rear position. Queue length: ${newElements.length}`;
    return {
      ...state,
      elements: newElements,
      highlightedIndices: [newElements.length - 1],
      lastOperation: `enqueue("${val}")`,
      operationLog: [logEntry, ...state.operationLog.slice(0, 7)],
      timeComplexity: 'O(1) Enqueue',
    };
  }

  public static queueDequeue(state: DataStructureState): DataStructureState {
    if (state.elements.length === 0) {
      return {
        ...state,
        lastOperation: 'dequeue() [Queue Underflow: Empty]',
        operationLog: ['Cannot dequeue from empty queue', ...state.operationLog.slice(0, 7)],
        timeComplexity: 'O(1)',
      };
    }

    const dequeued = state.elements[0];
    const newElements = state.elements.slice(1);

    if (newElements.length > 0) {
      newElements[0].label = 'Front [0]';
      newElements[newElements.length - 1].label = `Rear [${newElements.length - 1}]`;
    }

    const logEntry = `Dequeued "${dequeued.value}" from front position. Remaining: ${newElements.length}`;
    return {
      ...state,
      elements: newElements,
      highlightedIndices: newElements.length > 0 ? [0] : [],
      lastOperation: `dequeue() ⇒ "${dequeued.value}"`,
      operationLog: [logEntry, ...state.operationLog.slice(0, 7)],
      timeComplexity: 'O(1) Dequeue',
    };
  }

  // =========================================================================
  // ARRAY ACCESS OPERATIONS
  // =========================================================================

  public static arrayAccess(state: DataStructureState, index: number): DataStructureState {
    const clampedIdx = Math.max(0, Math.min(index, state.elements.length - 1));
    const targetElem = state.elements[clampedIdx];
    const memOffset = `0x1000 + ${clampedIdx} × 4 bytes = 0x${(0x1000 + clampedIdx * 4).toString(16).toUpperCase()}`;

    const logEntry = `Accessed array[${clampedIdx}] = ${targetElem?.value}. Address: ${memOffset}`;
    return {
      ...state,
      highlightedIndices: [clampedIdx],
      lastOperation: `array[${clampedIdx}] ⇒ ${targetElem?.value}`,
      operationLog: [logEntry, ...state.operationLog.slice(0, 7)],
      timeComplexity: 'O(1) Instant Random Access',
    };
  }

  public static arrayInsert(state: DataStructureState, index: number, val: string | number): DataStructureState {
    const clampedIdx = Math.max(0, Math.min(index, state.elements.length));
    const newElements = [
      ...state.elements.slice(0, clampedIdx),
      {
        id: `arr-${Date.now()}-${state.elements.length}`,
        value: val,
        label: `[${clampedIdx}]`,
      },
      ...state.elements.slice(clampedIdx),
    ];
    newElements.forEach((el, i) => {
      el.label = `[${i}]`;
    });

    const logEntry = `Inserted ${val} at index [${clampedIdx}]. Shifted ${state.elements.length - clampedIdx} elements.`;
    return {
      ...state,
      elements: newElements,
      highlightedIndices: [clampedIdx],
      lastOperation: `insert([${clampedIdx}], ${val})`,
      operationLog: [logEntry, ...state.operationLog.slice(0, 7)],
      timeComplexity: 'O(n) Linear Shift',
    };
  }

  public static arrayDelete(state: DataStructureState, index: number): DataStructureState {
    if (state.elements.length === 0) return state;
    const clampedIdx = Math.max(0, Math.min(index, state.elements.length - 1));
    const deletedVal = state.elements[clampedIdx].value;
    const newElements = [
      ...state.elements.slice(0, clampedIdx),
      ...state.elements.slice(clampedIdx + 1),
    ];
    newElements.forEach((el, i) => {
      el.label = `[${i}]`;
    });

    const logEntry = `Deleted ${deletedVal} at index [${clampedIdx}]. Shifted elements left.`;
    return {
      ...state,
      elements: newElements,
      highlightedIndices: newElements.length > 0 ? [Math.min(clampedIdx, newElements.length - 1)] : [],
      lastOperation: `delete([${clampedIdx}]) ⇒ ${deletedVal}`,
      operationLog: [logEntry, ...state.operationLog.slice(0, 7)],
      timeComplexity: 'O(n) Linear Shift',
    };
  }
}
