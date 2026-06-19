# Antigravity (Gemini lane) — Context7 wiring

Makes the **same current-docs source (Context7)** available to the Antigravity (`agy`)
lane that Codex already has, so all three lanes resolve library/API docs consistently
(agent-stack operating model §1). This is a **reviewable template** — applying it edits a
file **outside this repo** (`~/.gemini/config/mcp_config.json`), so it is an explicit,
owner-approved step, not something CI or an agent applies automatically.

## Apply (owner step)

`agy` has no `mcp` management subcommand, so wire it by hand. The global config file is
`~/.gemini/config/mcp_config.json` (today it is empty). Merge in the `context7` server
from [`mcp_config.example.json`](mcp_config.example.json):

```jsonc
{
  "mcpServers": {
    "context7": { "httpUrl": "https://mcp.context7.com/mcp" }
  }
}
```

Then start a fresh `agy` session and confirm the server loads before trusting it.

### Pinned local alternative (stronger supply-chain posture)

```jsonc
{
  "mcpServers": {
    "context7": { "command": "npx", "args": ["-y", "@upstash/context7-mcp@<pin-a-version>"] }
  }
}
```

## Security notes (from the technical-lane review)

- **Global config affects every `agy` project** — prefer project scope if/when `agy`
  supports it; pin the server version/source for the local variant.
- **No secrets in the config.** Context7 works without a key for advisory docs; only add
  a key via env/headers if you accept the added surface.
- **Fail-open, not blocking.** If Context7 is down or returns stale docs, fall back to
  pinned official docs (`AI-CONTEXT7-001`); never send private code to a docs MCP.
- Context7 output stays **advisory** until verified against official docs for anything
  load-bearing.
