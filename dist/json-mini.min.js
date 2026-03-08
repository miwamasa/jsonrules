(function (global) {
  'use strict';

  const aggregateOps = {
    max: (values) => values.length ? Math.max(...values) : undefined,
    min: (values) => values.length ? Math.min(...values) : undefined,
    sum: (values) => values.reduce((sum, value) => sum + Number(value || 0), 0),
    avg: (values) => values.length ? values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length : undefined,
    count: (values) => values.length,
    first: (values) => values[0],
    last: (values) => values[values.length - 1],
    unique: (values) => Array.from(new Set(values)),
    sort: (values) => [...values].sort(),
    reverse: (values) => [...values].reverse()
  };

  const parsePathWithOperation = (jsonPath) => {
    const operationMatch = jsonPath.match(/\.(\w+)\(\)$/);
    if (!operationMatch) return { path: jsonPath, operation: null };

    return {
      path: jsonPath.replace(/\.\w+\(\)$/, ''),
      operation: operationMatch[1]
    };
  };

  const parseJsonPath = (jsonPath) => {
    const cleanPath = jsonPath.replace(/^\$\.?/, '');
    const segments = [];
    let current = '';
    let inBracket = false;

    for (let i = 0; i < cleanPath.length; i += 1) {
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
        } else if (/^\d+$/.test(current)) {
          segments.push({ type: 'index', value: Number(current) });
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
  };

  const extractValues = (jsonData, jsonPath) => {
    const { path, operation } = parsePathWithOperation(jsonPath);
    const segments = parseJsonPath(path);
    let states = [{ value: jsonData, path: [] }];

    for (const segment of segments) {
      const nextStates = [];
      for (const state of states) {
        if (segment.type === 'property') {
          if (state.value && typeof state.value === 'object' && segment.value in state.value) {
            nextStates.push({ value: state.value[segment.value], path: [...state.path, segment.value] });
          }
        } else if (segment.type === 'wildcard') {
          if (Array.isArray(state.value)) {
            state.value.forEach((item, index) => {
              nextStates.push({ value: item, path: [...state.path, index] });
            });
          }
        } else if (segment.type === 'index') {
          if (Array.isArray(state.value) && segment.value < state.value.length) {
            nextStates.push({ value: state.value[segment.value], path: [...state.path, segment.value] });
          }
        }
      }
      states = nextStates;
      if (states.length === 0) break;
    }

    const values = states.map((state) => state.value);
    if (operation && aggregateOps[operation]) {
      return aggregateOps[operation](values);
    }

    return values.length === 1 ? values[0] : values;
  };

  const setValueAtPath = (target, targetPath, value) => {
    const cleanPath = targetPath
      .replace(/^\$\.?/, '')
      .replace(/\[(\d+)\]/g, '.$1')
      .replace(/\[([^\]]+)\]/g, '.$1');

    const parts = cleanPath.split('.').filter(Boolean);
    const result = structuredClone(target);
    let current = result;

    for (let i = 0; i < parts.length - 1; i += 1) {
      const part = parts[i];
      const nextPart = parts[i + 1];
      const isNextIndex = /^\d+$/.test(nextPart);

      if (!(part in current)) {
        current[part] = isNextIndex ? [] : {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
    return result;
  };

  const transformSingleRule = (sourceData, rule, accumulator) => {
    const extractedValue = extractValues(sourceData, rule.source);

    if (Array.isArray(extractedValue) && rule.target.includes('[*]')) {
      if (extractedValue.length === 0) {
        const wildcardIndex = rule.target.indexOf('[*]');
        const baseTarget = rule.target.substring(0, wildcardIndex);
        return setValueAtPath(accumulator, baseTarget, []);
      }

      return extractedValue.reduce((acc, item, index) => {
        const indexedTarget = rule.target.replace('[*]', `[${index}]`);
        return setValueAtPath(acc, indexedTarget, item);
      }, accumulator);
    }

    return setValueAtPath(accumulator, rule.target, extractedValue);
  };

  const validateRules = (rules) => {
    return !!rules
      && Array.isArray(rules.pathMappings)
      && rules.pathMappings.every((rule) => typeof rule.source === 'string' && typeof rule.target === 'string');
  };

  const transform = (sourceData, transformationRules) => {
    if (!validateRules(transformationRules)) {
      throw new Error('pathMappings must be an array of {source,target}');
    }

    return transformationRules.pathMappings.reduce(
      (accumulator, rule) => transformSingleRule(sourceData, rule, accumulator),
      {}
    );
  };

  const JsonMini = {
    version: '1.0.0',
    transform,
    extractValues,
    validateRules,
    aggregateOps
  };

  global.JsonMini = JsonMini;
})(typeof window !== 'undefined' ? window : globalThis);
