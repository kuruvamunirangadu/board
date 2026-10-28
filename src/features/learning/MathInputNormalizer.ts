/**
 * VisiOS — Phase 2: Mathematical Input Normalizer
 * Safely recognizes and normalizes mathematical expressions WITHOUT eval().
 * Preserves original for display; produces structured parse result.
 */

import { NormalizedMathExpression, StudentIntent } from './InputIntelligenceTypes';

// Supported operators/characters allowed in math expressions
const SAFE_MATH_CHARS = /^[a-zA-Z0-9\s\+\-\*\/\^\=\(\)\.\,\[\]\/²³⁴⁵]+$/;

export class MathInputNormalizer {
  /**
   * Attempts to detect and normalize a mathematical expression.
   * Never uses eval() or executes student input as code.
   */
  public static normalize(raw: string): NormalizedMathExpression {
    const trimmed = raw.trim();

    if (!trimmed) {
      return this.invalid(raw, 'Empty expression.');
    }

    // Check for unsafe characters (injection guard)
    const sanitized = trimmed.replace(/[²³⁴⁵]/g, (c) => ({
      '²': '^2', '³': '^3', '⁴': '^4', '⁵': '^5',
    })[c] ?? c);

    if (!SAFE_MATH_CHARS.test(sanitized.replace(/\s+/g, ' '))) {
      return this.invalid(raw, 'Expression contains unsupported characters.');
    }

    // Detect malformed expressions: trailing operators or incomplete syntax
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
    if (openParens !== closeParens && (trimmed.includes('=') || trimmed.includes('+') || trimmed.includes('-') || trimmed.includes('^'))) {
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

    // Strip optional action verb like "plot ", "graph ", "draw ", "show " when analyzing expression
    const exprOnly = trimmed.replace(/^(?:plot|graph|draw|show)\s+/i, '').trim();

    // Linear function: y = 2x + 3, y=2*x+3, y = -3x + 5, y = 4x
    const linearMatch = exprOnly.match(
      /^y\s*=\s*([-+]?\s*\d*\.?\d*)\s*\*?\s*x\s*([+-]\s*\d+\.?\d*)?$/i
    );
    if (linearMatch) {
      const mRaw = (linearMatch[1] || '1').replace(/\s/g, '');
      const bRaw = (linearMatch[2] || '0').replace(/\s/g, '');
      const m = mRaw === '' || mRaw === '+' ? 1 : mRaw === '-' ? -1 : parseFloat(mRaw);
      const b = parseFloat(bRaw) || 0;
      return {
        isMathematical: true,
        rawExpression: raw,
        normalizedSyntax: `y = ${m}x + ${b}`,
        mathType: 'linear_equation',
        parameters: { slope: m, intercept: b },
        isValid: !isNaN(m) && !isNaN(b),
        validationError: (isNaN(m) || isNaN(b)) ? 'Could not parse slope or intercept.' : undefined,
        intentHint: 'plot_function',
      };
    }

    // Fraction: 3/4, 7/3
    const fractionMatch = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
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

    // Pythagorean: a^2 + b^2 = c^2
    if (/a\^?2\s*\+\s*b\^?2\s*=\s*c\^?2/i.test(trimmed)) {
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

    // Binomial: (a + b)^n, (a - b)^n, (x + 2)^2
    if (/^\([\w\d]+\s*[+-]\s*[\w\d]+\)\s*\^?\d+$/.test(trimmed) ||
        /^\([\w\d]+\s*[+-]\s*[\w\d]+\)$/.test(trimmed)) {
      return {
        isMathematical: true,
        rawExpression: raw,
        normalizedSyntax: trimmed.replace(/[²³⁴⁵]/g, (c) => ({
          '²': '^2', '³': '^3', '⁴': '^4', '⁵': '^5',
        })[c] ?? c),
        mathType: 'binomial',
        parameters: {},
        isValid: true,
        intentHint: 'derive_formula',
      };
    }

    // y = ... (other equations — treat as general mathematical, flag for plotting review)
    if (/^y\s*=/i.test(trimmed)) {
      return {
        isMathematical: true,
        rawExpression: raw,
        normalizedSyntax: trimmed,
        mathType: 'system',
        parameters: {},
        isValid: true,
        intentHint: 'plot_function',
      };
    }

    // Does not look mathematical
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
