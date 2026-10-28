/**
 * VisiOS — Intelligent Topic Classifier & Engine Routing Layer
 * Deterministically analyzes student topic input to select the optimal processing engine:
 * - 'simulation': Interactive physics simulations (e.g. "simulate a pendulum", coordinate plotters)
 * - 'algorithm': Computer Science algorithms and data structures (e.g. "binary search", "data structures")
 * - 'math': Mathematical equations, derivations, and physics laws (e.g. "quadratic formula", "(a+b)^2", "F = ma")
 * - 'knowledge': Encyclopedic facts and verified real-world entities (e.g. "Alan Turing", "photosynthesis")
 * - 'clarification': Ambiguous symbols or unknown formulas requiring user disambiguation
 * - 'local_ai': Freeform conceptual topics enhanced via local Ollama inference
 */

import {
  TopicClassificationResult,
  TopicDomain,
  TopicIntent,
  TargetEngine,
} from './types';
import { BinomialExpansionEngine } from './BinomialExpansionEngine';
import { DomainKnowledgeEngine } from './DomainKnowledgeEngine';

export class TopicClassifier {
  /**
   * Evaluates user input and returns a typed classification with domain, intent, engine, and confidence.
   */
  public static classify(rawQuery: string): TopicClassificationResult {
    const rawClean = (rawQuery || '').trim();
    const clean = rawClean.replace(/\.{2,}$/, '').replace(/…$/, '').trim();
    if (!clean) {
      return {
        originalQuery: rawQuery,
        domain: 'other',
        intent: 'ambiguous_query',
        engine: 'clarification',
        confidence: 0.0,
        requiresClarification: true,
        reason: 'Empty query submitted.',
        suggestedClarifications: ['Please enter a formula, concept, or real-world topic.'],
      };
    }

    const lower = clean.toLowerCase();

    // 1. Interactive Simulation Intent (e.g. "simulate a pendulum", "projectile motion", "harmonic motion", "f = ma simulation")
    if (
      lower.includes('pendulum') ||
      lower.includes('projectile') ||
      lower.includes('harmonic motion') ||
      (lower.includes('simulate') && (lower.includes('swing') || lower.includes('motion') || lower.includes('vector') || lower.includes('oscillation') || lower.includes('physics') || lower.includes('gravity') || lower.includes('force')))
    ) {
      return {
        originalQuery: clean,
        domain: 'physics',
        intent: 'interactive_simulation',
        engine: 'simulation',
        confidence: 0.98,
        requiresClarification: false,
        reason: 'The query requests an interactive dynamic physics simulation.',
      };
    }


    // 2. Ambiguity & Unresolved Formulas (e.g. single letters 'E', 'F', or unrecognized equations 'xyz = ?', '? + ? = 100')
    if (clean.length <= 2 && /^[a-zA-Z]$/.test(clean)) {
      const sym = clean.toUpperCase();
      return {
        originalQuery: clean,
        domain: 'other',
        intent: 'ambiguous_query',
        engine: 'clarification',
        confidence: 0.35,
        requiresClarification: true,
        reason: `Single symbol "${sym}" represents multiple distinct equations across physics and mathematics.`,
        suggestedClarifications:
          sym === 'E'
            ? ['E = mc² (Mass-Energy Equivalence)', 'E = h·ν (Planck Equation)', 'KE = ½mv² (Kinetic Energy)']
            : [`F = ma (Newton's 2nd Law)`, `F = -kx (Hooke's Law)`],
      };
    }

    const hasMathOperators = /[=^]/.test(clean) || (/[+\-*/]/.test(clean) && clean.length < 25 && !/\b(and|or|of|in|the)\b/i.test(clean));
    const isRecognizedFormula =
      lower.includes('f = ma') ||
      lower.includes('f=ma') ||
      lower.includes('v = u + at') ||
      lower.includes('v=u+at') ||
      lower.includes('a^2 + b^2 = c^2') ||
      lower.includes('a^2+b^2=c^2') ||
      lower.includes('y = mx + c') ||
      lower.includes('y=mx+c') ||
      lower.includes('y = mx + b') ||
      lower.includes('y=mx+b') ||
      lower.includes('y = mx') ||
      lower.includes('y=mx') ||
      lower.includes('mx + c') ||
      lower.includes('mx + b') ||
      /y\s*=\s*[-+]?\d*\.?\d*x/i.test(clean) ||
      lower.includes('e = mc^2') ||
      lower.includes('e = mc2') ||
      lower.includes('e=mc^2') ||
      lower.includes('ke = 1/2') ||
      lower.includes('pe = mgh') ||
      lower.includes('v = ir') ||
      lower.includes('v=ir') ||
      lower.includes('p = vi') ||
      lower.includes('sin(') ||
      lower.includes('cos') ||
      lower.includes('e^') ||
      lower.includes('exp(') ||
      lower.includes('graph') ||
      lower.includes('curve') ||
      /\by\s*=\s*/.test(lower) ||
      /f\s*\(\s*x\s*\)\s*=/i.test(lower) ||
      lower.includes('law of cosine') ||
      lower.includes('cosine rule') ||
      lower.includes('density') ||
      lower.includes('pv = nrt') ||
      lower.includes('2h2 + o2') ||
      !!BinomialExpansionEngine.matchBinomialPower(clean) ||
      !!DomainKnowledgeEngine.match(clean);

    if (hasMathOperators && !isRecognizedFormula && (lower.includes('?') || (!/\by\s*=\s*/.test(lower) && !lower.includes('graph') && lower.length < 15))) {
      return {
        originalQuery: clean,
        domain: 'other',
        intent: 'ambiguous_query',
        engine: 'clarification',
        confidence: 0.3,
        requiresClarification: true,
        reason: `The formula expression "${clean}" is not recognized as an established curriculum theorem or equation.`,
        suggestedClarifications: [
          'Specify physical domain (e.g. mechanics, electromagnetism)',
          'Define variable symbols and boundary conditions',
        ],
      };
    }

    // 3. Computer Science: Algorithms (e.g. "binary search", "quicksort", "merge sort", "sorting")
    if (
      lower.includes('binary search') ||
      lower.includes('binarysearch') ||
      lower.includes('quicksort') ||
      lower.includes('mergesort') ||
      lower.includes('bubble sort') ||
      lower.includes('sorting algorithm') ||
      lower.includes('bsearch') ||
      lower.includes('linear search') ||
      lower.includes('recursion') ||
      lower.includes('factorial') ||
      lower.includes('bfs') ||
      lower.includes('dfs')
    ) {
      return {
        originalQuery: clean,
        domain: 'computer_science',
        intent: 'algorithm_learning',
        engine: 'algorithm',
        confidence: 0.96,
        requiresClarification: false,
        reason: 'The query specifies a standard computer science algorithm with algorithmic complexity analysis.',
      };
    }

    // 4. Computer Science: Data Structures (e.g. "data structures", "linked list", "stack", "queue", "hash table", "trees & graphs")
    if (
      lower.includes('data structure') ||
      lower.includes('data structures') ||
      lower.includes('data strcture') ||
      lower.includes('dsa') ||
      lower.includes('linked list') ||
      lower.includes('stack') ||
      lower.includes('queue') ||
      lower.includes('hash table') ||
      lower.includes('hashmap') ||
      lower.includes('binary tree') ||
      lower.includes('bst') ||
      lower.includes('graph theory') ||
      lower.includes('trees & graphs') ||
      lower.includes('trees and graphs') ||
      lower.includes('tree data structure') ||
      lower.includes('graph data structure') ||
      lower.includes('directed acyclic graph') ||
      lower.includes('dag') ||
      lower === 'tree' ||
      lower === 'trees' ||
      lower === 'graph' ||
      lower === 'graphs' ||
      lower.includes('graph traversal') ||
      lower.includes('breadth first') ||
      lower.includes('depth first') ||
      lower === 'structures'
    ) {
      return {
        originalQuery: clean,
        domain: 'computer_science',
        intent: 'concept_learning',
        engine: 'algorithm',
        confidence: 0.95,
        requiresClarification: false,
        reason: 'The query identifies a fundamental computer science data structure and memory organization model.',
      };
    }

    // 4B. Computer Science: Programming Foundations & Languages (e.g. "python", "programming", "code", "variables", "functions", "loops")
    if (
      lower.includes('python') ||
      lower.includes('javascript') ||
      lower.includes('typescript') ||
      lower.includes('c++') ||
      lower.includes('java') ||
      lower.includes('programming') ||
      lower.includes('coding') ||
      lower.includes('control flow') ||
      lower.includes('conditional') ||
      (lower.includes('loop') && (lower.includes('for') || lower.includes('while') || lower.includes('iteration'))) ||
      lower.includes('functions') ||
      (lower.includes('function') && (lower.includes('call') || lower.includes('scope') || lower.includes('parameter') || lower.includes('return'))) ||
      lower.includes('object oriented') ||
      lower.includes('oop') ||
      (lower.includes('variable') && (lower.includes('memory') || lower.includes('type') || lower.includes('pointer') || lower.includes('scope')))
    ) {
      return {
        originalQuery: clean,
        domain: 'computer_science',
        intent: 'concept_learning',
        engine: 'algorithm',
        confidence: 0.96,
        requiresClarification: false,
        reason: 'The query specifies computer programming principles, execution flow, language syntax, or memory concepts.',
      };
    }

    // 5A-1. Linear Functions & Coordinate Geometry (e.g. "y = mx + c", "y = mx + b", "graph of y=mx+c", "linear equation", "slope intercept")
    if (
      !lower.includes('cos') &&
      !lower.includes('sin') &&
      !lower.includes('tan') &&
      !lower.includes('e^') &&
      !lower.includes('exp(') &&
      (
        lower.includes('y=mx+c') ||
        lower.includes('y = mx + c') ||
        lower.includes('y=mx+b') ||
        lower.includes('y = mx + b') ||
        lower.includes('slope intercept') ||
        lower.includes('linear equation') ||
        lower.includes('linear function') ||
        /y\s*=\s*[-+]?\d+\.?\d*x/i.test(clean) ||
        (lower.includes('graph of') && (lower.includes('mx') || /y\s*=\s*[-+]?\d+\.?\d*x/i.test(clean) || lower.includes('line'))) ||
        ((lower.includes('line') || lower.includes('slope')) && (lower.includes('intercept') || lower.includes('gradient')))
      )
    ) {
      return {
        originalQuery: clean,
        domain: 'mathematics',
        intent: 'formula_explanation',
        engine: 'math',
        confidence: 0.98,
        requiresClarification: false,
        reason: 'The query specifies the slope-intercept linear function y = mx + c representing a straight line on a Cartesian plane.',
      };
    }

    // 5A-2. Fractions & Rational Numbers (e.g. "fraction", "fractions", "rational number")
    if (
      lower.includes('fraction') ||
      lower.includes('equivalent fraction') ||
      lower.includes('rational number') ||
      lower.includes('numerator') ||
      lower.includes('denominator')
    ) {
      return {
        originalQuery: clean,
        domain: 'mathematics',
        intent: 'formula_explanation',
        engine: 'math',
        confidence: 0.96,
        requiresClarification: false,
        reason: 'The query specifies rational fractions representing part-to-whole relationships and ratio arithmetic.',
      };
    }

    // 5. Mathematics & Formulas (e.g. "quadratic formula", "(a+b)^2", "pythagorean theorem")
    if (
      lower.includes('quadratic') ||
      lower.includes('ax^2+bx+c') ||
      lower.includes('discriminant') ||
      lower.includes('completing the square')
    ) {
      return {
        originalQuery: clean,
        domain: 'mathematics',
        intent: 'formula_explanation',
        engine: 'math',
        confidence: 0.98,
        requiresClarification: false,
        reason: 'The query identifies the quadratic polynomial formula and root solving methodology.',
      };
    }

    if (
      !!BinomialExpansionEngine.matchBinomialPower(clean) ||
      lower.includes('binomial') ||
      lower.includes('square of sum') ||
      lower.includes('cube of sum') ||
      lower.includes('pascal triangle')
    ) {
      return {
        originalQuery: clean,
        domain: 'mathematics',
        intent: 'derivation',
        engine: 'math',
        confidence: 0.99,
        requiresClarification: false,
        reason: 'The query specifies a polynomial expansion identity requiring algebraic and geometric proofs.',
      };
    }

    if (
      lower.includes('pythagor') ||
      lower.includes('a^2 + b^2 = c^2') ||
      lower.includes('a^2+b^2=c^2') ||
      lower.includes('hypotenuse')
    ) {
      return {
        originalQuery: clean,
        domain: 'mathematics',
        intent: 'derivation',
        engine: 'math',
        confidence: 0.98,
        requiresClarification: false,
        reason: 'The query specifies Euclidean geometry and right-triangle hypotenuse relationships.',
      };
    }

    // 5B. Trigonometry, Law of Cosines, Calculus (e.g. "law of cosines", "cosine rule", "sine", "cosine", "vector", "derivative")
    if (
      lower.includes('law of cosine') ||
      lower.includes('law of sines') ||
      lower.includes('cosine rule') ||
      lower.includes('sine rule') ||
      lower.includes('trigonometr') ||
      lower.includes('c^2 = a^2 + b^2 - 2ab') ||
      lower.includes('c^2=a^2+b^2-2ab') ||
      lower.includes('c2 = a2 + b2 - 2ab') ||
      lower.includes('c2=a2+b2-2ab') ||
      lower.includes('cosine') ||
      lower.includes('sine') ||
      lower.includes('tangent') ||
      lower.includes('sin(') ||
      lower.includes('cos(') ||
      lower.includes('tan(') ||
      lower.includes('cosx') ||
      lower.includes('cos x') ||
      lower.includes('sinx') ||
      lower.includes('sin x') ||
      lower.includes('tanx') ||
      lower.includes('tan x') ||
      lower.includes('calculus') ||
      lower.includes('derivative') ||
      lower.includes('integral') ||
      lower.includes('e^') ||
      lower.includes('exp(') ||
      lower.includes('exponential') ||
      lower.includes('curve') ||
      /\by\s*=\s*/.test(lower) ||
      lower.includes('vector dot product') ||
      lower.includes('cross product')
    ) {
      const isLawOfCosines =
        lower.includes('law of cosine') ||
        lower.includes('cosine rule') ||
        lower.includes('c^2 = a^2 + b^2 - 2ab') ||
        lower.includes('c^2=a^2+b^2-2ab') ||
        lower.includes('c2 = a2 + b2 - 2ab');

      return {
        originalQuery: clean,
        domain: 'mathematics',
        intent: isLawOfCosines ? 'derivation' : 'formula_explanation',
        engine: 'math',
        confidence: 0.98,
        requiresClarification: false,
        reason: isLawOfCosines
          ? 'The query specifies the Law of Cosines relating arbitrary triangle side lengths and interior angle cosines.'
          : 'The query specifies trigonometric or calculus functions requiring continuous coordinate curve plotting.',
      };
    }

    // 6. Physics Equations (e.g. "F = ma", "v = u + at", "density")
    if (
      lower.includes('f = ma') ||
      lower.includes('f=ma') ||
      lower.includes('newton') ||
      (lower.includes('force') && lower.includes('mass'))
    ) {
      return {
        originalQuery: clean,
        domain: 'physics',
        intent: 'formula_explanation',
        engine: 'math',
        confidence: 0.98,
        requiresClarification: false,
        reason: "The query specifies Newton's second law of motion with vector acceleration kinematics.",
      };
    }

    if (
      lower.includes('v = u + at') ||
      lower.includes('v=u+at') ||
      lower.includes('kinematic') ||
      lower.includes('uniform acceleration')
    ) {
      return {
        originalQuery: clean,
        domain: 'physics',
        intent: 'formula_explanation',
        engine: 'math',
        confidence: 0.97,
        requiresClarification: false,
        reason: 'The query specifies 1D kinematic equations of motion with constant acceleration.',
      };
    }

    if (
      lower.includes('density') ||
      lower.includes('mass / volume') ||
      lower.includes('mass/volume') ||
      lower.includes('ρ = m/v') ||
      lower.includes('kinetic energy') ||
      lower.includes('ohm')
    ) {
      return {
        originalQuery: clean,
        domain: 'physics',
        intent: 'formula_explanation',
        engine: 'math',
        confidence: 0.96,
        requiresClarification: false,
        reason: 'The query specifies foundational physical relationships and dimensional unit laws.',
      };
    }

    // 7. Chemistry
    if (
      lower.includes('chemical bond') ||
      lower.includes('chemical bonding') ||
      lower.includes('bonding') ||
      lower.includes('covalent') ||
      lower.includes('ionic bond') ||
      lower.includes('electronegativity') ||
      lower.includes('periodic table') ||
      lower.includes('ideal gas') ||
      lower.includes('pv = nrt') ||
      lower.includes('pv=nrt') ||
      lower.includes('2h2 + o2') ||
      lower.includes('stoichiometry')
    ) {
      const isMathFormula =
        lower.includes('pv = nrt') ||
        lower.includes('pv=nrt') ||
        lower.includes('2h2 + o2') ||
        lower.includes('stoichiometry');

      return {
        originalQuery: clean,
        domain: 'chemistry',
        intent: isMathFormula ? 'formula_explanation' : 'concept_learning',
        engine: isMathFormula ? 'math' : 'knowledge',
        confidence: 0.95,
        requiresClarification: false,
        reason: 'The query specifies chemical reactions, bonding mechanisms, or atomic molecular interactions.',
      };
    }

    // 8. Biology
    if (
      lower.includes('photosynthesis') ||
      lower.includes('photosynthesiss') ||
      lower.includes('nervous system') ||
      lower.includes('human nervous system') ||
      lower.includes('central nervous') ||
      lower.includes('peripheral nervous') ||
      lower.includes('brain') ||
      lower.includes('neuron') ||
      lower.includes('spinal cord') ||
      lower.includes('neuroscience') ||
      lower.includes('reflex arc') ||
      lower.includes('dna') ||
      lower.includes('rna') ||
      lower.includes('punnett') ||
      lower.includes('genetics') ||
      lower.includes('mitochondria') ||
      lower.includes('chlorophyll') ||
      lower.includes('heart') ||
      lower.includes('cardiology') ||
      lower.includes('cardiac') ||
      lower.includes('circulatory') ||
      lower.includes('anatomy') ||
      lower.includes('ventricle') ||
      lower.includes('aorta')
    ) {
      return {
        originalQuery: clean,
        domain: 'biology',
        intent: 'concept_learning',
        engine: 'knowledge',
        confidence: 0.95,
        requiresClarification: false,
        reason: 'The query identifies biological systems and cellular/anatomical structures best supported by verified knowledge and spatial diagrams.',
      };
    }

    // 9. History / Real-World Entities / People / Companies (e.g. "Alan Turing", "history of computing", "krislynx llp")
    const isEntityOrHistorical =
      lower.includes('alan turing') ||
      lower.includes('turing') ||
      lower.includes('ada lovelace') ||
      lower.includes('history of') ||
      lower.includes('llp') ||
      lower.includes('ltd') ||
      lower.includes('inc') ||
      lower.includes('corp') ||
      lower.includes('company');

    if (isEntityOrHistorical) {
      return {
        originalQuery: clean,
        domain: lower.includes('history') ? 'history' : 'general_knowledge',
        intent: 'factual_lookup',
        engine: 'knowledge',
        confidence: 0.94,
        requiresClarification: false,
        reason: 'The query refers to a historical figure, computing milestone, or real-world corporate entity.',
      };
    }

    // 10. General / Freeform Unfamiliar Knowledge Queries
    return {
      originalQuery: clean,
      domain: 'general_knowledge',
      intent: 'concept_learning',
      engine: 'knowledge',
      confidence: 0.85,
      requiresClarification: false,
      reason: 'General knowledge topic routed to knowledge retrieval and local AI synthesis.',
    };
  }
}

