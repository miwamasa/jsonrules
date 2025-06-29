/**
 * Functional JSON Transformation Engine
 * Uses tree automata and functional programming principles
 */

import _ from 'lodash';
import { createAutomaton } from './automaton.js';

/**
 * Aggregate operations for JSONPath expressions
 */
export const aggregateOps = {
  max: (values) => _.max(values),
  min: (values) => _.min(values),
  sum: (values) => _.sum(values),
  avg: (values) => _.mean(values),
  count: (values) => values.length,
  first: (values) => _.first(values),
  last: (values) => _.last(values),
  unique: (values) => _.uniq(values),
  sort: (values) => _.sortBy(values),
  reverse: (values) => _.reverse([...values])
};

/**
 * Parse JSONPath with aggregate operations
 * @param {string} jsonPath - JSONPath with possible aggregate operation
 * @returns {Object} Parsed path and operation
 */
export const parsePathWithOperation = (jsonPath) => {
  const operationMatch = jsonPath.match(/\.(\w+)\(\)$/);
  
  if (operationMatch) {
    const operation = operationMatch[1];
    const cleanPath = jsonPath.replace(/\.\w+\(\)$/, '');
    return { path: cleanPath, operation };
  }
  
  return { path: jsonPath, operation: null };
};

/**
 * Extract values from JSON using JSONPath with tree automaton
 * @param {*} jsonData - Source JSON data
 * @param {string} jsonPath - JSONPath expression
 * @returns {Array|*} Extracted values or single value
 */
export const extractValues = (jsonData, jsonPath) => {
  const { path, operation } = parsePathWithOperation(jsonPath);
  const automaton = createAutomaton(path);
  const results = automaton.process(jsonData);
  
  const values = results.map(result => result.value);
  
  if (operation && aggregateOps[operation]) {
    return aggregateOps[operation](values);
  }
  
  return values.length === 1 ? values[0] : values;
};

/**
 * Set value at JSONPath in target object (immutable)
 * @param {Object} target - Target object
 * @param {string} targetPath - JSONPath for target
 * @param {*} value - Value to set
 * @returns {Object} New object with value set
 */
export const setValueAtPath = (target, targetPath, value) => {
  // Convert JSONPath to lodash path format
  const lodashPath = targetPath
    .replace(/^\$\.?/, '')  // Remove leading $
    .replace(/\[(\d+)\]/g, '.$1')  // Convert [0] to .0
    .replace(/\[([^\]]+)\]/g, '.$1');  // Convert [key] to .key
  
  return _.set(_.cloneDeep(target), lodashPath, value);
};

/**
 * Transform single mapping rule
 * @param {*} sourceData - Source JSON data
 * @param {Object} rule - Transformation rule { source, target }
 * @param {Object} accumulator - Current result accumulator
 * @returns {Object} Updated accumulator
 */
export const transformSingleRule = (sourceData, rule, accumulator = {}) => {
  const { source, target } = rule;
  const extractedValue = extractValues(sourceData, source);
  
  // Handle array expansion for [*] wildcards
  if (_.isArray(extractedValue) && target.includes('[*]')) {
    // Handle empty arrays by setting empty array at target
    if (extractedValue.length === 0) {
      // Find the path up to [*] to set as empty array
      const wildcardIndex = target.indexOf('[*]');
      const baseTarget = target.substring(0, wildcardIndex);
      return setValueAtPath(accumulator, baseTarget, []);
    }
    
    return _.reduce(extractedValue, (acc, item, index) => {
      const indexedTarget = target.replace('[*]', `[${index}]`);
      return setValueAtPath(acc, indexedTarget, item);
    }, accumulator);
  }
  
  return setValueAtPath(accumulator, target, extractedValue);
};

/**
 * Main transformation function using functional composition
 * @param {*} sourceData - Source JSON data
 * @param {Object} transformationRules - Rules object with pathMappings
 * @returns {Object} Transformed JSON data
 */
export const transform = (sourceData, transformationRules) => {
  const { pathMappings } = transformationRules;
  
  if (!_.isArray(pathMappings)) {
    throw new Error('pathMappings must be an array');
  }
  
  // Use functional reduce to apply all transformations
  return _.reduce(
    pathMappings,
    (result, rule) => transformSingleRule(sourceData, rule, result),
    {}
  );
};

/**
 * Compose multiple transformations (functional composition)
 * @param {...Function} transformFunctions - Transformation functions
 * @returns {Function} Composed transformation function
 */
export const composeTransformations = (...transformFunctions) => {
  return (data) => _.reduceRight(
    transformFunctions,
    (result, fn) => fn(result),
    data
  );
};

/**
 * Create a reusable transformation function
 * @param {Object} rules - Transformation rules
 * @returns {Function} Transformation function
 */
export const createTransformer = (rules) => {
  return (data) => transform(data, rules);
};

/**
 * Validate transformation rules
 * @param {Object} rules - Rules to validate
 * @returns {boolean} True if valid
 */
export const validateRules = (rules) => {
  if (!_.isObject(rules) || !_.isArray(rules.pathMappings)) {
    return false;
  }
  
  return _.every(rules.pathMappings, rule => 
    _.isString(rule.source) && _.isString(rule.target)
  );
};

/**
 * Debug helper to trace transformation steps
 * @param {*} sourceData - Source data
 * @param {Object} rules - Transformation rules
 * @returns {Object} Debug information
 */
export const debugTransform = (sourceData, rules) => {
  const steps = [];
  const { pathMappings } = rules;
  
  let currentResult = {};
  
  for (const rule of pathMappings) {
    const extractedValue = extractValues(sourceData, rule.source);
    const previousResult = _.cloneDeep(currentResult);
    
    currentResult = transformSingleRule(sourceData, rule, currentResult);
    
    steps.push({
      rule,
      extractedValue,
      previousResult,
      newResult: _.cloneDeep(currentResult)
    });
  }
  
  return {
    finalResult: currentResult,
    steps
  };
};