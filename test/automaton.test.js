/**
 * Tests for Tree Automaton
 */

import { strict as assert } from 'assert';
import { test, describe } from 'node:test';
import { TreeAutomaton, createAutomaton } from '../src/automaton.js';

const sampleData = {
    "store": {
        "book": [{
            "title": "Book 1",
            "price": 10.95,
            "author": "Author 1"
        }, {
            "title": "Book 2", 
            "price": 15.99,
            "author": "Author 2"
        }],
        "bicycle": {
            "color": "red",
            "price": 19.95
        }
    }
};

describe('TreeAutomaton', () => {
    test('should parse simple JSONPath', () => {
        const automaton = new TreeAutomaton('$.store.bicycle.color');
        const expected = [
            { type: 'property', value: 'store' },
            { type: 'property', value: 'bicycle' },
            { type: 'property', value: 'color' }
        ];
        assert.deepEqual(automaton.rule, expected);
    });

    test('should parse JSONPath with wildcard', () => {
        const automaton = new TreeAutomaton('$.store.book[*].title');
        const expected = [
            { type: 'property', value: 'store' },
            { type: 'property', value: 'book' },
            { type: 'wildcard' },
            { type: 'property', value: 'title' }
        ];
        assert.deepEqual(automaton.rule, expected);
    });

    test('should parse JSONPath with index', () => {
        const automaton = new TreeAutomaton('$.store.book[0].title');
        const expected = [
            { type: 'property', value: 'store' },
            { type: 'property', value: 'book' },
            { type: 'index', value: 0 },
            { type: 'property', value: 'title' }
        ];
        assert.deepEqual(automaton.rule, expected);
    });

    test('should process simple property access', () => {
        const automaton = createAutomaton('$.store.bicycle.color');
        const results = automaton.process(sampleData);
        
        assert.equal(results.length, 1);
        assert.equal(results[0].value, 'red');
        assert.deepEqual(results[0].path, ['store', 'bicycle', 'color']);
    });

    test('should process wildcard array access', () => {
        const automaton = createAutomaton('$.store.book[*].title');
        const results = automaton.process(sampleData);
        
        assert.equal(results.length, 2);
        assert.equal(results[0].value, 'Book 1');
        assert.equal(results[1].value, 'Book 2');
        assert.deepEqual(results[0].path, ['store', 'book', 0, 'title']);
        assert.deepEqual(results[1].path, ['store', 'book', 1, 'title']);
    });

    test('should process specific index access', () => {
        const automaton = createAutomaton('$.store.book[1].author');
        const results = automaton.process(sampleData);
        
        assert.equal(results.length, 1);
        assert.equal(results[0].value, 'Author 2');
        assert.deepEqual(results[0].path, ['store', 'book', 1, 'author']);
    });

    test('should return empty array for non-existent path', () => {
        const automaton = createAutomaton('$.store.nonexistent.property');
        const results = automaton.process(sampleData);
        
        assert.equal(results.length, 0);
    });

    test('should return empty array for out-of-bounds index', () => {
        const automaton = createAutomaton('$.store.book[5].title');
        const results = automaton.process(sampleData);
        
        assert.equal(results.length, 0);
    });

    test('should handle nested wildcards', () => {
        const nestedData = {
            "categories": [{
                "items": [{"name": "item1"}, {"name": "item2"}]
            }, {
                "items": [{"name": "item3"}]
            }]
        };
        
        const automaton = createAutomaton('$.categories[*].items[*].name');
        const results = automaton.process(nestedData);
        
        assert.equal(results.length, 3);
        assert.equal(results[0].value, 'item1');
        assert.equal(results[1].value, 'item2');
        assert.equal(results[2].value, 'item3');
    });
});