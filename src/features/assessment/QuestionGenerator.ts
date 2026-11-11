/**
 * VisiOS — Phase 5: Question Generator
 * Generates verified assessment questions across registered STEM engine capabilities.
 * Enforces difficulty grading (1-5), progressive hints, and self-validation.
 */

import {
  AssessmentQuestion,
  AssessmentDifficultyLevel,
} from './AssessmentContracts';
import { QuestionValidator } from './QuestionValidator';
import { MathematicalCorrectnessEngine } from '../learning/MathematicalCorrectnessEngine';

export class QuestionGenerator {
  /**
   * Generates a validated question for a given concept and difficulty level.
   */
  public static generate(
    conceptId: string,
    difficulty: AssessmentDifficultyLevel = 2
  ): AssessmentQuestion {
    let question: AssessmentQuestion;

    if (conceptId.includes('linear')) {
      question = this.generateLinearQuestion(difficulty);
    } else if (conceptId.includes('quadratic')) {
      question = this.generateQuadraticQuestion(difficulty);
    } else if (conceptId.includes('fraction')) {
      question = this.generateFractionQuestion(difficulty);
    } else if (conceptId.includes('pythagor') || conceptId.includes('triangle')) {
      question = this.generatePythagoreanQuestion(difficulty);
    } else if (conceptId.includes('binary_search')) {
      question = this.generateBinarySearchQuestion(difficulty);
    } else if (conceptId.includes('f_ma')) {
      question = this.generatePhysicsQuestion(difficulty);
    } else if (conceptId.startsWith('chem_')) {
      question = this.generateChemistryQuestion(conceptId, difficulty);
    } else if (conceptId.startsWith('bio_')) {
      question = this.generateBiologyQuestion(conceptId, difficulty);
    } else {
      question = this.generateGenericQuestion(conceptId, difficulty);
    }

    // Always validate generated questions before returning
    const validation = QuestionValidator.validate(question);
    if (!validation.isValid) {
      throw new Error(
        `Generated question failed validation: ${validation.errors.join('; ')}`
      );
    }

    return question;
  }

