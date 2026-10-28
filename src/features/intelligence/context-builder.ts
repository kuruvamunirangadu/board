import { Editor, TLShape } from 'tldraw';
import { BoardObjectContext, ExplanationTargetType } from '@/types/intelligence';
import { Workspace } from '@/types';
import { calculateTheoreticalPeriod } from '@/features/simulation/pendulum-physics';
import { BoardFeedParser, RecognizedFormula, KNOWN_FORMULA_REGISTRY } from './board-feed-parser';
import { getShapeText } from '@/lib/tldraw-utils';

export function buildObjectContext(
  editor: Editor | null,
  workspace: Workspace
): BoardObjectContext {
  if (!editor) {
    return {
      type: 'workspace',
      title: workspace.title,
      metadata: { subject: workspace.subject || 'Science & Mathematics' },
    };
  }

  const selectedShapes = editor.getSelectedShapes();
  const allShapes = editor.getCurrentPageShapes();

  // PRIORITY 1: Explicitly Selected Shape takes absolute precedence!
  if (selectedShapes.length > 0) {
    const shape = selectedShapes[0];
    const props = shape.props as any;

    // 1A. Interactive 3D Model Shape (e.g. Human Heart 3D)
    if (shape.type === 'model3d') {
      return {
        id: shape.id,
        type: 'model3d',
        title: 'Human Heart 3D Model',
        metadata: {
          modelType: props.modelType || 'heart',
          rotationX: props.rotationX,
          rotationY: props.rotationY,
          zoom: props.zoom,
          isPulsing: props.isPulsing,
          anatomicalStructures: [
            'Aortic Arch (Oxygenated systemic blood flow)',
            'Left Ventricle (High-pressure muscular pump)',
            'Right Ventricle (Pulmonary circuit pump)',
            'Pulmonary Trunk (Deoxygenated blood to lungs)',
            'Superior Vena Cava (Venous return from upper body)',
          ],
        },
        simulationMetrics: {
          isPulsing: props.isPulsing,
          zoom: props.zoom,
        },
      };
    }

    // 1B. Physics Simulation Shape (e.g. Nonlinear Pendulum)
    if (shape.type === 'simulation') {
      const gravity = props.gravity ?? 9.81;
      const length = props.length ?? 2.0;
      const initialAngle = props.initialAngle ?? 45;
      const damping = props.damping ?? 0.04;
      const period = calculateTheoreticalPeriod(length, gravity, initialAngle);

      return {
        id: shape.id,
        type: 'simulation',
        title: 'Nonlinear Pendulum Simulation',
        metadata: {
          simulationType: props.simulationType || 'pendulum',
          gravity,
          length,
          damping,
          initialAngle,
          speed: props.speed ?? 1.0,
        },
        simulationMetrics: {
          gravity,
          length,
          period,
          damping,
          currentAngle: initialAngle,
        },
      };
    }

    // 1C. Text or Note Shape
    if (shape.type === 'text' || shape.type === 'note') {
      const textContent = getShapeText(shape);
      const formulaMatch =
        BoardFeedParser.parseText(textContent) ||
        (textContent.trim().length > 0 ? BoardFeedParser.solveUniversalTopic(textContent) : null);
      if (formulaMatch) {
        return {
          id: shape.id,
          type: 'formula',
          title: formulaMatch.title,
          recognizedFormula: formulaMatch,
          metadata: {
            formula: formulaMatch.normalizedFormula,
            solvedResult: formulaMatch.solvedResult,
            topic: formulaMatch.topic,
            algebraicSteps: formulaMatch.algebraicSteps,
            geometricProofSummary: formulaMatch.geometricProofSummary,
            hasInteractiveAnimation: formulaMatch.hasInteractiveAnimation,
          },
        };
      }
      return {
        id: shape.id,
        type: shape.type as ExplanationTargetType,
        title: textContent.slice(0, 40) || 'Concept Note',
        metadata: {
          text: textContent,
          color: props.color,
        },
      };
    }

    // 1D. Hand-drawn ink strokes (e.g. handwritten formula or diagram)
    if (shape.type === 'draw') {
      const formulaMatch =
        BoardFeedParser.parseBoardFeed(selectedShapes) ||
        BoardFeedParser.parseBoardFeed(allShapes);

      if (formulaMatch) {
        return {
          id: shape.id,
          type: 'formula',
          title: formulaMatch.title,
          recognizedFormula: formulaMatch,
          metadata: {
            formula: formulaMatch.normalizedFormula,
            solvedResult: formulaMatch.solvedResult,
            topic: formulaMatch.topic,
            algebraicSteps: formulaMatch.algebraicSteps,
            geometricProofSummary: formulaMatch.geometricProofSummary,
            hasInteractiveAnimation: formulaMatch.hasInteractiveAnimation,
            strokeCount: selectedShapes.length,
            isHandwrittenInk: true,
          },
        };
      }

      return {
        id: shape.id,
        type: 'shape',
        title: 'Drawing Strokes',
        metadata: {
          strokeCount: selectedShapes.length,
          isHandwrittenInk: true,
        },
      };
    }

    // 1E. Geometric Shape
    if (shape.type === 'geo' || shape.type === 'arrow' || shape.type === 'line') {
      return {
        id: shape.id,
        type: 'shape',
        title: `${props.geo || shape.type} diagram node`,
        metadata: {
          geo: props.geo || shape.type,
          color: props.color,
          fill: props.fill,
        },
      };
    }

    return {
      id: shape.id,
      type: 'shape',
      title: shape.type,
      metadata: props,
    };
  }

  // PRIORITY 2: Nothing Selected -> Inspect Board Feed for formulas or models
  const formulaMatch = BoardFeedParser.parseBoardFeed(allShapes);
  if (formulaMatch) {
    return {
      id: 'formula-board-feed',
      type: 'formula',
      title: formulaMatch.title,
      recognizedFormula: formulaMatch,
      metadata: {
        formula: formulaMatch.normalizedFormula,
        solvedResult: formulaMatch.solvedResult,
        topic: formulaMatch.topic,
        algebraicSteps: formulaMatch.algebraicSteps,
        geometricProofSummary: formulaMatch.geometricProofSummary,
        hasInteractiveAnimation: formulaMatch.hasInteractiveAnimation,
        totalShapesOnBoard: allShapes.length,
      },
    };
  }

  // Check if there is an active 3D model on the board
  const heartShape = allShapes.find((s) => s.type === 'model3d');
  if (heartShape) {
    const props = heartShape.props as any;
    return {
      id: heartShape.id,
      type: 'model3d',
      title: 'Human Heart 3D Model',
      metadata: {
        modelType: props.modelType || 'heart',
        rotationX: props.rotationX,
        rotationY: props.rotationY,
        zoom: props.zoom,
        isPulsing: props.isPulsing,
        anatomicalStructures: [
          'Aortic Arch (Oxygenated systemic blood flow)',
          'Left Ventricle (High-pressure muscular pump)',
          'Right Ventricle (Pulmonary circuit pump)',
          'Pulmonary Trunk (Deoxygenated blood to lungs)',
          'Superior Vena Cava (Venous return from upper body)',
        ],
      },
      simulationMetrics: {
        isPulsing: props.isPulsing,
        zoom: props.zoom,
      },
    };
  }

  // Check if there is a simulation on the board
  const simShape = allShapes.find((s) => s.type === 'simulation');
  if (simShape) {
    const props = simShape.props as any;
    const gravity = props.gravity ?? 9.81;
    const length = props.length ?? 2.0;
    const initialAngle = props.initialAngle ?? 45;
    const damping = props.damping ?? 0.04;
    const period = calculateTheoreticalPeriod(length, gravity, initialAngle);

    return {
      id: simShape.id,
      type: 'simulation',
      title: 'Nonlinear Pendulum Simulation',
      metadata: {
        simulationType: props.simulationType || 'pendulum',
        gravity,
        length,
        damping,
        initialAngle,
        speed: props.speed ?? 1.0,
      },
      simulationMetrics: {
        gravity,
        length,
        period,
        damping,
        currentAngle: initialAngle,
      },
    };
  }

  // Fallback: General workspace overview
  return {
    type: 'workspace',
    title: workspace.title,
    metadata: {
      subject: workspace.subject || 'Science & Mathematics',
      totalShapes: allShapes.length,
    },
  };
}
