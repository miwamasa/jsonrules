# Theory of JSON Transformation in Functional JSONPath

## 1. Overview

This project models JSON transformation as a **mapping between paths in source and target trees**.
Instead of writing imperative loops, users declare a set of path mapping rules:

- `source`: a JSONPath-like selector over the input tree
- `target`: a JSONPath-like write location in the output tree

A transformation is the repeated application of these mappings under immutable update semantics.

---

## 2. JSON as a Tree

A JSON document is treated as a rooted, ordered tree:

- Object nodes: keyed children
- Array nodes: indexed children
- Primitive nodes: leaves

A path denotes a sequence of transitions from the root to a node.

Examples:

- `$.store.bicycle.color` = object-key transitions
- `$.store.book[1].title` = object + array-index transitions
- `$.store.book[*].price` = object + wildcard array transitions

---

## 3. Path Rule Language

The implemented rule language supports:

1. **Property transition**: `.name`
2. **Index transition**: `[n]`
3. **Wildcard transition**: `[*]`
4. **Terminal aggregate operator**: `.max()`, `.sum()`, `.avg()`, etc.

A source expression is parsed into:

- a structural path (for node extraction)
- an optional terminal reduction operator (for aggregation)

---

## 4. Tree Automaton Semantics

### 4.1 Automaton state

A processing state can be represented as:

- `ruleIndex`: current segment index in parsed path rule
- `currentValue`: current node/subtree value in JSON
- `currentPath`: concrete path traversed so far

### 4.2 Transition relation

Given the current segment type:

- **property(k)**: move if key `k` exists on current object
- **index(i)**: move if current node is an array and `i` is in range
- **wildcard**: branch to all array elements

Wildcard introduces **non-deterministic branching** (multiple next states).

### 4.3 Acceptance

A state is accepting when all path segments are consumed.
Accepted states yield extraction results `(value, path)`.

This is a practical tree-navigation automaton specialized for JSONPath-like traversal.

---

## 5. Extraction and Aggregation

For a source path:

1. Run automaton traversal to collect matched values
2. If no aggregate operator is attached, return matched value(s)
3. If aggregate operator is attached, reduce matched values

Supported reduction family includes:

- extrema: `max`, `min`
- arithmetic: `sum`, `avg`
- cardinality: `count`
- positional: `first`, `last`
- set/order transforms: `unique`, `sort`, `reverse`

Conceptually, extraction = selection, aggregate = fold.

---

## 6. Transformation as Functional Folding

Let `R = [r1, r2, ..., rn]` be mapping rules.
The final output is produced via left fold:

`result = foldl(applyRule(sourceData), emptyObject, R)`

For each rule:

1. evaluate `source` to get extracted value(s)
2. write into `target` path in the accumulator
3. return a new accumulator (immutability)

This yields a deterministic output for fixed input and rule set.

---

## 7. Handling `[*]` in Targets

When extracted value is an array and target contains `[*]`:

- each extracted item is written to target with index substitution
- e.g. `$.out.items[*].name` becomes
  `$.out.items[0].name`, `$.out.items[1].name`, ...

For empty extracted arrays, the base wildcard container path is materialized as `[]`.

This preserves shape expectations of downstream consumers.

---

## 8. Correctness Intuition

At a high level, correctness follows from two invariants:

1. **Path soundness**: every extracted value corresponds to a valid traversal of the source path grammar.
2. **Write locality**: each rule affects only its target path projection in the accumulator.

Because updates are immutable and rule application is explicit in fold order,
transformation behavior remains explainable and debuggable.

---

## 9. Complexity Notes

Let:

- `m` = number of path segments
- `b` = branching factor induced by wildcards
- `n` = number of rules

Extraction is approximately proportional to traversed states, worst-case `O(b^m)` under dense wildcard branching.
Total transform cost scales with sum of extraction costs across all rules plus path-write costs.

In practical business JSON, wildcard depth is shallow, so runtime is typically near-linear in traversed nodes.

---

## 10. Why Functional Style Matters Here

Functional design (pure helpers + immutable updates + fold composition) gives:

- predictable behavior
- easy testability
- replayable debug traces
- composability (`createTransformer`, composed pipelines)

This is especially valuable for rule-driven data mapping, where maintainability is often more important than micro-optimizing a single traversal.
