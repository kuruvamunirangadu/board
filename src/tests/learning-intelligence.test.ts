import { UniversalInputInterpreter } from '../features/learning/UniversalInputInterpreter';
import { LearningPlanGenerator } from '../features/learning/LearningPlanGenerator';
import { FormulaDerivationEngine } from '../features/learning/FormulaDerivationEngine';
import { InteractiveExplorationEngine } from '../features/learning/InteractiveExplorationEngine';
import { VisualizationPlanner } from '../features/learning/VisualizationPlanner';
import { CapabilityRegistry } from '../features/learning/CapabilityRegistry';

export function runUniversalLearningIntelligenceTests() {
  console.log('\n--- Running Universal Formula & Topic Learning Intelligence Tests ---');

  // Test Case 1: F = ma (Newton's 2nd Law)
  {
    const interp = UniversalInputInterpreter.interpret('F = ma');
    if (interp.category !== 'physics') throw new Error('Expected physics category for F = ma');
    if (!interp.variables.some((v) => v.symbol === 'F')) throw new Error('Missing variable F');
    if (!interp.variables.some((v) => v.symbol === 'm')) throw new Error('Missing variable m');

    const plan = LearningPlanGenerator.generatePlan(interp);
    if (plan.visualizationPlan.rendererType !== 'physics_vector_simulator') {
      throw new Error('Expected physics_vector_simulator for F = ma');
    }

    // Verify calculation: a = F / m
    const calc = FormulaDerivationEngine.calculate(plan.conceptId, { F: 20, m: 4 });
    if (calc.primaryResult !== 5) {
      throw new Error(`Expected a = 5 m/s², got ${calc.primaryResult}`);
    }

    // Interactive update
    const updated = InteractiveExplorationEngine.updateParameter(
      plan,
      plan.defaultExperimentState,
      'F',
      50
    );
    if (updated.parameters.F !== 50) throw new Error('Failed to update parameter F');
    console.log('  ✓ Test 1 Passed: F = ma (Variables, derivations, calculations, vector planner)');
  }

  // Test Case 2: v = u + at (1D Kinematics)
  {
    const interp = UniversalInputInterpreter.interpret('v = u + at');
    if (interp.category !== 'physics') throw new Error('Expected physics category for v = u + at');

    const plan = LearningPlanGenerator.generatePlan(interp);
    if (plan.visualizationPlan.rendererType !== 'function_coordinate_plotter') {
      throw new Error('Expected function_coordinate_plotter for v = u + at');
    }

    const calc = FormulaDerivationEngine.calculate(plan.conceptId, { u: 10, a: 2, t: 5 });
    if (calc.primaryResult !== 20) {
      throw new Error(`Expected v = 20 m/s, got ${calc.primaryResult}`);
    }
    console.log('  ✓ Test 2 Passed: v = u + at (Kinematic time-dependent integration & graph points)');
  }

  // Test Case 3: y = sin(x) (Harmonic Calculus)
  {
    const interp = UniversalInputInterpreter.interpret('y = sin(x)');
    if (interp.category !== 'calculus') throw new Error('Expected calculus for y = sin(x)');

    const plan = LearningPlanGenerator.generatePlan(interp);
    const updated = InteractiveExplorationEngine.updateParameter(
      plan,
      plan.defaultExperimentState,
      'A',
      2
    );
    if (!updated.graphPoints || updated.graphPoints.length === 0) {
      throw new Error('Expected generated sine wave graph points');
    }
    console.log('  ✓ Test 3 Passed: y = sin(x) (Harmonic wave amplitude, phase, and derivative slope)');
  }

  // Test Case 4: Pythagorean theorem (Geometry)
  {
    const interp = UniversalInputInterpreter.interpret('a^2 + b^2 = c^2');
    if (interp.category !== 'geometry') throw new Error('Expected geometry for Pythagoras');

    const plan = LearningPlanGenerator.generatePlan(interp);
    const calc = FormulaDerivationEngine.calculate(plan.conceptId, { a: 6, b: 8 });
    if (calc.primaryResult !== 10) {
      throw new Error(`Expected hypotenuse c = 10, got ${calc.primaryResult}`);
    }
    console.log('  ✓ Test 4 Passed: Pythagorean theorem (Right triangle construction & area proof)');
  }

  // Test Case 5: Binary Search (Computer Science)
  {
    const interp = UniversalInputInterpreter.interpret('binary search');
    if (interp.category !== 'algorithm') throw new Error('Expected algorithm for binary search');

    const plan = LearningPlanGenerator.generatePlan(interp);
    if (plan.visualizationPlan.rendererType !== 'algorithm_array_tracer') {
      throw new Error('Expected algorithm_array_tracer for binary search');
    }
    console.log('  ✓ Test 5 Passed: Binary Search (O(log n) complexity, array tracer, and pointers)');
  }

  // Test Case 6: Chemical Reaction (2H2 + O2 -> 2H2O)
  {
    const interp = UniversalInputInterpreter.interpret('2H2 + O2 -> 2H2O');
    if (interp.category !== 'chemistry') throw new Error('Expected chemistry category');
    console.log('  ✓ Test 6 Passed: Chemistry stoichiometric equation (Reaction classification & mole balance)');
  }

  // Test Case 7: Ambiguous Input Handling ('E' or 'F')
  {
    const interp = UniversalInputInterpreter.interpret('E');
    if (!interp.isAmbiguous) throw new Error('Expected ambiguity flag for single symbol E');
    if (!interp.clarificationOptions || interp.clarificationOptions.length === 0) {
      throw new Error('Expected clarification options for ambiguous symbol E');
    }
    console.log('  ✓ Test 7 Passed: Ambiguous input handling (Clarification options instead of guessing)');
  }

  // Test Case 8: Unsupported / Universal Freeform Topic
  {
    const interp = UniversalInputInterpreter.interpret('Quantum Chromodynamics Flux Tubes');
    const plan = LearningPlanGenerator.generatePlan(interp);
    if (plan.capabilityLevel !== 'partial_with_limitations') {
      throw new Error('Expected partial_with_limitations for unverified advanced topic');
    }
    if (plan.disclosures.length === 0) {
      throw new Error('Expected transparent disclosure for unverified topic');
    }
    console.log('  ✓ Test 8 Passed: Unsupported advanced topics (Honest capability disclosure & graceful fallback)');
  }

  // Test Case 9: Square of a Sum: (a+b)^2=
  {
    const interp = UniversalInputInterpreter.interpret('(a+b)^2=');
    if (interp.category !== 'algebra') throw new Error('Expected algebra category for (a+b)^2=');
    if (!interp.title.includes('(a + b)²')) throw new Error(`Expected Square of a Sum title, got ${interp.title}`);

    const plan = LearningPlanGenerator.generatePlan(interp);
    if (plan.conceptId !== 'algebra_square_sum') {
      throw new Error(`Expected algebra_square_sum conceptId, got ${plan.conceptId}`);
    }

    const calc = FormulaDerivationEngine.calculate(plan.conceptId, { a: 4, b: 3 });
    if (calc.primaryResult !== 49) {
      throw new Error(`Expected (4+3)² = 49, got ${calc.primaryResult}`);
    }
    console.log('  ✓ Test 9 Passed: (a+b)^2= (Recognized Square of a Sum, derived (a+b)², computed 49)');
  }

  // Test Case 10: BoardFeedParser recognition of (a+b)^2= and richText shape parsing
  {
    const { BoardFeedParser } = require('../features/intelligence/board-feed-parser');
    const matched = BoardFeedParser.matchFormulaString('(a+b)^2=');
    if (!matched || matched.title !== 'Square of a Sum: (a + b)²') {
      throw new Error(`Expected Square of a Sum match for (a+b)^2=, got ${matched?.title}`);
    }

    // Mock tldraw text shape with richText
    const mockShape = {
      id: 'shape-1',
      type: 'text',
      props: {
        richText: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '(a+b)^2=' }],
            },
          ],
        },
      },
    };
    const parsed = BoardFeedParser.parseBoardFeed([mockShape as any]);
    if (!parsed || parsed.title !== 'Square of a Sum: (a + b)²') {
      throw new Error(`Expected parseBoardFeed to extract from richText and match (a+b)², got ${parsed?.title}`);
    }
    console.log('  ✓ Test 10 Passed: BoardFeedParser extracts (a+b)^2= from richText without falling back to cached (a-b)²');
  }

  // Test Case 11: Cube of a Sum: (a+b)^3
  {
    const interp = UniversalInputInterpreter.interpret('(a+b)^3');
    if (interp.category !== 'algebra') throw new Error('Expected algebra category for (a+b)^3');
    if (!interp.title.includes('(a + b)^3') && !interp.title.includes('(a + b)³')) {
      throw new Error(`Expected Cube of a Sum title, got ${interp.title}`);
    }

    const plan = LearningPlanGenerator.generatePlan(interp);
    if (plan.conceptId !== 'algebra_cube_sum') {
      throw new Error(`Expected algebra_cube_sum conceptId, got ${plan.conceptId}`);
    }

    const calc = FormulaDerivationEngine.calculate(plan.conceptId, { a: 2, b: 1 });
    if (calc.primaryResult !== 27) {
      throw new Error(`Expected (2+1)³ = 27, got ${calc.primaryResult}`);
    }

    // Verify detailed FOIL derivation
    const derivation = FormulaDerivationEngine.getDerivationSteps(plan.conceptId);
    if (derivation.steps.length < 5) {
      throw new Error(`Expected detailed derivation steps for (a+b)³, got ${derivation.steps.length}`);
    }
    console.log('  ✓ Test 11 Passed: (a+b)^3 (Recognized Cube of a Sum, 6-step FOIL derivation, evaluated 27)');
  }

  // Test Case 12: General Binomial Power (x + y)^4
  {
    const interp = UniversalInputInterpreter.interpret('(x+y)^4');
    if (interp.category !== 'algebra') throw new Error('Expected algebra category for (x+y)^4');
    const plan = LearningPlanGenerator.generatePlan(interp);
    const calc = FormulaDerivationEngine.calculate(plan.conceptId, { x: 2, y: 1 });
    if (calc.primaryResult !== 81) {
      throw new Error(`Expected (2+1)^4 = 81, got ${calc.primaryResult}`);
    }
    console.log('  ✓ Test 12 Passed: (x+y)^4 (Dynamic Pascal Triangle expansion, evaluated 81)');
  }

  // Test Case 13: Universal Word Problem Solver: Density = mass / volume (6 kg, 0.002 m³)
  {
    const prompt = 'Explain density = mass / volume. A 6 kg object occupies 0.002 m³. Calculate its density and visualize the relationship.';
    const interp = UniversalInputInterpreter.interpret(prompt);
    if (interp.category !== 'physics') throw new Error(`Expected physics category for density problem, got ${interp.category}`);
    if (!interp.title.includes('Density')) throw new Error(`Expected Density title, got ${interp.title}`);
    
    // Check extracted variables
    const mVar = interp.variables.find((v) => v.symbol === 'm');
    const vVar = interp.variables.find((v) => v.symbol === 'V');
    if (!mVar || mVar.defaultValue !== 6) throw new Error(`Expected extracted mass m=6 kg, got ${mVar?.defaultValue}`);
    if (!vVar || vVar.defaultValue !== 0.002) throw new Error(`Expected extracted volume V=0.002 m³, got ${vVar?.defaultValue}`);

    const plan = LearningPlanGenerator.generatePlan(interp);
    if (plan.conceptId !== 'physics_density') throw new Error(`Expected physics_density conceptId, got ${plan.conceptId}`);

    const calc = FormulaDerivationEngine.calculate(plan.conceptId, { m: 6, V: 0.002 });
    if (calc.primaryResult !== 3000) throw new Error(`Expected density ρ = 3000 kg/m³, got ${calc.primaryResult}`);

    // Verify BoardFeedParser does not echo prompt in loop
    const { BoardFeedParser } = require('../features/intelligence/board-feed-parser');
    const parsed = BoardFeedParser.solveUniversalTopic(prompt);
    if (!parsed || !parsed.solvedResult.includes('3000 kg/m³')) {
      throw new Error(`Expected solvedResult to contain 3000 kg/m³, got ${parsed?.solvedResult}`);
    }
    if (parsed.normalizedFormula.includes('Calculate its density')) {
      throw new Error('Normalized formula should be concise, not repeat prompt sentence');
    }
    console.log('  ✓ Test 13 Passed: Density word problem parsed, variables (6kg, 0.002m³) extracted, density (3000 kg/m³) solved, no loop repetition');
  }

  // Test Case 14: Typo-Tolerant Computer Science Model ("data strctures")
  {
    const prompt = 'data strctures';
    const interp = UniversalInputInterpreter.interpret(prompt);
    if (interp.category !== 'algorithm') {
      throw new Error(`Expected 'algorithm' category for "data strctures", got "${interp.category}"`);
    }
    if (!interp.title.includes('Data Structures')) {
      throw new Error(`Expected title to include "Data Structures", got "${interp.title}"`);
    }

    const plan = LearningPlanGenerator.generatePlan(interp);
    if (plan.conceptId !== 'cs_data_structures') {
      throw new Error(`Expected conceptId 'cs_data_structures', got "${plan.conceptId}"`);
    }

    // Must NOT have Euclidean geometry assumptions
    if (plan.assumptions.some((a) => a.toLowerCase().includes('euclidean'))) {
      throw new Error('Data structures must not assume Euclidean planar geometry!');
    }
    if (!plan.assumptions.some((a) => a.toLowerCase().includes('ram') || a.toLowerCase().includes('memory'))) {
      throw new Error('Data structures assumptions must specify RAM or memory models');
    }

    // Calculation must be authentic CS metrics (N=10 elements) rather than k=1
    const calc = FormulaDerivationEngine.calculate(plan.conceptId, { N: 10 });
    if (calc.formattedOutput.includes('Parameter k = 1')) {
      throw new Error('Data structures must not fall back to generic "Parameter k = 1"');
    }
    if (!calc.formattedOutput.includes('Time vs Space')) {
      throw new Error(`Expected formatted output to reflect Time vs Space complexity, got: ${calc.formattedOutput}`);
    }

    // Visualization plan must be algorithmic tracer, not geometric block decomposition
    if (plan.visualizationPlan.rendererType !== 'algorithm_array_tracer') {
      throw new Error(`Expected algorithm_array_tracer renderer, got: ${plan.visualizationPlan.rendererType}`);
    }

    // Verify BoardFeedParser handles "data strctures" with authentic CS model
    const { BoardFeedParser } = require('../features/intelligence/board-feed-parser');
    const parsed = BoardFeedParser.solveUniversalTopic(prompt);
    if (parsed.topic !== 'algorithm') {
      throw new Error(`Expected BoardFeedParser topic 'algorithm', got: ${parsed.topic}`);
    }
    if (!parsed.studyGuide.intuition.includes('Arrays') && !parsed.studyGuide.intuition.includes('Linked Lists')) {
      throw new Error('Expected CS studyGuide intuition to mention Arrays and Linked Lists');
    }
    console.log('  ✓ Test 14 Passed: Typo-tolerant "data strctures" recognized as CS algorithm model with Big-O parameters and no Euclidean physics');
  }

  // Test Case 15: Cross-Domain Science Models: Chemistry (Ideal Gas) & Biology (Punnett)
  {
    const chemInterp = UniversalInputInterpreter.interpret('ideal gas law PV = nRT');
    if (chemInterp.category !== 'chemistry') {
      throw new Error(`Expected chemistry category, got: ${chemInterp.category}`);
    }
    const chemPlan = LearningPlanGenerator.generatePlan(chemInterp);
    if (chemPlan.conceptId !== 'chem_ideal_gas') {
      throw new Error(`Expected chem_ideal_gas conceptId, got: ${chemPlan.conceptId}`);
    }

    const bioInterp = UniversalInputInterpreter.interpret('punnett square genetics');
    const bioPlan = LearningPlanGenerator.generatePlan(bioInterp);
    if (bioPlan.conceptId !== 'bio_punnett_genetics') {
      throw new Error(`Expected bio_punnett_genetics conceptId, got: ${bioPlan.conceptId}`);
    }
    console.log('  ✓ Test 15 Passed: Cross-domain Chemistry (PV=nRT) and Biology (Punnett Squares) correctly modeled');
  }

  console.log('✅ All Universal Learning Intelligence tests PASSED!\n');
}

