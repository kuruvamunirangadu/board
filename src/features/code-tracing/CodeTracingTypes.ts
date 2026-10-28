/**
 * VisiOS — Code-to-Visual Learning Engine
 * Domain Type Definitions for Deterministic Execution Traces
 */

export type TraceEventType =
  | 'program_start'
  | 'variable_decl'
  | 'assignment'
  | 'condition_eval'
  | 'loop_iteration'
  | 'comparison'
  | 'swap'
  | 'call'
  | 'return'
  | 'mutation'
  | 'precondition_check'
  | 'terminal'
  | 'error';

export type ElementStatus =
  | 'default'
  | 'active'
  | 'comparing'
  | 'matched'
  | 'swapped'
  | 'eliminated'
  | 'sorted'
  | 'pushed'
  | 'popped'
  | 'front'
  | 'rear';

export interface VisualArrayElement {
  id: string;
  index: number;
  value: number | string;
  status: ElementStatus;
  pointers?: string[]; // e.g. ['low', 'mid'], ['i', 'j']
  highlightColor?: string;
}

export interface CallStackFrame {
  frameId: string;
  functionName: string;
  arguments: Record<string, any>;
  localVariables: Record<string, any>;
  lineNumber: number;
  returnValue?: any;
  isUnwinding?: boolean;
}

export interface StackElement {
  id: string;
  value: number | string;
  label?: string;
  isTop?: boolean;
}

export interface QueueElement {
  id: string;
  value: number | string;
  label?: string;
  isFront?: boolean;
  isRear?: boolean;
}

export type TraceStructureType = 'array' | 'stack' | 'queue' | 'call_stack';

export interface TraceDataStructureState {
  type: TraceStructureType;
  array?: VisualArrayElement[];
  stack?: StackElement[];
  queue?: QueueElement[];
  callStack?: CallStackFrame[];
  auxiliaryNotes?: string;
}

export interface PredictionQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  targetStepIndex: number;
}

export interface ComplexityInfo {
  bestTime: string;
  averageTime: string;
  worstTime: string;
  auxiliarySpace: string;
  timeExplanation: string;
  spaceExplanation: string;
  loopAnalysis: string;
}

export interface TraceStep {
  stepIndex: number;
  eventType: TraceEventType;
  lineNumber: number; // 1-indexed
  codeLine: string;
  variables: Record<string, any>;
  previousVariables: Record<string, any>;
  changedVariables: string[];
  activeScope: string;
  dataStructureState: TraceDataStructureState;
  conditionResult?: boolean;
  explanation: string;
  isTerminal: boolean;
  prediction?: PredictionQuestion;
  errorMessage?: string;
}

export interface CodeExample {
  id: string;
  name: string;
  language: 'python' | 'pseudocode' | 'javascript';
  code: string;
  lines: string[];
  description: string;
  defaultInput: any;
}

export interface ExecutionTrace {
  algorithmId: string;
  algorithmName: string;
  language: string;
  codeLines: string[];
  initialInput: any;
  steps: TraceStep[];
  complexity: ComplexityInfo;
  totalSteps: number;
  success: boolean;
  errorMessage?: string;
}

export interface CodeTracingSessionState {
  algorithmId: string;
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeedMs: number;
  inputConfig: any;
  pendingPrediction: PredictionQuestion | null;
  predictionAnswered: boolean;
  userPredictionChoice: number | null;
  predictionFeedback: {
    isCorrect: boolean;
    explanation: string;
  } | null;
}

