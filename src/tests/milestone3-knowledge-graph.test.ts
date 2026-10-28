/**
 * Milestone 3 — Interactive Topic Knowledge Graph Test Suite
 * Tests graph acyclicity, prerequisite/dependent tracking, topic query resolution,
 * adaptive next steps, and topic knowledge subgraph generation.
 */

import { ConceptDependencyGraphEngine } from '../features/learning/ConceptDependencyGraph';
import { SavedLearningSessionState } from '../features/learning/types';

export async function runMilestone3KnowledgeGraphTests(): Promise<boolean> {
  console.log('\n--- Running Milestone 3: Interactive Topic Knowledge Graph Tests ---');
  let passed = true;

  function assert(condition: boolean, msg: string) {
    if (!condition) {
      console.error(`  ❌ FAILED: ${msg}`);
      passed = false;
    } else {
      console.log(`  ✓ PASSED: ${msg}`);
    }
  }

  // --- Suite 1: Graph Acyclicity & Registry Integrity ---
  console.log('\n[Suite 1] Graph Acyclicity & Registry Integrity:');
  {
    const validation = ConceptDependencyGraphEngine.validateGraph();
    assert(validation.isValid, 'Extended concept registry is strictly valid and acyclic');
    assert(validation.errors.length === 0, `Zero circular dependency errors detected (errors: ${validation.errors.length})`);

    const registry = ConceptDependencyGraphEngine.getRegistry();
    const count = Object.keys(registry).length;
    assert(count >= 20, `Curriculum concept registry contains >= 20 verified nodes (found: ${count})`);
  }

  // --- Suite 2: Topic Query Resolution ---
  console.log('\n[Suite 2] Deterministic Topic Query Resolution:');
  {
    const testCases: [string, string][] = [
      ['y = 2x + 3', 'math_linear_functions'],
      ['linear function', 'math_linear_functions'],
      ['slope intercept form', 'math_linear_functions'],
      ['Pythagorean theorem', 'math_pythagorean_theorem'],
      ['a^2 + b^2 = c^2', 'math_pythagorean_theorem'],
      ['right triangle', 'math_right_triangles'],
      ['equivalent fractions', 'math_equivalent_fractions'],
      ['fractions', 'math_fractions_basic'],
      ['distance between points', 'math_euclidean_distance'],
      ['Cartesian coordinate plane', 'math_cartesian_plane'],
      ['binary tree traversal', 'cs_trees_traversal'],
      ['graph vertices and edges', 'cs_graphs_theory'],
      ['binary search', 'cs_binary_search'],
      ['F = ma', 'phys_newton_laws'],
    ];

    for (const [query, expectedId] of testCases) {
      const resolved = ConceptDependencyGraphEngine.resolveGoalConcept(query);
      assert(
        resolved !== null && resolved.id === expectedId,
        `Query "${query}" resolves to concept "${expectedId}" (got: ${resolved?.id})`
      );
    }
  }

  // --- Suite 3: Prerequisites & Downstream Dependents ---
  console.log('\n[Suite 3] Prerequisite & Downstream Dependent Relationships:');
  {
    // Linear Functions: prereqs = [math_cartesian_plane, math_linear_equations], dependents include math_systems_linear
    const linearPrereqs = ConceptDependencyGraphEngine.getDirectPrerequisites('math_linear_functions');
    const linearPrereqIds = linearPrereqs.map((p) => p.id);
    assert(
      linearPrereqIds.includes('math_cartesian_plane') && linearPrereqIds.includes('math_linear_equations'),
      'Linear Functions has Cartesian Plane and Linear Equations as direct prerequisites'
    );

    const linearDependents = ConceptDependencyGraphEngine.getDirectDependents('math_linear_functions');
    const linearDepIds = linearDependents.map((d) => d.id);
    assert(
      linearDepIds.includes('math_systems_linear'),
      'Linear Functions unlocks Systems of Linear Equations downstream'
    );

    // Pythagorean Theorem: prereqs = [math_right_triangles, math_factoring_expansion], dependents include math_euclidean_distance
    const pythagPrereqs = ConceptDependencyGraphEngine.getDirectPrerequisites('math_pythagorean_theorem');
    const pythagPrereqIds = pythagPrereqs.map((p) => p.id);
    assert(
      pythagPrereqIds.includes('math_right_triangles') && pythagPrereqIds.includes('math_factoring_expansion'),
      'Pythagorean Theorem has Right Triangles and Binomial Expansion as direct prerequisites'
    );

    const pythagDependents = ConceptDependencyGraphEngine.getDirectDependents('math_pythagorean_theorem');
    const pythagDepIds = pythagDependents.map((d) => d.id);
    assert(
      pythagDepIds.includes('math_euclidean_distance'),
      'Pythagorean Theorem unlocks Euclidean Distance in coordinate space'
    );

    // Fractions: equivalent fractions depends on basic fractions
    const equivPrereqs = ConceptDependencyGraphEngine.getDirectPrerequisites('math_equivalent_fractions');
    assert(
      equivPrereqs.length === 1 && equivPrereqs[0].id === 'math_fractions_basic',
      'Equivalent Fractions has Fractions & Part-to-Whole Representation as single prerequisite'
    );

    // Trees & Graphs: Graph theory depends on binary trees traversal
    const graphPrereqs = ConceptDependencyGraphEngine.getDirectPrerequisites('cs_graphs_theory');
    assert(
      graphPrereqs.some((p) => p.id === 'cs_trees_traversal'),
      'Graph Theory has Binary Trees & Tree Traversal as prerequisite'
    );
  }

  // --- Suite 4: Evidence-Grounded Next Steps Recommendations ---
  console.log('\n[Suite 4] Adaptive Next Steps Recommendations:');
  {
    // Case A: Student has not started target concept -> recommends practicing current concept
    const unstartedRecs = ConceptDependencyGraphEngine.getRecommendedNextSteps('math_linear_functions');
    assert(unstartedRecs.length > 0, 'Generates recommendations for unstarted concept');
    assert(
      unstartedRecs.some((r) => r.concept.id === 'math_linear_functions'),
      'Includes active target concept practice recommendation'
    );

    // Case B: Student has mastered target concept (100% score) -> recommends downstream advance steps
    const masteredSession = {
      id: 'session-mastered-linear',
      schemaVersion: 1,
      conceptId: 'math_linear_functions',
      primaryTopic: 'y = 2x + 3',
      currentLessonStep: 'recap',
      activeTab: 'master',
      isGuidedMode: true,
      practiceAttempts: {
        multipleChoice: { selectedIndex: 0, isCorrect: true, score: 100, explanation: 'Correct', attemptedAt: Date.now() },
        shortAnswer: { rawInput: '2', isCorrect: true, score: 100, explanation: 'Correct', attemptedAt: Date.now() },
      },
      completedSteps: ['concept_meaning', 'why_it_matters', 'prerequisites', 'step_by_step', 'worked_example', 'recap'],
      isCompleted: true,
      lastOpenedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as unknown as SavedLearningSessionState;

    const advancedRecs = ConceptDependencyGraphEngine.getRecommendedNextSteps(
      'math_linear_functions',
      masteredSession,
      [masteredSession]
    );
    assert(
      advancedRecs.some((r) => r.priority === 'advanced_step' && r.concept.id === 'math_systems_linear'),
      'Mastered student receives advanced next step recommendation to study Systems of Linear Equations'
    );
  }

  // --- Suite 5: Subgraph Coordinate Layout & Edge Geometry ---
  console.log('\n[Suite 5] Subgraph Coordinate Layout & Edge Geometry:');
  {
    const subGraph = ConceptDependencyGraphEngine.getTopicKnowledgeSubGraph('y = 2x + 3');
    assert(subGraph !== null, 'SubGraph generated successfully for y = 2x + 3');

    if (subGraph) {
      assert(subGraph.targetConcept.id === 'math_linear_functions', 'Target concept is math_linear_functions');
      assert(subGraph.prerequisites.length === 2, `Prerequisites count is 2 (found: ${subGraph.prerequisites.length})`);
      assert(subGraph.dependents.length >= 1, `Dependents count >= 1 (found: ${subGraph.dependents.length})`);

      // Verify node positions
      const targetNode = subGraph.nodes.find((n) => n.role === 'current');
      assert(targetNode !== undefined && targetNode.x === 350, 'Target concept positioned in center column (x = 350)');

      const prereqNodes = subGraph.nodes.filter((n) => n.role === 'prerequisite');
      assert(
        prereqNodes.every((p) => p.x === 120),
        'All prerequisite nodes positioned in left column (x = 120)'
      );

      const dependentNodes = subGraph.nodes.filter((n) => n.role === 'dependent');
      assert(
        dependentNodes.every((d) => d.x === 580),
        'All dependent nodes positioned in right column (x = 580)'
      );

      // Verify edges
      assert(subGraph.edges.length >= 3, `Directed edges count >= 3 (found: ${subGraph.edges.length})`);
      assert(
        subGraph.edges.some((e) => e.targetId === 'math_linear_functions'),
        'Contains incoming edges to target concept from prerequisites'
      );
      assert(
        subGraph.edges.some((e) => e.sourceId === 'math_linear_functions'),
        'Contains outgoing edges from target concept to dependents'
      );
    }
  }

  if (passed) {
    console.log('\n✅ All Milestone 3 Interactive Topic Knowledge Graph tests PASSED (100%)\n');
  } else {
    console.error('\n❌ Some Milestone 3 Knowledge Graph tests FAILED\n');
  }

  return passed;
}

if (require.main === module) {
  runMilestone3KnowledgeGraphTests().then((ok) => process.exit(ok ? 0 : 1));
}

