import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const ENDPOINT = 'https://mcp.desearch.ai/mcp';

export function validateQuery(query) {
    if (typeof query !== 'string' || !query.trim() || query.trim().length > 2000) {
        throw new Error('Enter a search query of 1 to 2000 characters.');
    }
    return query.trim();
}

export function parseResults(reply) {
    if (reply.isError) throw new Error('Desearch could not complete this search. Check your key and balance.');
    let data = reply.structuredContent;
    if (!data) {
        const text = reply.content?.find(item => item.type === 'text')?.text;
        try { data = JSON.parse(text); } catch { throw new Error('Desearch returned an unreadable result.'); }
    }
    if (!Array.isArray(data?.results)) throw new Error('Desearch returned an unreadable result.');
    const results = [];
    for (const item of data.results.slice(0, 100)) {
        if (typeof item?.title !== 'string' || !item.title.trim() || typeof item.url !== 'string') continue;
        let url;
        try { url = new URL(item.url); } catch { continue; }
        if (url.protocol !== 'https:' || url.username || url.password) continue;
        results.push({ title: item.title.slice(0, 500), url: url.href });
    }
    return { results };
}

async function openClient(key) {
    const client = new Client({ name: 'desearch-sillytavern', version: '0.1.0' });
    const transport = new StreamableHTTPClientTransport(new URL(ENDPOINT), {
        requestInit: { headers: { 'x-api-key': key }, credentials: 'omit', redirect: 'error' },
    });
    try {
        await client.connect(transport, { timeout: 30000 });
        return client;
    } catch {
        await client.close().catch(() => {});
        throw new Error('Cannot connect to Desearch. Check your key and connection.');
    }
}

// Both the settings panel and registered host tool use this same MCP-only path.
export function createSearcher(getKey, connect = openClient) {
    return async ({ query } = {}) => {
        query = validateQuery(query);
        const key = getKey();
        if (!key) throw new Error('Enter a Desearch API key in Extensions > Desearch first.');
        let client;
        try {
            client = await connect(key);
            const reply = await client.callTool({ name: 'search', arguments: { query } }, undefined, { timeout: 60000 });
            const data = parseResults(reply);
            // Never propagate a credential echoed by a remote service into chat or UI.
            return JSON.stringify(data).split(key).join('[redacted]');
        } catch {
            throw new Error('Desearch search failed. Check your key, balance and connection, then retry.');
        } finally {
            if (client) await client.close().catch(() => {});
        }
    };
}
