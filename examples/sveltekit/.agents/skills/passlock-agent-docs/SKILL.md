---
name: passlock-agent-docs
description: Read and cite public Passlock LLM markdown docs and API references. Use for Passlock passkey registration, authentication, deletion, credential management, one-time-code mailbox challenges, REST API usage, @passlock/browser, @passlock/server, tenancy setup, integration guidance, and troubleshooting. Prefer safe library variants and public documentation.
---

# Passlock Agent Docs Skill

Use this workflow for tasks that need authoritative Passlock docs or API reference context.

## Scope

- Use public docs only: `https://passlock.dev/llms/...` and `https://apidocs.passlock.dev/llms/...`.
- Prefer safe imports: `@passlock/browser/safe` and `@passlock/server/safe`.
- Use runbook docs first for integration flow and security guidance.
- Use API reference markdown for exact signatures, options, result types, and symbol names.
- Cite public source URLs used in the final answer.
- Never cite local file paths as sources.
- Never expose private implementation details, secrets, credentials, or internal-only code.

## Source Map

- Docs index: `https://passlock.dev/llms.txt`
- Docs search cache ID: `https://passlock.dev/llms/search-cache-id.txt`
- Docs search index: `https://passlock.dev/llms/search-index-{id}.json`
- API docs search cache ID: `https://apidocs.passlock.dev/llms/search-cache-id.txt`
- API docs search index: `https://apidocs.passlock.dev/llms/search-index-{id}.json`
- Browser API root: `https://apidocs.passlock.dev/llms/browser/README.md`
- Server API root: `https://apidocs.passlock.dev/llms/server/README.md`

## Retrieval Workflow

1. For broad requests, read `https://passlock.dev/llms.txt` first.
2. Search the docs index for integration topics and runbooks.
3. Search the API docs index when exact exported functions, interfaces, types, or errors matter.
4. Fetch only the relevant markdown pages from search results.
5. Prefer runbook guidance when API docs and runbooks differ in level of detail.
6. Cite all public docs and API reference pages used.

Search both public indexes:

```bash
set -euo pipefail

QUERY="${1:-${PASSLOCK_DOCS_QUERY:-registerPasskey}}"
CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/passlock-docs"
mkdir -p "$CACHE_DIR"

fetch_index() {
  local name="$1"
  local cache_id_url="$2"
  local index_url_template="$3"
  local id index

  id="$(curl -fsSL "$cache_id_url" | tr -d '\r\n')"
  index="$CACHE_DIR/${name}-search-index-${id}.json"

  if [ ! -s "$index" ]; then
    curl -fsSL "${index_url_template/\{id\}/$id}" > "$index"
  fi

  printf '%s\n' "$index"
}

DOCS_INDEX="$(fetch_index docs https://passlock.dev/llms/search-cache-id.txt https://passlock.dev/llms/search-index-{id}.json)"
API_INDEX="$(fetch_index api https://apidocs.passlock.dev/llms/search-cache-id.txt https://apidocs.passlock.dev/llms/search-index-{id}.json)"

node - <<'NODE' "$QUERY" "$DOCS_INDEX" "$API_INDEX"
const fs = require("fs")
const [query, ...indexes] = process.argv.slice(2)
const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
const seen = new Set()
const results = []

for (const indexPath of indexes) {
  for (const bundle of JSON.parse(fs.readFileSync(indexPath, "utf8"))) {
    for (const doc of bundle.documents || []) {
      const haystack = [doc.t, doc.s, doc.u, doc.kind, ...(doc.b || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0)
      if (score > 0 && !seen.has(doc.u)) {
        seen.add(doc.u)
        results.push({ score, doc })
      }
    }
  }
}

for (const { doc } of results.sort((a, b) => b.score - a.score).slice(0, 20)) {
  console.log(`${doc.t}\t${doc.u}`)
}
NODE
```

## Fallback

If search index discovery is unavailable:

1. Fetch `https://passlock.dev/llms.txt`.
2. Extract the relevant linked markdown URLs.
3. Fetch likely docs directly under `https://passlock.dev/llms/...`.
4. For API symbols, fetch the browser or server API root and follow linked markdown pages.
5. Cache fetched markdown locally and search it with `rg` or an equivalent grep-like tool.

## Safety Defaults

- Treat `apiKey` as backend-only.
- Exchange browser-issued `code` values on a trusted backend.
- Use `authenticatorId` as the default local passkey linkage key.
- Use `allowCredentials` and `excludeCredentials` with Passlock passkey IDs only.
- Do not recommend unsafe variants unless the user explicitly needs throwing APIs and the docs support that choice.
