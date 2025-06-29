/**
 * Example usage of Functional JSONPath transformation engine
 */

import { transform, createTransformer, debugTransform, extractValues } from './index.js';

// Sample data from the specification
const sampleData = {
    "store": {
        "book": [{
            "category": "reference",
            "author": "Nigel Rees",
            "title": "Sayings of the Century",
            "price": 8.95
        }, {
            "category": "fiction",
            "author": "Evelyn Waugh",
            "title": "Sword of Honour",
            "price": 12.99
        }, {
            "category": "fiction",
            "author": "Herman Melville",
            "title": "Moby Dick",
            "isbn": "0-553-21311-3",
            "price": 8.99
        }, {
            "category": "fiction",
            "author": "J. R. R. Tolkien",
            "title": "The Lord of the Rings",
            "isbn": "0-395-19395-8",
            "price": 22.99
        }],
        "bicycle": {
            "color": "red",
            "price": 19.95
        }
    },
    "expensive": 10
};

// Basic transformation rules with [*] wildcards
const basicRules = {
    "pathMappings": [{
        "source": "$.store.book[*].price",
        "target": "$.store.novel[*].cost"
    }, {
        "source": "$.store.book[*].title",
        "target": "$.store.novel[*].bookTitle"
    }]
};

// Aggregate operation rules
const aggregateRules = {
    "pathMappings": [{
        "source": "$.store.book[*].price.max()",
        "target": "$.storeSummary.maxPrice"
    }, {
        "source": "$.store.book[*].price.sum()",
        "target": "$.storeSummary.totalCostOfBooks"
    }, {
        "source": "$.store.book[*].price.avg()",
        "target": "$.storeSummary.averagePrice"
    }, {
        "source": "$.store.book[*].title.count()",
        "target": "$.storeSummary.bookCount"
    }]
};

// Mixed transformation rules
const mixedRules = {
    "pathMappings": [{
        "source": "$.store.book[*].author",
        "target": "$.catalog.authors[*]"
    }, {
        "source": "$.store.book[*].price.max()",
        "target": "$.catalog.stats.mostExpensive"
    }, {
        "source": "$.store.bicycle.color",
        "target": "$.catalog.bicycles.color"
    }]
};

console.log('=== Functional JSONPath Transformation Examples ===\n');

// Example 1: Basic transformation with [*] wildcards
console.log('1. Basic Transformation with [*] Wildcards:');
console.log('Input Data:', JSON.stringify(sampleData, null, 2));
console.log('\nTransformation Rules:', JSON.stringify(basicRules, null, 2));

const basicResult = transform(sampleData, basicRules);
console.log('\nTransformed Result:', JSON.stringify(basicResult, null, 2));

console.log('\n' + '='.repeat(50) + '\n');

// Example 2: Aggregate operations
console.log('2. Aggregate Operations:');
console.log('Rules:', JSON.stringify(aggregateRules, null, 2));

const aggregateResult = transform(sampleData, aggregateRules);
console.log('\nAggregate Result:', JSON.stringify(aggregateResult, null, 2));

console.log('\n' + '='.repeat(50) + '\n');

// Example 3: Mixed transformations
console.log('3. Mixed Transformations:');
console.log('Rules:', JSON.stringify(mixedRules, null, 2));

const mixedResult = transform(sampleData, mixedRules);
console.log('\nMixed Result:', JSON.stringify(mixedResult, null, 2));

console.log('\n' + '='.repeat(50) + '\n');

// Example 4: Functional approach with reusable transformers
console.log('4. Functional Approach - Reusable Transformers:');

const bookToNovelTransformer = createTransformer(basicRules);
const statsTransformer = createTransformer(aggregateRules);

console.log('Book to Novel transformation:');
console.log(JSON.stringify(bookToNovelTransformer(sampleData), null, 2));

console.log('\nStats transformation:');
console.log(JSON.stringify(statsTransformer(sampleData), null, 2));

console.log('\n' + '='.repeat(50) + '\n');

// Example 5: Direct value extraction
console.log('5. Direct Value Extraction:');

console.log('All book prices:', extractValues(sampleData, '$.store.book[*].price'));
console.log('Maximum price:', extractValues(sampleData, '$.store.book[*].price.max()'));
console.log('All titles:', extractValues(sampleData, '$.store.book[*].title'));
console.log('First book title:', extractValues(sampleData, '$.store.book[*].title.first()'));

console.log('\n' + '='.repeat(50) + '\n');

// Example 6: Debug transformation
console.log('6. Debug Transformation:');

const debugInfo = debugTransform(sampleData, basicRules);
console.log('Debug Steps:');
debugInfo.steps.forEach((step, index) => {
    console.log(`Step ${index + 1}:`);
    console.log(`  Rule: ${step.rule.source} -> ${step.rule.target}`);
    console.log(`  Extracted Value:`, step.extractedValue);
    console.log(`  Result After Step:`, JSON.stringify(step.newResult, null, 2));
    console.log();
});

console.log('\n' + '='.repeat(50) + '\n');

// Example 7: Tree Automaton in action
console.log('7. Tree Automaton Details:');

import { createAutomaton } from './index.js';

const automaton = createAutomaton('$.store.book[*].price');
const automatonResults = automaton.process(sampleData);

console.log('Automaton Results:');
automatonResults.forEach((result, index) => {
    console.log(`  Match ${index + 1}: Value=${result.value}, Path=[${result.path.join(', ')}]`);
});

console.log('\n=== End of Examples ===');