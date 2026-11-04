/**
 * VisiOS — Mathematical Input Normalizer & AST Parser
 * Safely parses, tokenizes, and normalizes mathematical expressions WITHOUT eval().
 * Preserves the entire expression and AST context for concept, derivation, and graph plotting.
 */

import { NormalizedMathExpression, StudentIntent } from './InputIntelligenceTypes';

// Allowed characters in safe mathematical expressions
const SAFE_MATH_CHARS = /^[a-zA-Z0-9\s\+\-\*\/\^\=\(\)\.\,\[\]\/²³⁴⁵_']+$/;

// Standard supported trigonometric function names
const TRIG_FUNCTIONS = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan'];

export class MathInputNormalizer {
  /**
   * Attempts to detect, tokenize, and normalize any mathematical expression.
   * Produces a unified mathematical representation without dropping terms.
   */
  public static normalize(raw: string): NormalizedMathExpression {
    const trimmed = (raw || '').trim();

    if (!trimmed) {
      return this.invalid(raw, 'Empty expression.');
    }

    // Convert unicode superscripts to standard caret powers
    const sanitized = trimmed.replace(/[²³⁴⁵]/g, (c) => ({
      '²': '^2', '³': '^3', '⁴': '^4', '⁵': '^5',
    })[c] ?? c);

    if (!SAFE_MATH_CHARS.test(sanitized.replace(/\s+/g, ' '))) {
      return this.invalid(raw, 'Expression contains unsupported characters.');
    }

    // Check for malformed expressions: trailing operators
    if (/[+\-\*\/\^=]\s*$/.test(trimmed)) {
      return {
        isMathematical: true,
        rawExpression: raw,
        normalizedSyntax: '',
        mathType: 'malformed',
        parameters: {},
        isValid: false,
        validationError: `Incomplete expression — ends with an operator: "${trimmed}"`,
      };
    }

    // Check for mismatched parentheses
    const openParens = (trimmed.match(/\(/g) || []).length;
    const closeParens = (trimmed.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      return {
        isMathematical: true,
        rawExpression: raw,
        normalizedSyntax: '',
        mathType: 'malformed',
        parameters: {},
        isValid: false,
        validationError: `Mismatched parentheses in expression: "${trimmed}"`,
      };
    }

    // 1. Calculus / Derivative tasks: "differentiate tan(x) + cot(x)", "derivative of sin(x) + cos(x)"
    const calculusMatch = sanitized.match(
      /^(?:differentiate|derivative(?:\s+of)?|diff|d\/dx)\s+(.+)$/i
    );
    if (calculusMatch) {
      const targetExpr = calculusMatch[1].trim();
      return {
        isMathematical: true,
        rawExpression: raw,
        normalizedSyntax: `d/dx(${targetExpr})`,
        functionExpression: targetExpr,
        mathType: 'calculus',
        parameters: { operation: 'derivative', target: targetExpr },
        isValid: true,
        intentHint: 'derive_formula',
      };
    }

    // Strip optional action verb like "plot ", "graph ", "draw ", "show ", "evaluate "
    const exprOnly = sanitized.replace(/^(?:plot|graph|draw|show|evaluate|simplify)\s+/i, '').trim();

    // 2. Fractions: 3/4, 7/3
    const fractionMatch = exprOnly.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (fractionMatch) {
      const num = parseInt(fractionMatch[1], 10);
      const den = parseInt(fractionMatch[2], 10);
      if (den === 0) {
        return this.invalid(raw, 'Division by zero is undefined.');
      }
      return {
        isMathematical: true,
        rawExpression: raw,
        normalizedSyntax: `${num}/${den}`,
        mathType: 'fraction',
        parameters: { numerator: num, denominator: den },
        isValid: true,
        intentHint: 'visualize_concept',
      };
    }

    // 3. Pythagorean theorem: a^2 + b^2 = c^2
    if (/a\^?2\s*\+\s*b\^?2\s*=\s*c\^?2/i.test(exprOnly)) {
      return {
        isMathematical: true,
        rawExpression: raw,
        normalizedSyntax: 'a^2 + b^2 = c^2',
        mathType: 'pythagorean',
        parameters: {},
        isValid: true,
        intentHint: 'prove_theorem',
      };
    }

    // 4. Binomial powers: (a + b)^2, (x - 3)^3
    if (/^\([\w\d]+\s*[+-]\s*[\w\d]+\)\s*\^?\d+$/.test(exprOnly) ||
        /^\([\w\d]+\s*[+-]\s*[\w\d]+\)$/.test(exprOnly)) {
      return {
        isMathematical: true,
        rawExpression: raw,
        normalizedSyntax: exprOnly,
        functionExpression: exprOnly,
        mathType: 'binomial',
        parameters: {},
        isValid: true,
        intentHint: 'derive_formula',
      };
    }

    // 5. Linear equation: y = 2x + 3, y = -3x + 5, 2x + 5, -4x + 1
    // Matches explicit "y = mx + b" OR standalone linear expression "2x + 5"
    const explicitLinearMatch = exprOnly.match(
      /^y\s*=\s*([-+]?\s*\d*\.?\d*)\s*\*?\s*x\s*([+-]\s*\d+\.?\d*)?$/i
    );
    const standaloneLinearMatch = exprOnly.match(
      /^([-+]?\s*\d*\.?\d*)\s*\*?\s*x\s*([+-]\s*\d+\.?\d*)$/i
    );
    const linearMatch = explicitLinearMatch || standaloneLinearMatch;

    if (linearMatch) {
      const mRaw = (linearMatch[1] || '1').replace(/\s/g, '');
      const bRaw = (linearMatch[2] || '0').replace(/\s/g, '');
      const m = mRaw === '' || mRaw === '+' ? 1 : mRaw === '-' ? -1 : parseFloat(mRaw);
      const b = parseFloat(bRaw) || 0;
      const cleanFunc = b >= 0 ? `${m}x + ${b}` : `${m}x - ${Math.abs(b)}`;
      return {
        isMathematical: true,
        rawExpression: raw,
        normalizedSyntax: `y = ${cleanFunc}`,
        functionExpression: cleanFunc,
        mathType: 'linear_equation',
        parameters: { slope: m, intercept: b },
        isValid: !isNaN(m) && !isNaN(b),
        intentHint: 'plot_function',
      };
    }

    // 6. Trigonometric Expressions & Identities
    // Detect expressions containing trigonometric functions (tan, cot, sin, cos, sec, csc)
    const containsTrig = TRIG_FUNCTIONS.some((fn) =>
      new RegExp(`\\b${fn}\\b|${fn}\\^|${fn}\\(`, 'i').test(exprOnly)
    );

    if (containsTrig) {
      const cleanExpr = exprOnly.replace(/^y\s*=\s*/i, '').replace(/^f\s*\(\s*x\s*\)\s*=\s*/i, '').trim();

      // Check for fundamental Pythagorean identity: sin^2(x) + cos^2(x) = 1
      const isSin2Cos2 =
        /sin\^2\s*\(\s*x\s*\)\s*\+\s*cos\^2\s*\(\s*x\s*\)/i.test(cleanExpr) ||
        /cos\^2\s*\(\s*x\s*\)\s*\+\s*sin\^2\s*\(\s*x\s*\)/i.test(cleanExpr);

      if (isSin2Cos2) {
        return {
          isMathematical: true,
          rawExpression: raw,
          normalizedSyntax: 'sin^2(x) + cos^2(x) = 1',
          functionExpression: 'sin^2(x) + cos^2(x)',
          mathType: 'trigonometric',
          parameters: {
            identity: 'Pythagorean Trigonometric Identity',
            simplified: '1',
            isConstantIdentity: true,
          },
          isValid: true,
          intentHint: 'derive_formula',
        };
      }

      // Check for sum of squared tangent and cotangent: tan^2(x) + cot^2(x)
      const isTan2Cot2 =
        /tan\^2\s*\(\s*x\s*\)\s*\+\s*cot\^2\s*\(\s*x\s*\)/i.test(cleanExpr) ||
        /cot\^2\s*\(\s*x\s*\)\s*\+\s*tan\^2\s*\(\s*x\s*\)/i.test(cleanExpr);

      if (isTan2Cot2) {
        return {
          isMathematical: true,
          rawExpression: raw,
          normalizedSyntax: 'f(x) = tan^2(x) + cot^2(x)',
          functionExpression: 'tan^2(x) + cot^2(x)',
          mathType: 'trigonometric',
          parameters: {
            identity: 'Sum of Squared Tangent and Cotangent',
            simplified: '4csc^2(2x) - 2',
            period: 'pi/2',
            minimumValue: 2,
            domainRestriction: 'x != n*pi/2',
          },
          isValid: true,
          intentHint: 'derive_formula',
        };
      }

      // General multi-term or single-term trigonometric expression
      return {
        isMathematical: true,
        rawExpression: raw,
        normalizedSyntax: `f(x) = ${cleanExpr}`,
        functionExpression: cleanExpr,
        mathType: 'trigonometric',
        parameters: { expression: cleanExpr },
        isValid: true,
        intentHint: 'plot_function',
      };
    }

    // 7. Polynomials & Quadratics: x^2 + 2x + 1, 3x^2 - 5x + 2, x^3 - x
    const isPolynomial =
      /[a-zA-Z]\^2/.test(exprOnly) ||
      /\bx\^3\b/.test(exprOnly) ||
      (/\bx\b/.test(exprOnly) && /[+\-]/.test(exprOnly) && !/[a-zA-Z]{2,}/.test(exprOnly));

    if (isPolynomial) {
      const cleanExpr = exprOnly.replace(/^y\s*=\s*/i, '').replace(/^f\s*\(\s*x\s*\)\s*=\s*/i, '').trim();
      return {
        isMathematical: true,
        rawExpression: raw,
        normalizedSyntax: `f(x) = ${cleanExpr}`,
        functionExpression: cleanExpr,
        mathType: 'polynomial',
        parameters: { expression: cleanExpr },
        isValid: true,
        intentHint: 'plot_function',
      };
    }

    // 8. General explicit function: y = ... or f(x) = ...
    if (/^(?:y|f\(x\))\s*=/i.test(exprOnly)) {
      const cleanExpr = exprOnly.replace(/^(?:y|f\(x\))\s*=\s*/i, '').trim();
      return {
        isMathematical: true,
        rawExpression: raw,
        normalizedSyntax: `y = ${cleanExpr}`,
        functionExpression: cleanExpr,
        mathType: 'system',
        parameters: { expression: cleanExpr },
        isValid: true,
        intentHint: 'plot_function',
      };
    }

    // Not recognized as mathematical expression
    return {
      isMathematical: false,
      rawExpression: raw,
      normalizedSyntax: '',
      parameters: {},
      isValid: false,
    };
  }

  /** Detect only — does not classify intent */
  public static isMathExpression(input: string): boolean {
    return this.normalize(input).isMathematical;
  }

  private static invalid(raw: string, reason: string): NormalizedMathExpression {
    return {
      isMathematical: false,
      rawExpression: raw,
      normalizedSyntax: '',
      parameters: {},
      isValid: false,
      validationError: reason,
    };
  }
}
