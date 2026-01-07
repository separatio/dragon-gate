/**
 * Formula Parser
 * Parses and evaluates mathematical expressions with variables
 *
 * Operator precedence (lowest to highest):
 * 1. Ternary (? :)
 * 2. Logical OR (||)
 * 3. Logical AND (&&)
 * 4. Comparison (==, !=, <, >, <=, >=)
 * 5. Addition/Subtraction (+, -)
 * 6. Multiplication/Division/Modulo (*, /, %)
 * 7. Unary (-, !)
 * 8. Primary (numbers, identifiers, function calls, parentheses)
 */

import type { Token, ASTNode, FormulaContext } from './types';
import { tokenize } from './Tokenizer';

/** Built-in functions available in formulas */
const BUILTIN_FUNCTIONS: Record<string, (...args: number[]) => number> = {
  min: (...args) => Math.min(...args),
  max: (...args) => Math.max(...args),
  floor: (x) => Math.floor(x),
  ceil: (x) => Math.ceil(x),
  round: (x) => Math.round(x),
  abs: (x) => Math.abs(x),
  sqrt: (x) => Math.sqrt(x),
  pow: (base, exp) => Math.pow(base, exp),
  clamp: (value, min, max) => Math.min(Math.max(value, min), max),
};

/**
 * Formula Parser class
 * Parses formula strings into AST and evaluates them
 */
export class FormulaParser {
  private tokens: Token[] = [];
  private pos = 0;

  /**
   * Compute the result of a formula string
   * @param formula - The formula string to evaluate
   * @param context - Variable values
   * @returns The computed numeric result
   */
  compute(formula: string, context: FormulaContext = {}): number {
    const ast = this.parse(formula);
    return this.evaluate(ast, context);
  }

  /**
   * Parse a formula string into an AST
   * @param formula - The formula string to parse
   * @returns The AST root node
   */
  parse(formula: string): ASTNode {
    this.tokens = tokenize(formula);
    this.pos = 0;
    const ast = this.parseTernary();
    this.expect('EOF');
    return ast;
  }

