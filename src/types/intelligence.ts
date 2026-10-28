export type ExplanationTargetType = 
  | 'text' 
  | 'note' 
  | 'shape' 
  | 'model3d' 
  | 'simulation' 
  | 'formula'
  | 'workspace';

export interface BoardObjectContext {
  id?: string;
  type: ExplanationTargetType;
  title: string;
  metadata?: Record<string, any>;
  recognizedFormula?: any;
  simulationMetrics?: {
    gravity?: number;
    length?: number;
    period?: number;
    damping?: number;
    currentAngle?: number;
    totalEnergy?: number;
    isPulsing?: boolean;
    zoom?: number;
  };
}

export interface KnowledgeCheckQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint?: string;
}

export interface GuidedExplorationResponse {
  summary: string;
  keyConcepts: string[];
  stepByStep: string[];
  simulationInsights?: string;
  suggestedQuestions: string[];
  recommendedAction?: {
    label: string;
    actionType: 'highlight' | 'experiment' | 'zoomTo';
    targetId?: string;
    paramUpdates?: Record<string, any>;
  };
  knowledgeCheck?: KnowledgeCheckQuestion;
}

