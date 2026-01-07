/**
 * Formula Tokenizer
 * Converts a formula string into a stream of tokens
 */

import type { Token } from './types';

/** Arithmetic operators */
const OPERATORS = ['+', '-', '*', '/', '%'];

/** Two-character comparison operators */
const TWO_CHAR_COMPARATORS = ['<=', '>=', '==', '!='];

/** Two-character logic operators */
const TWO_CHAR_LOGIC = ['&&', '||'];

/**
 * Tokenize a formula string into an array of tokens
 * @param formula - The formula string to tokenize
 * @returns Array of tokens
 * @throws Error if unexpected character encountered
 */
export function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < formula.length) {
    const char = formula[pos];

    // Skip whitespace
    if (/\s/.test(char)) {
      pos++;
      continue;
    }

    // Numbers (including decimals)
    if (/\d/.test(char) || (char === '.' && pos + 1 < formula.length && /\d/.test(formula[pos + 1]))) {
      let numStr = '';
      const startPos = pos;
      while (pos < formula.length && /[\d.]/.test(formula[pos])) {
        numStr += formula[pos++];
      }
      tokens.push({
        type: 'NUMBER',
        value: parseFloat(numStr),
        position: startPos,
      });
      continue;
    }

    // Identifiers (variable names, function names)
    if (/[a-zA-Z_]/.test(char)) {
      let ident = '';
      const startPos = pos;
      while (pos < formula.length && /[a-zA-Z_0-9.]/.test(formula[pos])) {
        ident += formula[pos++];
      }
      tokens.push({
        type: 'IDENTIFIER',
        value: ident,
        position: startPos,
      });
      continue;
    }

    // Two-character operators (must check before single-char)
    const twoChar = formula.slice(pos, pos + 2);
    if (TWO_CHAR_COMPARATORS.includes(twoChar)) {
      tokens.push({
        type: 'COMPARATOR',
        value: twoChar,
        position: pos,
      });
      pos += 2;
      continue;
    }
    if (TWO_CHAR_LOGIC.includes(twoChar)) {
      tokens.push({
        type: 'LOGIC',
        value: twoChar,
        position: pos,
      });
      pos += 2;
      continue;
    }

    // Single-character arithmetic operators
    if (OPERATORS.includes(char)) {
      tokens.push({
        type: 'OPERATOR',
        value: char,
        position: pos++,
      });
      continue;
    }

    // Single-character comparison operators
    if (char === '<' || char === '>') {
      tokens.push({
        type: 'COMPARATOR',
        value: char,
        position: pos++,
      });
      continue;
    }

    // Unary NOT
    if (char === '!') {
      tokens.push({
        type: 'LOGIC',
        value: char,
        position: pos++,
      });
      continue;
    }

    // Parentheses
    if (char === '(') {
      tokens.push({
        type: 'LPAREN',
        value: char,
        position: pos++,
      });
      continue;
    }
    if (char === ')') {
      tokens.push({
        type: 'RPAREN',
        value: char,
        position: pos++,
      });
      continue;
    }

    // Comma (function argument separator)
    if (char === ',') {
      tokens.push({
        type: 'COMMA',
        value: char,
        position: pos++,
      });
      continue;
    }

    // Ternary operator
    if (char === '?') {
      tokens.push({
        type: 'TERNARY_Q',
        value: char,
        position: pos++,
      });
      continue;
    }
    if (char === ':') {
      tokens.push({
        type: 'TERNARY_COLON',
        value: char,
        position: pos++,
      });
      continue;
    }

    // Unknown character
    throw new Error(`Unexpected character '${char}' at position ${pos}`);
  }

  // Add EOF token
  tokens.push({
    type: 'EOF',
    value: '',
    position: pos,
  });

  return tokens;
}