  // --- Linear Functions Generator (Levels 1-5) ---
  private static generateLinearQuestion(difficulty: AssessmentDifficultyLevel): AssessmentQuestion {
    const id = `q_linear_diff${difficulty}_${Date.now()}`;
    const conceptId = 'math_linear_functions';
    const capabilityId = 'cap_linear_functions';

    if (difficulty === 1) {
      // Level 1 (Beginner): Identify y-intercept
      return {
        id,
        conceptId,
        capabilityId,
        question: 'What is the y-intercept of the linear equation y = 2x + 3?',
        questionType: 'numeric',
        difficulty: 1,
        prerequisites: ['math_cartesian_plane'],
        expectedAnswer: 3,
        evaluationStrategy: 'deterministic_numeric',
        hints: [
          'In slope-intercept form y = mx + b, which term represents the y-intercept?',
          'The y-intercept occurs where the line crosses the y-axis (at x = 0).',
          'Evaluate y = 2(0) + 3 to find the constant term: 3.',
        ],
        explanation: 'In the equation y = mx + b, b is the y-intercept. For y = 2x + 3, b = 3.',
      };
    }

    if (difficulty === 2) {
      // Level 2 (Intermediate): Value substitution y = 2x + 3 at x = 4 -> 11
      const computed = MathematicalCorrectnessEngine.analyzeLinearFunction(2, 3).evaluateAt(4);
      return {
        id,
        conceptId,
        capabilityId,
        question: 'Given the linear function y = 2x + 3, calculate the value of y when x = 4.',
        questionType: 'numeric',
        difficulty: 2,
        prerequisites: ['math_linear_equations'],
        expectedAnswer: computed,
        evaluationStrategy: 'deterministic_numeric',
        hints: [
          'Substitute x = 4 directly into the equation: y = 2(4) + 3.',
          'Multiply the slope by the input value first: 2 * 4 = 8.',
          'Add the y-intercept to complete the calculation: 8 + 3 = 11.',
        ],
        explanation: `Substitute x = 4 into y = 2x + 3: y = 2(4) + 3 = 8 + 3 = ${computed}.`,
        expectedSteps: ['y = 2(4) + 3', 'y = 8 + 3', 'y = 11'],
      };
    }

    if (difficulty === 3) {
      // Level 3 (Step-by-Step): Solve 2x + 3 = 11
      return {
        id,
        conceptId,
        capabilityId,
        question: 'Solve for x: 2x + 3 = 11',
        questionType: 'step_by_step',
        difficulty: 3,
        prerequisites: ['math_linear_equations'],
        expectedAnswer: 4,
        evaluationStrategy: 'linear_derivation_audit',
        hints: [
          'Isolate the variable term by subtracting the constant 3 from both sides.',
          'After subtracting 3, you get 2x = 8. What operation will isolate x?',
          'Divide both sides by the coefficient 2 to find x.',
        ],
        explanation: 'Subtract 3 from both sides: 2x = 8. Divide by 2: x = 4.',
        expectedSteps: ['2x = 11 - 3', '2x = 8', 'x = 4'],
      };
    }

    if (difficulty === 4) {
      // Level 4 (Advanced Symbolic): Slope through points (2, 7) and (4, 11)
      return {
        id,
        conceptId,
        capabilityId,
        question: 'What is the slope of the line passing through coordinates (2, 7) and (4, 11)?',
        questionType: 'numeric',
        difficulty: 4,
        prerequisites: ['math_linear_functions'],
        expectedAnswer: 2,
        evaluationStrategy: 'deterministic_numeric',
        hints: [
          'Recall the slope formula: m = (y2 - y1) / (x2 - x1).',
          'Calculate the change in y (rise): 11 - 7 = 4.',
          'Calculate the change in x (run): 4 - 2 = 2. Then divide: 4 / 2 = 2.',
        ],
        explanation: 'Slope m = (11 - 7) / (4 - 2) = 4 / 2 = 2.',
      };
    }

    // Level 5 (Application): Real world modeling
    return {
      id,
      conceptId,
      capabilityId,
      question: 'A tank begins with 3 liters of water and fills at a rate of 2 liters per minute. Express the volume V after t minutes as a linear equation.',
      questionType: 'symbolic',
      difficulty: 5,
      prerequisites: ['math_linear_functions'],
      expectedAnswer: 'V = 2t + 3',
      evaluationStrategy: 'symbolic_equivalence',
      hints: [
        'Identify the initial starting value (intercept) and the rate of change (slope).',
        'Initial volume is 3 (intercept); filling rate is 2 (slope).',
        'Combine in slope-intercept form: V = 2t + 3.',
      ],
      explanation: 'The initial volume is 3 liters (y-intercept) and increases at 2 liters/min (slope), yielding V = 2t + 3.',
    };
  }

  // --- Fractions Generator ---
  private static generateFractionQuestion(difficulty: AssessmentDifficultyLevel): AssessmentQuestion {
    const id = `q_frac_diff${difficulty}_${Date.now()}`;
    const conceptId = 'math_fractions_basic';
    const capabilityId = 'cap_rational_fractions';

    const rational = MathematicalCorrectnessEngine.addFractions(1, 2, 1, 3);
    const expected = `${rational.simplified.numerator}/${rational.simplified.denominator}`;

    return {
      id,
      conceptId,
      capabilityId,
      question: 'Evaluate the sum of the fractions: 1/2 + 1/3',
      questionType: 'short_answer',
      difficulty,
      prerequisites: ['math_fractions_basic'],
      expectedAnswer: expected,
      evaluationStrategy: 'fraction_exact',
      hints: [
        'Fractions must have the same denominator before you can add them.',
        'Find the Least Common Multiple (LCM) of 2 and 3, which is 6.',
        'Convert both fractions: 1/2 = 3/6 and 1/3 = 2/6. Then add: 3/6 + 2/6 = 5/6.',
      ],
      explanation: '1/2 + 1/3 = 3/6 + 2/6 = 5/6.',
    };
  }

  // --- Pythagorean Question ---
  private static generatePythagoreanQuestion(difficulty: AssessmentDifficultyLevel): AssessmentQuestion {
    const id = `q_pyth_diff${difficulty}_${Date.now()}`;
    const conceptId = 'math_pythagorean_theorem';
    const capabilityId = 'cap_euclidean_geometry';

    return {
      id,
      conceptId,
      capabilityId,
      question: 'In a right-angled triangle with leg lengths a = 3 and b = 4, calculate the length of the hypotenuse c.',
      questionType: 'numeric',
      difficulty,
      prerequisites: ['math_right_triangles'],
      expectedAnswer: 5,
      evaluationStrategy: 'deterministic_numeric',
      hints: [
        'Apply the Pythagorean theorem: a^2 + b^2 = c^2.',
        'Calculate squares of legs: 3^2 + 4^2 = 9 + 16 = 25.',
        'Take the square root of 25: c = 5.',
      ],
      explanation: 'c = √(3² + 4²) = √(9 + 16) = √25 = 5.',
    };
  }

