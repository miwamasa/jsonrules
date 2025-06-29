/**
 * Functional JSONPath - Main Entry Point
 * A functional programming approach to JSON transformation using JSONPath rules
 */

import { 
  transform, 
  createTransformer, 
  composeTransformations,
  extractValues,
  validateRules,
  debugTransform,
  aggregateOps 
} from './transformer.js';

import { 
  TreeAutomaton, 
  createAutomaton 
} from './automaton.js';

// Re-export everything
export { 
  transform, 
  createTransformer, 
  composeTransformations,
  extractValues,
  validateRules,
  debugTransform,
  aggregateOps,
  TreeAutomaton, 
  createAutomaton
};

// Functional utilities for common operations
export const pipe = (...fns) => (value) => fns.reduce((acc, fn) => fn(acc), value);
export const curry = (fn) => (...args) => args.length >= fn.length 
  ? fn(...args) 
  : (...newArgs) => curry(fn)(...args, ...newArgs);

// Default export for convenience
export default {
  transform,
  createTransformer,
  composeTransformations,
  extractValues,
  validateRules,
  debugTransform,
  aggregateOps,
  TreeAutomaton,
  createAutomaton,
  pipe,
  curry
};