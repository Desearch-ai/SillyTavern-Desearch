import test from 'node:test';
import assert from 'node:assert/strict';
import { createSearcher, parseResults, validateQuery } from '../search.js';

test('query bounds and missing keys are enforced before network use', async () => {
    for (const query of [undefined, null, 123, '', '   ', 'x'.repeat(2001)]) {
        assert.throws(() => validateQuery(query), /1 to 2000/);
    }
    assert.equal(validateQuery(` ${'x'.repeat(2000)} `).length, 2000);
    let calls = 0;
    const search = createSearcher(() => '', () => { calls++; });
    await assert.rejects(search({ query: 'telescope' }), /API key/);
    assert.equal(calls, 0);
});

test('structured results allow only titled HTTPS sources without credentials', () => {
    const data = parseResults({ structuredContent: { results: [
        { title: 'Valid <script>text</script>', url: 'https://example.org/path' },
        { title: 'Insecure', url: 'http://example.org' },
        { title: 'Script', url: 'javascript:alert(1)' },
        { title: 'Credential URL', url: 'https://user:password@example.org' },
        { title: '', url: 'https://example.org' },
        { title: 'Broken', url: 'not a URL' },
        null,
    ] } });
    assert.deepEqual(data, { results: [{ title: 'Valid <script>text</script>', url: 'https://example.org/path' }] });
});

test('text MCP payloads, empty results, malformed data and server errors', () => {
    assert.deepEqual(parseResults({ content: [{ type: 'text', text: '{"results":[]}' }] }), { results: [] });
    for (const reply of [{}, { content: [{ type: 'text', text: '<html>' }] }, { structuredContent: { data: [] } }, { isError: true }]) {
        assert.throws(() => parseResults(reply));
    }
});

test('thin wrapper calls only MCP search with trimmed query and closes connection', async () => {
    let closed = false;
    const search = createSearcher(() => 'test-only-value', async key => {
        assert.equal(key, 'test-only-value');
        return {
            callTool: async (call, schema, options) => {
                assert.deepEqual(call, { name: 'search', arguments: { query: 'space telescope' } });
                assert.equal(options.timeout, 60000);
                return { structuredContent: { results: [{ title: 'NASA', url: 'https://science.nasa.gov/' }] } };
            },
            close: async () => { closed = true; },
        };
    });
    assert.equal(JSON.parse(await search({ query: ' space telescope ' })).results[0].title, 'NASA');
    assert.equal(closed, true);
});

test('invalid-key errors never propagate service body or secret; cleanup runs', async () => {
    let closed = false;
    const search = createSearcher(() => 'test-only-value', async () => ({
        callTool: async () => { throw new Error('Authorization failed: test-only-value <html>'); },
        close: async () => { closed = true; },
    }));
    await assert.rejects(search({ query: 'space' }), error => !error.message.includes('test-only-value') && !error.message.includes('<html>'));
    assert.equal(closed, true);
    const connectFailure = createSearcher(() => 'test-only-value', async () => { throw new Error('test-only-value'); });
    await assert.rejects(connectFailure({ query: 'space' }), /Desearch search failed/);
});

test('credential echo is removed from results', async () => {
    const search = createSearcher(() => 'test-only-value', async () => ({
        callTool: async () => ({ structuredContent: { results: [{ title: 'test-only-value', url: 'https://example.org/' }] } }),
        close: async () => {},
    }));
    assert.equal((await search({ query: 'space' })).includes('test-only-value'), false);
});
