# Functional JSONPath 2.0

A functional programming approach to JSON transformation using JSONPath rules with tree automata.

## Features

- **Tree Automaton Engine**: Uses formal tree automata to process `[*]` wildcards efficiently
- **Functional Programming**: Pure functions, immutability, and function composition
- **Aggregate Operations**: Built-in support for `max()`, `sum()`, `avg()`, `count()`, etc.
- **Type Safety**: Comprehensive validation and error handling
- **High Performance**: Optimized for large JSON structures
- **Browser Mini Runtime**: Includes `json-mini` for quick browser usage

## Tree Automaton Approach for `[*]` Wildcards

The library uses a tree automaton to handle `[*]` wildcards by:

1. **Non-deterministic State Transitions**: When encountering `[*]`, the automaton creates parallel states for each array element
2. **Path Tracking**: Each state maintains its complete path context
3. **Parallel Processing**: All states are processed simultaneously
4. **Result Aggregation**: Final results are collected from all accepting states

## 実行環境 (Runtime)

- Node.js 18+
- npm 9+
- Browser demo: Any modern browser with `structuredClone` support

## Installation

### Node.js library

```bash
npm install
```

### Build browser `json-mini`

```bash
npm run build:browser
```

This generates `dist/json-mini.min.js`.

## Usage

### Basic Transformation (Node.js)

```javascript
import { transform } from 'functional-jsonpath';

const rules = {
  pathMappings: [{
    source: '$.store.book[*].price',
    target: '$.store.novel[*].cost'
  }, {
    source: '$.store.book[*].title',
    target: '$.store.novel[*].bookTitle'
  }]
};

const result = transform(sourceData, rules);
```

### Browser usage with `json-mini`

```html
<script src="./dist/json-mini.min.js"></script>
<script>
  const result = JsonMini.transform(sourceData, rules);
  console.log(result);
</script>
```

### Local demo HTML

```bash
python3 -m http.server 8080
# open http://localhost:8080/examples/json-mini-demo.html
```

## Install/Deliver `json-mini` to another project

1. Clone this repository and build:
   ```bash
   npm install
   npm run build:browser
   ```
2. Copy `dist/json-mini.min.js` to your web project.
3. Reference it from HTML:
   ```html
   <script src="./vendor/json-mini.min.js"></script>
   ```
4. Use `JsonMini.transform(...)`.

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

## Example files

- Node examples: `src/example.js`
- Browser example: `examples/json-mini-demo.html`

```bash
npm run dev  # Run Node examples
npm run build:browser
npm test     # Run test suite
```

## License

MIT