  // --- Binary Search Question ---
  private static generateBinarySearchQuestion(difficulty: AssessmentDifficultyLevel): AssessmentQuestion {
    const id = `q_bs_diff${difficulty}_${Date.now()}`;
    const conceptId = 'cs_binary_search';
    const capabilityId = 'cap_cs_binary_search';

    return {
      id,
      conceptId,
      capabilityId,
      question: 'Given the sorted array [2, 4, 7, 9, 12, 15, 20], what is the first element compared against target 15?',
      questionType: 'multiple_choice',
      difficulty,
      prerequisites: ['cs_sorted_arrays'],
      options: ['7', '9', '12', '15'],
      correctOptionIndex: 1, // mid = (0 + 6) / 2 = 3 -> array[3] = 9
      expectedAnswer: '9',
      evaluationStrategy: 'exact_option',
      hints: [
        'Binary search begins by calculating the midpoint index: mid = Math.floor((low + high) / 2).',
        'With low = 0 and high = 6: mid = Math.floor((0 + 6) / 2) = 3.',
        'Element at index 3 is 9.',
      ],
      explanation: 'With low = 0 and high = 6, midpoint index is 3. Array[3] is 9.',
    };
  }

  // --- Physics Question ---
  private static generatePhysicsQuestion(difficulty: AssessmentDifficultyLevel): AssessmentQuestion {
    const id = `q_fma_diff${difficulty}_${Date.now()}`;
    const conceptId = 'physics_f_ma';
    const capabilityId = 'cap_physics_f_ma';

    return {
      id,
      conceptId,
      capabilityId,
      question: 'A mass of 5 kg experiences an acceleration of 4 m/s². What is the net force acting on the mass?',
      questionType: 'numeric',
      difficulty,
      prerequisites: ['physics_force_dynamics'],
      expectedAnswer: 20,
      unit: 'N',
      evaluationStrategy: 'deterministic_numeric',
      hints: [
        'Apply Newton second law: F = m * a.',
        'Multiply mass (5 kg) by acceleration (4 m/s²).',
        '5 * 4 = 20 Newtons.',
      ],
      explanation: 'F = m * a = 5 kg * 4 m/s² = 20 N.',
    };
  }

  // --- Quadratic Equations (Levels 1-5) ---
  private static generateQuadraticQuestion(difficulty: AssessmentDifficultyLevel): AssessmentQuestion {
    const id = `q_quadratic_diff${difficulty}_${Date.now()}`;
    const conceptId = 'algebra_quadratic';
    const capabilityId = 'cap_quadratic_equations';
    const questions: Record<AssessmentDifficultyLevel, AssessmentQuestion> = {
      1: {
        id, conceptId, capabilityId,
        question: 'In x² − 5x + 6 = 0, what is the coefficient a?',
        questionType: 'multiple_choice', difficulty: 1, prerequisites: ['math_coefficients'],
        options: ['−5', '1', '6', '0'], correctOptionIndex: 1, expectedAnswer: '1',
        evaluationStrategy: 'exact_option', hints: ['Compare the equation with ax² + bx + c = 0.', 'The coefficient before x² is a.'],
        explanation: 'In x² − 5x + 6 = 0, the coefficient of x² is 1, so a = 1.',
      },
      2: {
        id, conceptId, capabilityId,
        question: 'Solve x² − 5x + 6 = 0. Choose the pair of roots.',
        questionType: 'multiple_choice', difficulty: 2, prerequisites: ['math_factoring'],
        options: ['1 and 6', '2 and 3', '−2 and −3', '−1 and −6'], correctOptionIndex: 1, expectedAnswer: '2 and 3',
        evaluationStrategy: 'exact_option', hints: ['Find two numbers whose product is 6 and sum is 5.', 'Factor as (x − 2)(x − 3) = 0.'],
        explanation: '(x − 2)(x − 3) = 0, so the roots are x = 2 and x = 3.',
      },
      3: {
        id, conceptId, capabilityId,
        question: 'For y = x² − 6x + 5, what is the x-coordinate of the vertex?',
        questionType: 'numeric', difficulty: 3, prerequisites: ['math_vertex_form'],
        expectedAnswer: 3, evaluationStrategy: 'deterministic_numeric', tolerance: 0.001,
        hints: ['For ax² + bx + c, the vertex x-coordinate is −b/(2a).', 'Substitute a = 1 and b = −6.'],
        explanation: 'x = −(−6)/(2·1) = 3.',
      },
      4: {
        id, conceptId, capabilityId,
        question: 'Calculate the discriminant b² − 4ac for 2x² − 5x + 2 = 0.',
        questionType: 'numeric', difficulty: 4, prerequisites: ['math_discriminant'],
        expectedAnswer: 9, evaluationStrategy: 'deterministic_numeric', tolerance: 0.001,
        hints: ['Identify a = 2, b = −5, c = 2.', 'Evaluate (−5)² − 4(2)(2).'],
        explanation: 'The discriminant is (−5)² − 4·2·2 = 25 − 16 = 9.',
      },
      5: {
        id, conceptId, capabilityId,
        question: 'A quadratic has roots 2 and 5 and leading coefficient 1. Which is its expanded equation?',
        questionType: 'multiple_choice', difficulty: 5, prerequisites: ['math_quadratic_roots'],
        options: ['x² + 7x + 10 = 0', 'x² − 7x + 10 = 0', 'x² − 3x − 10 = 0', 'x² + 3x − 10 = 0'],
        correctOptionIndex: 1, expectedAnswer: 'x² − 7x + 10 = 0', evaluationStrategy: 'exact_option',
        hints: ['Write the factored form (x − 2)(x − 5) = 0.', 'Expand the product and combine the middle terms.'],
        explanation: '(x − 2)(x − 5) = x² − 7x + 10, so x² − 7x + 10 = 0.',
      },
    };
    return questions[difficulty];
  }

