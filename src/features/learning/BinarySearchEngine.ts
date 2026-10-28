/**
 * VisiOS — Interactive Binary Search Engine
 * Deterministic generation and playback of binary search pointer traces.
 * Handles found targets, missing targets, empty arrays, and playback state controls.
 */

import { BinarySearchStep, BinarySearchState } from './types';

export class BinarySearchEngine {
  public static readonly DEFAULT_ARRAY = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];

  /**
   * Generates discrete trace steps from a sorted array and target.
   */
  public static generateTrace(rawArray: number[], target: number): BinarySearchStep[] {
    const array = [...rawArray];

    // Case 1: Empty Array
    if (!array || array.length === 0) {
      return [
        {
          stepIndex: 0,
          low: 0,
          high: -1,
          mid: 0,
          target,
          comparison: 'empty_array',
          explanation: 'Array is empty (0 elements). Binary search cannot execute on empty input.',
          rangeSize: 0,
          isTerminal: true,
        },
      ];
    }

    const steps: BinarySearchStep[] = [];
    let low = 0;
    let high = array.length - 1;
    let stepIndex = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midVal = array[mid];
      const rangeSize = high - low + 1;

      if (midVal === target) {
        steps.push({
          stepIndex,
          low,
          high,
          mid,
          midVal,
          target,
          comparison: 'equal',
          explanation: `🎯 Target ${target} found at index [${mid}]! Matched in ${stepIndex + 1} comparison step(s).`,
          rangeSize,
          isTerminal: true,
          foundIndex: mid,
        });
        return steps;
      }

      if (midVal < target) {
        steps.push({
          stepIndex,
          low,
          high,
          mid,
          midVal,
          target,
          comparison: 'less',
          explanation: `arr[${mid}] (${midVal}) < target (${target}). Discard left subarray [${low}..${mid}]. Move low = mid + 1 (${mid + 1}).`,
          rangeSize,
          isTerminal: false,
        });
        low = mid + 1;
      } else {
        steps.push({
          stepIndex,
          low,
          high,
          mid,
          midVal,
          target,
          comparison: 'greater',
          explanation: `arr[${mid}] (${midVal}) > target (${target}). Discard right subarray [${mid}..${high}]. Move high = mid - 1 (${mid - 1}).`,
          rangeSize,
          isTerminal: false,
        });
        high = mid - 1;
      }

      stepIndex++;
    }

    // Case 2: Target Not Found (Search interval exhausted)
    steps.push({
      stepIndex,
      low,
      high,
      mid: Math.max(0, Math.min(array.length - 1, Math.floor((low + high) / 2))),
      target,
      comparison: 'not_found',
      explanation: `❌ Search space exhausted (low [${low}] > high [${high}]). Target ${target} is not in the array.`,
      rangeSize: 0,
      isTerminal: true,
    });

    return steps;
  }

  /**
   * Initializes state for a binary search trace.
   */
  public static createInitialState(array: number[] = this.DEFAULT_ARRAY, target: number = 23): BinarySearchState {
    const steps = this.generateTrace(array, target);
    const terminalStep = steps[steps.length - 1];
    return {
      array,
      target,
      currentStepIndex: 0,
      steps,
      isPlaying: false,
      isComplete: steps.length <= 1,
      foundIndex: terminalStep?.comparison === 'equal' ? terminalStep.foundIndex : undefined,
    };
  }

  /**
   * Steps forward to the next comparison in the trace.
   */
  public static stepForward(state: BinarySearchState): BinarySearchState {
    const nextIdx = Math.min(state.currentStepIndex + 1, state.steps.length - 1);
    return {
      ...state,
      currentStepIndex: nextIdx,
      isComplete: nextIdx === state.steps.length - 1,
      isPlaying: nextIdx === state.steps.length - 1 ? false : state.isPlaying,
    };
  }

  /**
   * Steps backward to the previous comparison in the trace.
   */
  public static stepBackward(state: BinarySearchState): BinarySearchState {
    const prevIdx = Math.max(0, state.currentStepIndex - 1);
    return {
      ...state,
      currentStepIndex: prevIdx,
      isComplete: prevIdx === state.steps.length - 1,
    };
  }

  /**
   * Resets playback back to the initial step.
   */
  public static reset(state: BinarySearchState): BinarySearchState {
    return {
      ...state,
      currentStepIndex: 0,
      isPlaying: false,
      isComplete: false,
    };
  }

  /**
   * Toggles automatic playback state.
   */
  public static togglePlay(state: BinarySearchState): BinarySearchState {
    if (state.isComplete) {
      return {
        ...state,
        currentStepIndex: 0,
        isPlaying: true,
        isComplete: false,
      };
    }
    return {
      ...state,
      isPlaying: !state.isPlaying,
    };
  }
}