  /**
   * Validate a formula string without evaluating
   * @param formula - The formula string to validate
   * @returns Object with valid status and optional error message
   */
  validate(formula: string): { valid: boolean; error?: string } {
    try {
      this.parse(formula);
      return { valid: true };
    } catch (err) {
      return {
        valid: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all variable names used in a formula
   * @param formula - The formula string to analyze
   * @returns Array of variable names
   */
  getVariables(formula: string): string[] {
    const ast = this.parse(formula);
    const variables = new Set<string>();
    this.collectVariables(ast, variables);
    return Array.from(variables);
  }

  private collectVariables(node: ASTNode, variables: Set<string>): void {
    switch (node.type) {
      case 'Identifier':
        variables.add(node.name);
        break;
      case 'BinaryOp':
        this.collectVariables(node.left, variables);
        this.collectVariables(node.right, variables);
        break;
      case 'UnaryOp':
        this.collectVariables(node.operand, variables);
        break;
      case 'Ternary':
        this.collectVariables(node.condition, variables);
        this.collectVariables(node.ifTrue, variables);
        this.collectVariables(node.ifFalse, variables);
        break;
      case 'FunctionCall':
        for (const arg of node.args) {
          this.collectVariables(arg, variables);
        }
        break;
    }
  }

  private evaluate(node: ASTNode, context: FormulaContext): number {
    switch (node.type) {
      case 'Number':
        return node.value;

      case 'Identifier': {
        const value = this.resolveIdentifier(node.name, context);
        if (value === undefined) {
          throw new Error(`Unknown variable: ${node.name}`);
        }
        return value;
      }

      case 'BinaryOp': {
        const left = this.evaluate(node.left, context);
        const right = this.evaluate(node.right, context);
        return this.applyBinaryOp(node.operator, left, right);
      }

      case 'UnaryOp': {
        const operand = this.evaluate(node.operand, context);
        return this.applyUnaryOp(node.operator, operand);
      }

      case 'Ternary': {
        const condition = this.evaluate(node.condition, context);
        return condition ? this.evaluate(node.ifTrue, context) : this.evaluate(node.ifFalse, context);
      }

      case 'FunctionCall': {
        const func = BUILTIN_FUNCTIONS[node.name];
        if (!func) {
          throw new Error(`Unknown function: ${node.name}`);
        }
        const args = node.args.map((arg) => this.evaluate(arg, context));
        return func(...args);
      }
    }
  }

  private resolveIdentifier(name: string, context: FormulaContext): number | undefined {
    // Support dot notation (e.g., "attacker.str")
    const parts = name.split('.');
    let value: number | FormulaContext | undefined = context;

    for (const part of parts) {
      if (typeof value === 'object' && value !== null && part in value) {
        value = value[part] as number | FormulaContext;
      } else {
        return undefined;
      }
    }

    return typeof value === 'number' ? value : undefined;
  }

  private applyBinaryOp(op: string, left: number, right: number): number {
    switch (op) {
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '*':
        return left * right;
      case '/':
        if (right === 0) throw new Error('Division by zero');
        return left / right;
      case '%':
        if (right === 0) throw new Error('Modulo by zero');
        return left % right;
      case '<':
        return left < right ? 1 : 0;
      case '>':
        return left > right ? 1 : 0;
      case '<=':
        return left <= right ? 1 : 0;
      case '>=':
        return left >= right ? 1 : 0;
      case '==':
        return left === right ? 1 : 0;
      case '!=':
        return left !== right ? 1 : 0;
      case '&&':
        return left && right ? 1 : 0;
      case '||':
        return left || right ? 1 : 0;
      default:
        throw new Error(`Unknown operator: ${op}`);
    }
  }

  private applyUnaryOp(op: string, operand: number): number {
    switch (op) {
      case '-':
        return -operand;
      case '!':
        return operand ? 0 : 1;
      default:
        throw new Error(`Unknown unary operator: ${op}`);
    }
  }

  private current(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    return this.tokens[this.pos++];
  }

  private expect(type: string): Token {
    const token = this.current();
    if (token.type !== type) {
      throw new Error(`Expected ${type} but got ${token.type} at position ${token.position}`);
    }
    return this.advance();
  }

  private match(...types: string[]): boolean {
    return types.includes(this.current().type);
  }

  private matchValue(...values: (string | number)[]): boolean {
    return values.includes(this.current().value);
  }

  // Grammar rules (recursive descent)

  private parseTernary(): ASTNode {
    let node = this.parseLogicalOr();

    if (this.match('TERNARY_Q')) {
      this.advance();
      const ifTrue = this.parseTernary();
      this.expect('TERNARY_COLON');
      const ifFalse = this.parseTernary();
      node = { type: 'Ternary', condition: node, ifTrue, ifFalse };
    }

    return node;
  }

  private parseLogicalOr(): ASTNode {
    let node = this.parseLogicalAnd();

    while (this.match('LOGIC') && this.current().value === '||') {
      const op = this.advance().value as string;
      const right = this.parseLogicalAnd();
      node = { type: 'BinaryOp', operator: op, left: node, right };
    }

    return node;
  }

  private parseLogicalAnd(): ASTNode {
    let node = this.parseComparison();

    while (this.match('LOGIC') && this.current().value === '&&') {
      const op = this.advance().value as string;
      const right = this.parseComparison();
      node = { type: 'BinaryOp', operator: op, left: node, right };
    }

    return node;
  }

  private parseComparison(): ASTNode {
    let node = this.parseAdditive();

    while (this.match('COMPARATOR')) {
      const op = this.advance().value as string;
      const right = this.parseAdditive();
      node = { type: 'BinaryOp', operator: op, left: node, right };
    }

    return node;
  }

  private parseAdditive(): ASTNode {
    let node = this.parseMultiplicative();

    while (this.match('OPERATOR') && this.matchValue('+', '-')) {
      const op = this.advance().value as string;
      const right = this.parseMultiplicative();
      node = { type: 'BinaryOp', operator: op, left: node, right };
    }

    return node;
  }

  private parseMultiplicative(): ASTNode {
    let node = this.parseUnary();

    while (this.match('OPERATOR') && this.matchValue('*', '/', '%')) {
      const op = this.advance().value as string;
      const right = this.parseUnary();
      node = { type: 'BinaryOp', operator: op, left: node, right };
    }

    return node;
  }

  private parseUnary(): ASTNode {
    // Handle unary minus and logical NOT
    if (this.match('OPERATOR') && this.current().value === '-') {
      this.advance();
      const operand = this.parseUnary();
      return { type: 'UnaryOp', operator: '-', operand };
    }

    if (this.match('LOGIC') && this.current().value === '!') {
      this.advance();
      const operand = this.parseUnary();
      return { type: 'UnaryOp', operator: '!', operand };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    const token = this.current();

    // Number literal
    if (token.type === 'NUMBER') {
      this.advance();
      return { type: 'Number', value: token.value as number };
    }

    // Identifier or function call
    if (token.type === 'IDENTIFIER') {
      const name = token.value as string;
      this.advance();

      // Check for function call
      if (this.match('LPAREN')) {
        return this.parseFunctionCall(name);
      }

      return { type: 'Identifier', name };
    }

    // Parenthesized expression
    if (token.type === 'LPAREN') {
      this.advance();
      const node = this.parseTernary();
      this.expect('RPAREN');
      return node;
    }

    throw new Error(`Unexpected token ${token.type} at position ${token.position}`);
  }

  private parseFunctionCall(name: string): ASTNode {
    this.expect('LPAREN');
    const args: ASTNode[] = [];

    if (!this.match('RPAREN')) {
      args.push(this.parseTernary());
      while (this.match('COMMA')) {
        this.advance();
        args.push(this.parseTernary());
      }
    }

    this.expect('RPAREN');
    return { type: 'FunctionCall', name, args };
  }
}

/** Singleton instance for convenience */
export const formulaParser = new FormulaParser();