  private static generateChemistryQuestion(conceptId: string, difficulty: AssessmentDifficultyLevel): AssessmentQuestion {
    const bank: Record<string, Array<[string, string[], number, string, string]>> = {
      chem_periodic_table: [
        ['How many valence electrons does a neutral carbon atom have?', ['2', '4', '6', '8'], 1, 'Carbon is in group 14 (IVA).', 'Main-group group 14 elements have four valence electrons.'],
        ['What is the atomic number of oxygen?', ['6', '7', '8', '16'], 2, 'Atomic number counts protons.', 'Oxygen has eight protons, so its atomic number is 8.'],
        ['Which element is a noble gas?', ['Sodium', 'Neon', 'Chlorine', 'Magnesium'], 1, 'Noble gases occupy group 18.', 'Neon is a group 18 noble gas.'],
        ['Which period contains sodium (Na)?', ['Period 1', 'Period 2', 'Period 3', 'Period 4'], 2, 'Sodium has three occupied electron shells.', 'Sodium is in period 3.'],
        ['Across a period from left to right, metallic character generally…', ['Increases', 'Decreases', 'Stays exactly constant', 'Becomes unrelated to position'], 1, 'Elements become less likely to lose electrons across a period.', 'Metallic character generally decreases from left to right across a period.'],
      ],
      chem_ideal_gas: [
        ['Which equation is the ideal gas law?', ['PV = nRT', 'P + V = nT', 'P/V = RT', 'PV = R/(nT)'], 0, 'Recall the relationship among pressure, volume, amount, and temperature.', 'The ideal gas law is PV = nRT.'],
        ['At constant temperature and amount, if a gas volume doubles, its pressure…', ['Doubles', 'Halves', 'Stays the same', 'Becomes zero'], 1, 'Use Boyle’s law: pressure and volume are inversely related.', 'At constant temperature, doubling volume halves pressure.'],
        ['At constant pressure and amount, if absolute temperature doubles, gas volume…', ['Halves', 'Doubles', 'Stays the same', 'Quadruples'], 1, 'Use Charles’s law with temperature in kelvin.', 'At constant pressure, volume is proportional to absolute temperature.'],
        ['Which temperature scale must be used in PV = nRT?', ['Celsius', 'Fahrenheit', 'Kelvin', 'Any scale'], 2, 'The ideal gas equation requires an absolute temperature scale.', 'Temperature must be expressed in kelvin.'],
        ['Which is an ideal-gas model assumption?', ['Particles have negligible individual volume', 'Particles attract strongly at all distances', 'Collisions destroy kinetic energy', 'Particles stop moving between collisions'], 0, 'Think about the simplified particle model.', 'The ideal-gas model treats particle volume as negligible and collisions as elastic.'],
      ],
      chem_chemical_bonding: [
        ['What type of bond forms when sodium transfers an electron to chlorine?', ['Ionic', 'Nonpolar covalent', 'Metallic', 'Hydrogen'], 0, 'Electron transfer creates oppositely charged ions.', 'Sodium and chlorine form an ionic bond through electron transfer.'],
        ['The bond between the two atoms in Cl₂ is…', ['Ionic', 'Nonpolar covalent', 'Metallic', 'Hydrogen'], 1, 'Identical atoms share bonding electrons equally.', 'The Cl–Cl bond is nonpolar covalent because the atoms share electrons equally.'],
        ['What type of bond joins copper atoms in a metal?', ['Ionic', 'Covalent network', 'Metallic', 'Hydrogen'], 2, 'Metals have delocalized valence electrons.', 'Metallic bonding involves metal cations in a delocalized electron sea.'],
        ['A polar covalent bond forms when atoms…', ['Transfer all bonding electrons', 'Share electrons unequally', 'Share electrons equally', 'Have no valence electrons'], 1, 'Different electronegativities create unequal sharing.', 'Polar covalent bonds share electrons unequally.'],
        ['Hydrogen bonds between water molecules are best described as…', ['Intramolecular ionic bonds', 'Intermolecular attractions', 'Metallic bonds', 'Covalent bonds within oxygen'], 1, 'These attractions occur between separate water molecules.', 'Hydrogen bonds are intermolecular attractions between partially charged regions.'],
      ],
    };
    return this.generateCuratedChoiceQuestion(conceptId, difficulty, bank);
  }

