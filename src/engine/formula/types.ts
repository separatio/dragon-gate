/**
 * Formula Parser Types
 * Types for tokenization and AST representation
 */

/** Token types produced by the tokenizer */
export type TokenType =
  | 'NUMBER'
  | 'IDENTIFIER'
  | 'OPERATOR'
  | 'COMPARATOR'
  | 'LOGIC'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'TERNARY_Q'
  | 'TERNARY_COLON'
  | 'EOF';

/** A single token from the formula string */
export interface Token {
  /** Type of token */
  type: TokenType;
  /** Token value (number for NUMBER, string for others) */
  value: string | number;
  /** Position in original string for error reporting */
  position: number;
}

/** AST node types */
export type ASTNode =
  | NumberNode
  | IdentifierNode
  | BinaryOpNode
  | UnaryOpNode
  | TernaryNode
  | FunctionCallNode;

/** Numeric literal node */
export interface NumberNode {
  type: 'Number';
  value: number;
}

/** Variable reference node */
export interface IdentifierNode {
  type: 'Identifier';
  name: string;
}

/** Binary operation node (+, -, *, /, comparisons, etc.) */
export interface BinaryOpNode {
  type: 'BinaryOp';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

/** Unary operation node (-, !) */
export interface UnaryOpNode {
  type: 'UnaryOp';
  operator: string;
  operand: ASTNode;
}

/** Ternary conditional node (condition ? ifTrue : ifFalse) */
export interface TernaryNode {
  type: 'Ternary';
  condition: ASTNode;
  ifTrue: ASTNode;
  ifFalse: ASTNode;
}

/** Function call node (min, max, floor, etc.) */
export interface FunctionCallNode {
  type: 'FunctionCall';
  name: string;
  args: ASTNode[];
}

/** Context object mapping variable names to numeric values or nested contexts */
export interface FormulaContext {
  [key: string]: number | FormulaContext;
}
