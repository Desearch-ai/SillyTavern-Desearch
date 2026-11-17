# Desearch for SillyTavern

A libre UI extension that searches the web through the existing [Desearch MCP server](https://github.com/Desearch-ai/mcp-desearch). Returns page titles and HTTPS sources, using the MCP `search` tool. No server plugin is required.

## Install

Requires SillyTavern 1.19.0 or later and a Desearch API key from [the Desearch console](https://console.desearch.ai/api-keys). Requests use your Desearch balance; see [current pricing](https://desearch.ai/pricing).

In SillyTavern, open **Extensions > Install extension** and enter:

```text
https://github.com/Desearch-ai/SillyTavern-Desearch
```

Alternatively, clone this repository and copy `manifest.json`, the prebuilt `index.js`, `LICENSE`, and `THIRD_PARTY_NOTICES.md` into a new folder:

```text
<SillyTavern>/public/scripts/extensions/third-party/desearch/
```

Restart SillyTavern and reload the page. Open **Extensions > Desearch** and enter the API key. The key is held only in this page's memory and password input. It is never saved in extension settings, browser storage, chat, or server files. Reloading clears it. Use **Clear key** to clear it sooner. Other browser extensions and scripts running on the same page share that browser security context.

The extension sends the search query and the key directly from the browser to `https://mcp.desearch.ai/mcp` over HTTPS, with the key in the `x-api-key` header. It does not send chat history. Network errors, invalid keys and server errors produce a fixed error message without the service response body. No alternative endpoint or proxy is configured.

## Search

Enter a query in the extension panel and select **Search with Desearch**. For example:

- `James Webb telescope discoveries`
- `SillyTavern extension development documentation`

The panel displays clickable source titles. Empty searches are rejected locally; queries are limited to 2000 characters. Sources with non-HTTPS URLs or URL credentials are omitted. Source titles are rendered as text.

For model-initiated searches, use a tool-capable Chat Completion model and enable **Enable function calling** in AI Response Configuration. The registered function is `desearch_search` with a required string `query`. It is offered to the model only while a key is present. Ask the model to search the web with Desearch and cite the returned sources. The model controls whether it requests a tool call. Successful tool results become part of chat history, following the host's normal behavior. Retrieved content is untrusted source data.

## Development and checks

```sh
npm ci
npm test
npm run lint
npm run build
```

`extension.js` is the UI and host registration. `search.js` is the thin MCP client wrapper. The checked-in `index.js` is an ES module browser bundle built with esbuild and the official MCP TypeScript SDK. Its dependency notices are included. No API or MCP server implementation is copied here.

Automated tests cover input bounds, missing keys, protocol payload parsing, unsafe source filtering, fixed errors, redaction and connection cleanup. They are not installed-host proof. QA must load this extension in a real SillyTavern browser session and verify two different authenticated searches, useful titles/HTTPS sources, missing and invalid keys, and reload/key-clearing behavior.

## Sources

- [SillyTavern UI extension specification](https://docs.sillytavern.app/for-contributors/writing-extensions/)
- [Host function calling guide](https://docs.sillytavern.app/for-contributors/function-calling/)
- Runtime target: SillyTavern `1.19.0`, commit `7e8663cd9c184a550b37238218bdd32c6efc68e9`.
- Content reference: `SillyTavern/SillyTavern-Content`, default branch `main`, pinned and rechecked head `72acaca394237790106fa7b33e57ee50ea197127` (2026-11-16).
- Read-only MCP contract reference: `Desearch-ai/mcp-desearch` `main` commit `42bb4ef2312c28976fb295521b6fda20132ef1fc`.

MIT licensed. Directory submissions and acceptance are tracked separately from this source repository.
