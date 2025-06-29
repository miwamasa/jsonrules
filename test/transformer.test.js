/**
 * Tests for Transformation Engine
 */

import { strict as assert } from 'assert';
import { test, describe } from 'node:test';
import { 
    transform, 
    extractValues, 
    createTransformer, 
    validateRules,
    parsePathWithOperation,
    aggregateOps
} from '../src/transformer.js';

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
            "price": 8.99
        }],
        "bicycle": {
            "color": "red",
            "price": 19.95
        }
    },
    "expensive": 10
};

describe('Transformer', () => {
    test('should parse path with operation', () => {
        const result1 = parsePathWithOperation('$.store.book[*].price.max()');
        assert.equal(result1.path, '$.store.book[*].price');
        assert.equal(result1.operation, 'max');
        
        const result2 = parsePathWithOperation('$.store.book[*].title');
        assert.equal(result2.path, '$.store.book[*].title');
        assert.equal(result2.operation, null);
    });

    test('should extract single values', () => {
        const color = extractValues(sampleData, '$.store.bicycle.color');
        assert.equal(color, 'red');
        
        const price = extractValues(sampleData, '$.store.bicycle.price');
        assert.equal(price, 19.95);
    });

    test('should extract array values with wildcard', () => {
        const prices = extractValues(sampleData, '$.store.book[*].price');
        assert.deepEqual(prices, [8.95, 12.99, 8.99]);
        
        const titles = extractValues(sampleData, '$.store.book[*].title');
        assert.deepEqual(titles, ['Sayings of the Century', 'Sword of Honour', 'Moby Dick']);
    });

    test('should apply aggregate operations', () => {
        const maxPrice = extractValues(sampleData, '$.store.book[*].price.max()');
        assert.equal(maxPrice, 12.99);
        
        const sumPrice = extractValues(sampleData, '$.store.book[*].price.sum()');
        assert.equal(sumPrice, 30.93);
        
        const avgPrice = extractValues(sampleData, '$.store.book[*].price.avg()');
        assert.equal(Math.round(avgPrice * 100) / 100, 10.31);
        
        const count = extractValues(sampleData, '$.store.book[*].title.count()');
        assert.equal(count, 3);
    });

    test('should perform basic transformation', () => {
        const rules = {
            "pathMappings": [{
                "source": "$.store.book[*].price",
                "target": "$.store.novel[*].cost"
            }, {
                "source": "$.store.book[*].title", 
                "target": "$.store.novel[*].bookTitle"
            }]
        };
        
        const result = transform(sampleData, rules);
        
        assert.equal(result.store.novel.length, 3);
        assert.equal(result.store.novel[0].cost, 8.95);
        assert.equal(result.store.novel[0].bookTitle, 'Sayings of the Century');
        assert.equal(result.store.novel[1].cost, 12.99);
        assert.equal(result.store.novel[1].bookTitle, 'Sword of Honour');
    });

    test('should perform aggregate transformation', () => {
        const rules = {
            "pathMappings": [{
                "source": "$.store.book[*].price.max()",
                "target": "$.storeSummary.maxPrice"
            }, {
                "source": "$.store.book[*].price.sum()",
                "target": "$.storeSummary.totalCostOfBooks"
            }]
        };
        
        const result = transform(sampleData, rules);
        
        assert.equal(result.storeSummary.maxPrice, 12.99);
        assert.equal(result.storeSummary.totalCostOfBooks, 30.93);
    });

    test('should create reusable transformer', () => {
        const rules = {
            "pathMappings": [{
                "source": "$.store.bicycle.color",
                "target": "$.info.bikeColor"  
            }]
        };
        
        const transformer = createTransformer(rules);
        const result = transformer(sampleData);
        
        assert.equal(result.info.bikeColor, 'red');
    });

    test('should validate rules correctly', () => {
        const validRules = {
            "pathMappings": [{
                "source": "$.a",
                "target": "$.b"
            }]
        };
        
        const invalidRules1 = {
            "pathMappings": "not an array"
        };
        
        const invalidRules2 = {
            "pathMappings": [{
                "source": "$.a"
                // missing target
            }]
        };
        
        assert.equal(validateRules(validRules), true);
        assert.equal(validateRules(invalidRules1), false);
        assert.equal(validateRules(invalidRules2), false);
    });

    test('should handle mixed transformations', () => {
        const rules = {
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
        
        const result = transform(sampleData, rules);
        
        assert.deepEqual(result.catalog.authors, ['Nigel Rees', 'Evelyn Waugh', 'Herman Melville']);
        assert.equal(result.catalog.stats.mostExpensive, 12.99);
        assert.equal(result.catalog.bicycles.color, 'red');
    });

    test('should handle empty arrays', () => {
        const emptyData = { "items": [] };
        const rules = {
            "pathMappings": [{
                "source": "$.items[*].name",
                "target": "$.results[*].title"
            }]
        };
        
        const result = transform(emptyData, rules);
        assert.deepEqual(result.results, []);
    });

    test('should throw error for invalid rules', () => {
        const invalidRules = { "not": "valid" };
        
        assert.throws(() => {
            transform(sampleData, invalidRules);
        }, /pathMappings must be an array/);
    });
});

describe('Aggregate Operations', () => {
    const testData = [1, 5, 3, 9, 2];
    
    test('should calculate max', () => {
        assert.equal(aggregateOps.max(testData), 9);
    });
    
    test('should calculate min', () => {
        assert.equal(aggregateOps.min(testData), 1);
    });
    
    test('should calculate sum', () => {
        assert.equal(aggregateOps.sum(testData), 20);
    });
    
    test('should calculate average', () => {
        assert.equal(aggregateOps.avg(testData), 4);
    });
    
    test('should count items', () => {
        assert.equal(aggregateOps.count(testData), 5);
    });
    
    test('should get first item', () => {
        assert.equal(aggregateOps.first(testData), 1);
    });
    
    test('should get last item', () => {
        assert.equal(aggregateOps.last(testData), 2);
    });
    
    test('should get unique items', () => {
        const duplicateData = [1, 2, 2, 3, 1];
        assert.deepEqual(aggregateOps.unique(duplicateData), [1, 2, 3]);
    });
});