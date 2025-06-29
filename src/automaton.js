/**
 * Tree Automaton for JSONPath processing with [*] wildcard support
 * Uses functional programming principles with immutable state transitions
 */

import _ from 'lodash';

/**
 * Represents a state in the tree automaton
 * @typedef {Object} AutomatonState
 * @property {string[]} pathSegments - Current path segments
 * @property {number} ruleIndex - Current position in the rule
 * @property {*} currentValue - Current JSON value being processed
 * @property {string[]} currentPath - Current path in the JSON structure
 */

/**
 * Tree Automaton for processing JSONPath expressions
 */
export class TreeAutomaton {
  constructor(jsonPathRule) {
    this.rule = this.parseJsonPath(jsonPathRule);
    this.isAcceptingState = this.isAcceptingState.bind(this);
    this.transition = this.transition.bind(this);
  }

  /**
   * Parse JSONPath into segments for automaton processing
   * @param {string} jsonPath - JSONPath expression
   * @returns {Array} Array of path segments
   */
  parseJsonPath(jsonPath) {
    // Remove leading $ and split by . while handling [*] and [index]
    const cleanPath = jsonPath.replace(/^\$\.?/, '');
    const segments = [];
    let current = '';
    let inBracket = false;
    
    for (let i = 0; i < cleanPath.length; i++) {
      const char = cleanPath[i];
      
      if (char === '[') {
        if (current) {
          segments.push({ type: 'property', value: current });
          current = '';
        }
        inBracket = true;
      } else if (char === ']') {
        if (current === '*') {
          segments.push({ type: 'wildcard' });
        } else if (!isNaN(current)) {
          segments.push({ type: 'index', value: parseInt(current) });
        }
        current = '';
        inBracket = false;
      } else if (char === '.' && !inBracket) {
        if (current) {
          segments.push({ type: 'property', value: current });
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    if (current) {
      segments.push({ type: 'property', value: current });
    }
    
    return segments;
  }

  /**
   * Check if current state is accepting (rule fully matched)
   * @param {AutomatonState} state - Current automaton state
   * @returns {boolean} True if state is accepting
   */
  isAcceptingState(state) {
    return state.ruleIndex >= this.rule.length;
  }

  /**
   * Perform state transition based on current rule segment
   * @param {AutomatonState} state - Current state
   * @param {*} jsonData - JSON data being processed
   * @returns {AutomatonState[]} Array of next states (for non-deterministic transitions)
   */
  transition(state, jsonData) {
    if (this.isAcceptingState(state)) {
      return [state];
    }

    const currentSegment = this.rule[state.ruleIndex];
    const nextStates = [];

    switch (currentSegment.type) {
      case 'property':
        nextStates.push(...this.handlePropertyTransition(state, jsonData, currentSegment.value));
        break;
      case 'wildcard':
        nextStates.push(...this.handleWildcardTransition(state, jsonData));
        break;
      case 'index':
        nextStates.push(...this.handleIndexTransition(state, jsonData, currentSegment.value));
        break;
    }

    return nextStates;
  }

  /**
   * Handle property access transition
   * @param {AutomatonState} state - Current state
   * @param {*} jsonData - JSON data
   * @param {string} property - Property name
   * @returns {AutomatonState[]} Next states
   */
  handlePropertyTransition(state, jsonData, property) {
    if (_.isObject(state.currentValue) && _.has(state.currentValue, property)) {
      return [{
        ...state,
        ruleIndex: state.ruleIndex + 1,
        currentValue: state.currentValue[property],
        currentPath: [...state.currentPath, property]
      }];
    }
    return [];
  }

  /**
   * Handle wildcard [*] transition - creates multiple states for array elements
   * @param {AutomatonState} state - Current state
   * @param {*} jsonData - JSON data
   * @returns {AutomatonState[]} Next states (one for each array element)
   */
  handleWildcardTransition(state, jsonData) {
    if (_.isArray(state.currentValue)) {
      return state.currentValue.map((item, index) => ({
        ...state,
        ruleIndex: state.ruleIndex + 1,
        currentValue: item,
        currentPath: [...state.currentPath, index]
      }));
    }
    return [];
  }

  /**
   * Handle specific index transition
   * @param {AutomatonState} state - Current state
   * @param {*} jsonData - JSON data
   * @param {number} index - Array index
   * @returns {AutomatonState[]} Next states
   */
  handleIndexTransition(state, jsonData, index) {
    if (_.isArray(state.currentValue) && index < state.currentValue.length) {
      return [{
        ...state,
        ruleIndex: state.ruleIndex + 1,
        currentValue: state.currentValue[index],
        currentPath: [...state.currentPath, index]
      }];
    }
    return [];
  }

  /**
   * Process JSON data through the automaton
   * @param {*} jsonData - Input JSON data
   * @returns {Array} Array of matching values and their paths
   */
  process(jsonData) {
    // Initialize with starting state
    let currentStates = [{
      ruleIndex: 0,
      currentValue: jsonData,
      currentPath: []
    }];

    // Process through all rule segments
    while (currentStates.length > 0) {
      const nextStates = [];
      
      for (const state of currentStates) {
        const transitions = this.transition(state, jsonData);
        nextStates.push(...transitions);
      }
      
      // Separate accepting states from continuing states
      const acceptingStates = nextStates.filter(this.isAcceptingState);
      const continuingStates = nextStates.filter(state => !this.isAcceptingState(state));
      
      // If we have accepting states, return results
      if (acceptingStates.length > 0) {
        return acceptingStates.map(state => ({
          value: state.currentValue,
          path: state.currentPath
        }));
      }
      
      currentStates = continuingStates;
    }

    return [];
  }
}

/**
 * Factory function to create tree automaton (functional approach)
 * @param {string} jsonPathRule - JSONPath rule
 * @returns {TreeAutomaton} New automaton instance
 */
export const createAutomaton = (jsonPathRule) => new TreeAutomaton(jsonPathRule);