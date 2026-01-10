# Solid Development Setup

This setup provides Solid protocol compatibility with SPARQL querying via Comunica.

## What's Installed

- **Community Solid Server (CSS)**: Local Solid pod server (runs via npx)
- **Comunica**: Browser-compatible SPARQL query engine (@comunica/query-sparql v3.x)
- **Concurrently**: Run both services together
- **N3**: RDF parsing and serialization library

## Quick Start

```bash
npm run dev:all
```

This starts:
- **Vite dev server**: http://localhost:5173/
- **Solid pod server**: http://localhost:3000/

## Individual Commands

```bash
npm run dev     # Just Vite
npm run solid   # Just CSS
```

## Architecture

### CSS via npx (Separate Installation)

CSS runs via `npx` to avoid dependency conflicts with Comunica. This means:
- CSS runs in its own isolated environment
- No version conflicts between CSS's internal Comunica (v2.x) and your app's Comunica (v3.x)
- First run downloads CSS automatically (subsequent runs are instant)

### Comunica for SPARQL Queries

Comunica (@comunica/query-sparql) is a **JavaScript SPARQL engine** that:
- Runs in the browser or Node.js
- Queries HTTP URLs, file:// URLs, and SPARQL endpoints
- Can query ANY RDF data source including Solid pods
- Evaluates queries client-side (works even without server-side SPARQL)

### How It Works

```
Your App (Comunica)
    ├─→ Your Local Pod (CSS at localhost:3000)
    ├─→ Friend's Pod (any Solid server)
    ├─→ Public Pods (any Solid server)
    └─→ Any pod on the web
```

Comunica fetches RDF documents from pods and evaluates SPARQL locally, so it doesn't matter if the remote pod has SPARQL support.

## Performance with Large Datasets

Comunica includes:
- Smart caching and memoization
- Parallel query execution across sources
- Adaptive query optimization
- Link traversal for federated queries

For **your own data**, if you need even more performance later, you can:
- Upgrade CSS with a SPARQL backend (like Oxigraph)
- Your pod becomes faster for complex queries
- Other apps still access it via standard Solid protocol

## Example Usage

See `src/comunica-example.js` for:
- Basic SPARQL queries
- Multi-pod queries
- Authenticated queries
- CONSTRUCT/ASK queries

## Data Persistence

- Solid pod data: `.solid-data/` (gitignored)
- Data persists between restarts

## Next Steps

1. Start exploring with `npm run dev:all`
2. Check out the Comunica examples in `src/comunica-example.js`
3. Integrate SPARQL queries into your RDF graph viewer
4. Test with real Solid pods when ready
