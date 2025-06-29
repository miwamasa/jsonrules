# Functional JSONPath 2.0

A functional programming approach to JSON transformation using JSONPath rules with tree automata.

## Features

- **Tree Automaton Engine**: Uses formal tree automata to process `[*]` wildcards efficiently
- **Functional Programming**: Pure functions, immutability, and function composition
- **Aggregate Operations**: Built-in support for `max()`, `sum()`, `avg()`, `count()`, etc.
- **Type Safety**: Comprehensive validation and error handling
- **High Performance**: Optimized for large JSON structures

## Tree Automaton Approach for `[*]` Wildcards

The library uses a tree automaton to handle `[*]` wildcards by:

1. **Non-deterministic State Transitions**: When encountering `[*]`, the automaton creates parallel states for each array element
2. **Path Tracking**: Each state maintains its complete path context
3. **Parallel Processing**: All states are processed simultaneously 
4. **Result Aggregation**: Final results are collected from all accepting states

## Installation

```bash
npm install functional-jsonpath
```

## Usage

### Basic Transformation

```javascript
import { transform } from 'functional-jsonpath';

const rules = {
  "pathMappings": [{
    "source": "$.store.book[*].price", 
    "target": "$.store.novel[*].cost"
  }, {
    "source": "$.store.book[*].title",
    "target": "$.store.novel[*].bookTitle" 
  }]
};

const result = transform(sourceData, rules);
```

### Aggregate Operations

```javascript
const aggregateRules = {
  "pathMappings": [{
    "source": "$.store.book[*].price.max()",
    "target": "$.storeSummary.maxPrice"
  }, {
    "source": "$.store.book[*].price.sum()",
    "target": "$.storeSummary.totalCostOfBooks"
  }]
};
```

### Functional Approach

```javascript
import { createTransformer, composeTransformations } from 'functional-jsonpath';

// Create reusable transformers
const bookTransformer = createTransformer(bookRules);
const statsTransformer = createTransformer(statsRules);

// Compose multiple transformations
const composedTransformer = composeTransformations(
  bookTransformer,
  statsTransformer
);

const result = composedTransformer(data);
```

## Available Aggregate Operations

- `max()` - Maximum value
- `min()` - Minimum value  
- `sum()` - Sum of all values
- `avg()` - Average value
- `count()` - Count of items
- `first()` - First item
- `last()` - Last item
- `unique()` - Unique values only
- `sort()` - Sorted values
- `reverse()` - Reversed array

## API Reference

### Core Functions

- `transform(data, rules)` - Transform JSON data using rules
- `createTransformer(rules)` - Create reusable transformer function
- `extractValues(data, jsonPath)` - Extract values using JSONPath
- `composeTransformations(...fns)` - Compose multiple transformers

### Tree Automaton

- `TreeAutomaton(jsonPath)` - Create tree automaton for JSONPath
- `createAutomaton(jsonPath)` - Factory function for automaton

### Utilities

- `validateRules(rules)` - Validate transformation rules
- `debugTransform(data, rules)` - Debug transformation steps
- `pipe(...fns)` - Functional pipe utility
- `curry(fn)` - Curry function utility

## Example

See `src/example.js` for comprehensive examples demonstrating all features.

```bash
npm run dev  # Run examples
npm test     # Run test suite
```

## License

MIT
