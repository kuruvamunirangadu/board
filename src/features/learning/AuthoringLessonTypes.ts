/**
 * VisiOS — Visual Authoring Studio: Type Definitions
 * Step 9: Strongly-typed schemas for authored learning modules, draft/publish lifecycle,
 * renderer configurations, and lesson versioning.
 */

import { CanonicalRendererType } from './VisualizationRegistry';
import {
  TopicDomain,
  WorkedExample,
  PracticeQuestion,
  SourceAttribution,
  GuidedLessonStep,
} from './types';

export type LessonStatus = 'draft' | 'published';
export type LessonDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface AuthoredLessonStep {
  id: string;
  stepNumber: number;
  title: string;
  stepType: GuidedLessonStep | string;
  content: string;
  keyTakeaway?: string;
}

export interface AuthoredVisualizationConfig {
  rendererType: CanonicalRendererType;
  title: string;
  description: string;
  learningObjective: string;
  activeVariables: string[];
  parameters: Record<string, any>;
  interactionsAvailable: string[];
  expectedBehavior: string;
}

export interface LessonValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface LessonValidationReport {
  isValid: boolean;
  canPublish: boolean;
  errors: LessonValidationIssue[];
  warnings: LessonValidationIssue[];
}

export interface AuthoredLesson {
  id: string;
  slug: string;
  title: string;
  primaryTopic: string;
  topicAliases: string[];
  subjectId: string;
  domain: TopicDomain;
  difficulty: LessonDifficulty;
  learningObjectives: string[];
  prerequisites: string[];
  overview: string;
  motivation: string;
  assumptions: string[];
  steps: AuthoredLessonStep[];
  visualizationConfig?: AuthoredVisualizationConfig;
  workedExamples: WorkedExample[];
  practiceQuestions: PracticeQuestion[];
  sourceAttribution?: SourceAttribution;
  status: LessonStatus;
  version: number;
  publishedVersion?: number;
  publishedSnapshot?: Omit<AuthoredLesson, 'publishedSnapshot'>;
  authorNotes?: string;
  ownerId?: string;
  isExpertReviewed: boolean;
  reviewedBy?: string;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
}

/**
 * Renderer configuration descriptor for authoring controls.
 */
export interface RendererParamField {
  name: string;
  label: string;
  type: 'number' | 'string' | 'numberArray' | 'select';
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description: string;
}

export interface RendererAuthoringConfigSchema {
  rendererType: CanonicalRendererType;
  displayName: string;
  supportedDomains: TopicDomain[];
  fields: RendererParamField[];
}

/**
 * Declarative parameter schemas for implemented visual renderers.
 * No arbitrary JavaScript execution allowed.
 */
