# Cloudflare Pages Deployment

Verified from current Cloudflare Pages docs on 2026-05-10:

- Framework preset: Astro
- Build command: `npm run build`
- Build output directory: `dist`
- Static headers file: `public/_headers`, copied into the build output

## Recommended Setup

1. Create a Cloudflare Pages project connected to this repository.
2. Select the Astro framework preset.
3. Set the build command to `npm run build`.
4. Set the build output directory to `dist`.
5. Use Node `>=22.12.0`, matching `package.json`.

## Static-First Notes

- Astro output is configured as `static`.
- No Cloudflare adapter is required for this version because there is no SSR or Pages Functions code.
- The contact terminal is local-only in v1. Add a Cloudflare Pages Function or Worker only when real submission/storage is approved.
- `_headers` currently sets security headers and immutable caching for hashed Astro assets.

## Verification Before Deploy

Run:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run test
& 'C:\Program Files\nodejs\npm.cmd' run typecheck
& 'C:\Program Files\nodejs\npm.cmd' run build
& 'C:\Program Files\nodejs\npm.cmd' run test:e2e
& 'C:\Program Files\nodejs\npm.cmd' audit --audit-level=moderate
```
