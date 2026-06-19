# Antigravity (Gemini lane) — Context7 wiring

Makes the **same current-docs source (Context7)** available to the Antigravity (`agy`)
lane that Codex already has, so all lanes resolve library/API docs consistently. This is
a **reviewable template** — applying it edits a file **outside this repo**
(`~/.gemini/config/mcp_config.json`), so it is an explicit, owner-approved step, not
something CI or an agent applies automatically.

## Apply (owner step)

`agy` has no `mcp` management subcommand, so wire it by hand. Merge the `context7` server
from [`mcp_config.example.json`](mcp_config.example.json) into
`~/.gemini/config/mcp_config.json`:

```jsonc
{
  "mcpServers": {
    "context7": { "httpUrl": "https://mcp.context7.com/mcp" }
  }
}
```

Then start a fresh `agy` session and confirm the server loads before trusting it.

### Verified working (2026-06-19)

After applying the above, `agy` registers the `context7` MCP server with tools
`resolve-library-id` and `query-docs`. **Call them by their bare names** —
`resolve-library-id`, `query-docs` — not namespaced variants; the namespaced form is what
previously failed. Verified end-to-end: Next.js → `/vercel/next.js` →
`query-docs revalidateTag` returned the current signature with a source URL.

### Pinned local alternative (stronger supply-chain posture)

```jsonc
{
  "mcpServers": {
    "context7": { "command": "npx", "args": ["-y", "@upstash/context7-mcp@<pin-a-version>"] }
  }
}
```

## Security notes

- **Global config affects every `agy` project** — prefer project scope if/when `agy`
  supports it; pin the server version/source for the local variant.
- **No secrets in the config.** Context7 works without a key for advisory docs.
- **Fail-open, not blocking.** If Context7 is down or returns stale docs, fall back to
  pinned official docs; never send private code to a docs MCP. Output stays advisory until
  cross-checked against official docs for load-bearing claims.