export const RENDERER_AUTHORING_SCHEMAS: Record<CanonicalRendererType, RendererAuthoringConfigSchema> = {
  algorithm_array_tracer: {
    rendererType: 'algorithm_array_tracer',
    displayName: 'Algorithm Array & Pointer Trace',
    supportedDomains: ['computer_science'],
    fields: [
      {
        name: 'elements',
        label: 'Array Elements (Sorted Numbers)',
        type: 'numberArray',
        defaultValue: [10, 23, 35, 42, 58, 67, 79, 91],
        description: 'Monotonically ascending array of numbers for algorithm stepping',
      },
      {
        name: 'target',
        label: 'Search Target Value',
        type: 'number',
        defaultValue: 58,
        min: -1000,
        max: 1000,
        step: 1,
        description: 'Element value to locate within the array',
      },
    ],
  },
  physics_vector_simulator: {
    rendererType: 'physics_vector_simulator',
    displayName: 'Newtonian Force & Vector Simulator',
    supportedDomains: ['physics'],
    fields: [
      {
        name: 'force',
        label: 'Applied Force F (N)',
        type: 'number',
        defaultValue: 20,
        min: 1,
        max: 100,
        step: 1,
        description: 'Horizontal net force vector magnitude',
      },
      {
        name: 'mass',
        label: 'Inertial Mass m (kg)',
        type: 'number',
        defaultValue: 5,
        min: 0.5,
        max: 50,
        step: 0.5,
        description: 'Mass of the moving dynamic block',
      },
    ],
  },
  function_coordinate_plotter: {
    rendererType: 'function_coordinate_plotter',
    displayName: 'Cartesian Coordinate & Curve Plotter',
    supportedDomains: ['mathematics', 'physics'],
    fields: [
      {
        name: 'amplitude',
        label: 'Curve Amplitude A',
        type: 'number',
        defaultValue: 1.0,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        description: 'Vertical scaling amplitude of the plotted function',
      },
      {
        name: 'frequency',
        label: 'Wave Frequency f (Hz)',
        type: 'number',
        defaultValue: 1.0,
        min: 0.2,
        max: 4.0,
        step: 0.1,
        description: 'Horizontal frequency / periodicity rate',
      },
    ],
  },
  pendulum_simulation: {
    rendererType: 'pendulum_simulation',
    displayName: 'Harmonic Pendulum Oscillator',
    supportedDomains: ['physics'],
    fields: [
      {
        name: 'length',
        label: 'String Length L (m)',
        type: 'number',
        defaultValue: 1.0,
        min: 0.2,
        max: 3.0,
        step: 0.1,
        description: 'Length of pendulum suspension cord',
      },
      {
        name: 'gravity',
        label: 'Gravity g (m/s²)',
        type: 'number',
        defaultValue: 9.81,
        min: 1.0,
        max: 25.0,
        step: 0.1,
        description: 'Gravitational acceleration field',
      },
      {
        name: 'theta',
        label: 'Initial Release Angle (°)',
        type: 'number',
        defaultValue: 15,
        min: 1,
        max: 45,
        step: 1,
        description: 'Starting displacement angle from nadir',
      },
    ],
  },
  geometric_triangle_construction: {
    rendererType: 'geometric_triangle_construction',
    displayName: 'Euclidean Triangle Construction',
    supportedDomains: ['mathematics'],
    fields: [
      {
        name: 'legA',
        label: 'Leg Length a',
        type: 'number',
        defaultValue: 3,
        min: 1,
        max: 15,
        step: 1,
        description: 'Horizontal right triangle leg length',
      },
      {
        name: 'legB',
        label: 'Leg Length b',
        type: 'number',
        defaultValue: 4,
        min: 1,
        max: 15,
        step: 1,
        description: 'Vertical right triangle leg length',
      },
    ],
  },
  formula_geometric_dissection: {
    rendererType: 'formula_geometric_dissection',
    displayName: 'Geometric Area Dissection',
    supportedDomains: ['mathematics'],
    fields: [
      {
        name: 'a',
        label: 'Outer Square Dimension a',
        type: 'number',
        defaultValue: 4,
        min: 2,
        max: 10,
        step: 0.5,
        description: 'Base length for algebraic expansion geometry',
      },
      {
        name: 'b',
        label: 'Offset Dimension b',
        type: 'number',
        defaultValue: 1,
        min: 0.5,
        max: 5,
        step: 0.5,
        description: 'Subtracted or added offset segment length',
      },
    ],
  },
  model3d_viewer: {
    rendererType: 'model3d_viewer',
    displayName: '3D Spatial / Anatomy Model Viewer',
    supportedDomains: ['biology', 'physics'],
    fields: [
      {
        name: 'zoom',
        label: 'Initial Camera Zoom',
        type: 'number',
        defaultValue: 1.2,
        min: 0.5,
        max: 3.0,
        step: 0.1,
        description: 'Starting 3D camera magnification factor',
      },
    ],
  },
  svg_schematic_fallback: {
    rendererType: 'svg_schematic_fallback',
    displayName: 'Structured Schematic Diagram',
    supportedDomains: ['computer_science', 'mathematics', 'physics', 'chemistry', 'biology', 'general_knowledge'],
    fields: [
      {
        name: 'diagramTitle',
        label: 'Diagram Caption / Header',
        type: 'string',
        defaultValue: 'Conceptual Domain Diagram',
        description: 'Heading displayed above schematic illustration',
      },
    ],
  },
  none: {
    rendererType: 'none',
    displayName: 'Pure Conceptual Model (No Visualization)',
    supportedDomains: ['computer_science', 'mathematics', 'physics', 'chemistry', 'biology', 'general_knowledge'],
    fields: [],
  },
};