  private static generateBiologyQuestion(conceptId: string, difficulty: AssessmentDifficultyLevel): AssessmentQuestion {
    const bank: Record<string, Array<[string, string[], number, string, string]>> = {
      bio_photosynthesis: [
        ['Which organelle is the primary site of photosynthesis?', ['Mitochondrion', 'Chloroplast', 'Nucleus', 'Ribosome'], 1, 'It contains chlorophyll.', 'Chloroplasts contain chlorophyll and carry out photosynthesis.'],
        ['Which gas is taken in as a carbon source during photosynthesis?', ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], 2, 'This molecule supplies the carbon atoms in sugars.', 'Plants take in carbon dioxide to build sugars.'],
        ['What is the main energy source for photosynthesis?', ['Light', 'Soil minerals', 'Oxygen', 'Glucose'], 0, 'Chlorophyll captures energy from this source.', 'Photosynthesis uses light energy.'],
        ['Which products are formed in the overall photosynthesis equation?', ['Glucose and oxygen', 'Carbon dioxide and water', 'Nitrogen and glucose', 'Water and nitrogen'], 0, 'Light energy helps convert carbon dioxide and water into sugar and oxygen.', 'The overall products are glucose and oxygen.'],
        ['In the Calvin cycle, plants primarily…', ['Fix carbon dioxide into organic molecules', 'Split glucose to release energy', 'Copy DNA', 'Absorb oxygen into hemoglobin'], 0, 'The cycle incorporates carbon from CO₂.', 'The Calvin cycle fixes carbon dioxide into carbohydrate precursors.'],
      ],
      bio_dna_structure: [
        ['In DNA, which base pairs with adenine (A)?', ['Cytosine (C)', 'Guanine (G)', 'Thymine (T)', 'Uracil (U)'], 2, 'DNA uses complementary base pairing; RNA uses uracil.', 'Adenine pairs with thymine in DNA.'],
        ['Which DNA base pairs with cytosine (C)?', ['Adenine (A)', 'Guanine (G)', 'Thymine (T)', 'Uracil (U)'], 1, 'C and G form a complementary pair.', 'Cytosine pairs with guanine.'],
        ['Which sugar is found in DNA?', ['Ribose', 'Deoxyribose', 'Glucose', 'Fructose'], 1, 'The molecule’s name identifies its sugar.', 'DNA contains deoxyribose sugar.'],
        ['The two strands of the DNA double helix run…', ['Parallel in the same direction', 'Antiparallel in opposite directions', 'In random directions', 'As one continuous strand'], 1, 'Their 5′ and 3′ orientations oppose one another.', 'DNA strands are antiparallel.'],
        ['A DNA nucleotide contains a phosphate, a sugar, and…', ['A nitrogenous base', 'An amino acid', 'A fatty acid', 'A glycerol molecule'], 0, 'The base carries the sequence information.', 'Each DNA nucleotide contains a phosphate group, deoxyribose, and a nitrogenous base.'],
      ],
      bio_punnett_genetics: [
        ['For a cross Aa × Aa, what fraction of offspring are expected to be aa?', ['0%', '25%', '50%', '75%'], 1, 'Only one of the four equally likely combinations is aa.', 'The genotypes are AA, Aa, Aa, and aa, so aa occurs 25% of the time.'],
        ['For a cross Aa × aa, what fraction of offspring are expected to be aa?', ['0%', '25%', '50%', '100%'], 2, 'The Aa parent passes a half the time; the aa parent always passes a.', 'Half of the offspring are expected to be aa.'],
        ['For a cross AA × aa, what genotype will all offspring have?', ['AA', 'Aa', 'aa', 'Half AA and half aa'], 1, 'Each offspring gets A from one parent and a from the other.', 'All offspring are expected to be heterozygous Aa.'],
        ['If B is completely dominant to b, what fraction of Bb × Bb offspring show the dominant phenotype?', ['25%', '50%', '75%', '100%'], 2, 'Only bb shows the recessive phenotype.', 'Three of four genotype outcomes contain at least one dominant B allele.'],
        ['A recessive trait appears in an individual with genotype…', ['AA only', 'Aa only', 'aa', 'AA or Aa'], 2, 'A recessive phenotype requires two recessive alleles.', 'With complete dominance, genotype aa expresses the recessive trait.'],
      ],
      bio_nervous_system: [
        ['Which neuron structure primarily carries signals away from the cell body?', ['Dendrite', 'Axon', 'Synapse', 'Nucleus'], 1, 'Dendrites generally receive incoming signals.', 'An axon carries impulses away from the cell body.'],
        ['Which neuron structures commonly receive incoming signals?', ['Dendrites', 'Axons', 'Myelin sheaths', 'Nuclei'], 0, 'They branch near the neuron cell body.', 'Dendrites receive signals from other cells.'],
        ['What is a major function of myelin around an axon?', ['Slow electrical signaling', 'Insulate the axon and speed signaling', 'Produce neurotransmitters', 'Store genetic information'], 1, 'Myelin enables faster signal conduction.', 'Myelin insulates axons and increases conduction speed.'],
        ['A synapse is…', ['The gap or junction where cells communicate', 'The neuron’s DNA', 'The myelin-producing gene', 'A type of red blood cell'], 0, 'Neurotransmitters cross this connection.', 'A synapse is the communication junction between neurons or a neuron and target cell.'],
        ['The central nervous system consists mainly of the…', ['Brain and spinal cord', 'Heart and lungs', 'Muscles and bones', 'Skin and sensory receptors'], 0, 'It is the central processing system of the body.', 'The central nervous system comprises the brain and spinal cord.'],
      ],
    };
    return this.generateCuratedChoiceQuestion(conceptId, difficulty, bank);
  }

  private static generateCuratedChoiceQuestion(
    conceptId: string,
    difficulty: AssessmentDifficultyLevel,
    bank: Record<string, Array<[string, string[], number, string, string]>>
  ): AssessmentQuestion {
    const item = bank[conceptId]?.[difficulty - 1];
    if (!item) return this.generateGenericQuestion(conceptId, difficulty);
    const [question, options, correctOptionIndex, hint, explanation] = item;
    return {
      id: `q_${conceptId}_${difficulty}_${Date.now()}`,
      conceptId,
      capabilityId: `cap_${conceptId}`,
      question,
      questionType: 'multiple_choice',
      difficulty,
      prerequisites: [],
      options,
      correctOptionIndex,
      expectedAnswer: options[correctOptionIndex],
      evaluationStrategy: 'exact_option',
      hints: [hint, explanation],
      explanation,
    };
  }

  // --- Generic Fallback Question ---
  private static generateGenericQuestion(
    conceptId: string,
    difficulty: AssessmentDifficultyLevel
  ): AssessmentQuestion {
    return {
      id: `q_generic_${conceptId}_${Date.now()}`,
      conceptId,
      capabilityId: 'cap_general_explanation',
      question: `A verified assessment question for ${conceptId.replace(/_/g, ' ')} is not available yet.`,
      questionType: 'short_answer',
      difficulty,
      prerequisites: [],
      evaluationStrategy: 'unsupported',
      hints: ['Choose a topic with verified assessment coverage, or continue with the concept explanation.'],
      explanation: 'This topic does not yet have an assessment that the available engines can validate reliably.',
    };
  }
}

