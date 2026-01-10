# Running E2E Tests

## Quick Start

```bash
# Terminal 1: Start CSS server
cd ../app
bun run solid

# Terminal 2: Run E2E tests
cd ../mcp-server
bun test:e2e
```

## What the E2E Tests Do

### Authentication Tests (`solid-auth.e2e.test.ts`)
- ✓ Real session initialization with CSS
- ✓ Writing RDF data to pod
- ✓ Reading RDF data back
- ✓ Verifying authenticated fetch includes proper headers
- ✓ Error handling for non-existent resources

### SPARQL Tests (`sparql-queries.e2e.test.ts`)
- ✓ Pattern matching with `sparqlMatch`
- ✓ SELECT queries returning SPARQL JSON
- ✓ ASK queries returning boolean results
- ✓ CONSTRUCT queries returning Turtle
- ✓ Queries against real data in CSS

## Expected Output

```
✓ E2E: Solid Authentication and Operations (4)
  ✓ should successfully initialize session with CSS
  ✓ should write RDF data to pod
  ✓ should use authenticated fetch with valid session
  ✓ should handle non-existent resources gracefully

✓ E2E: SPARQL Queries (7)
  ✓ sparqlMatch pattern matching (3)
    ✓ should find all SKOS Concepts using pattern matching
    ✓ should find specific subject properties
    ✓ should match by predicate only
  ✓ executeSparqlQuery (4)
    ✓ should execute SELECT query and return SPARQL JSON
    ✓ should execute ASK query and return boolean
    ✓ should return false for non-matching ASK query
    ✓ should execute CONSTRUCT query and return Turtle
```

## Troubleshooting

### "Connection refused" errors
**Problem**: CSS server is not running
**Solution**: Start CSS in another terminal: `cd ../app && bun run solid`

### "Authentication failed" errors
**Problem**: CSS server restarted and session is stale
**Solution**: Stop and restart the E2E tests

### "Resource not found" errors
**Problem**: Test cleanup may have failed
**Solution**: Tests use unique timestamps, so rerunning should work

## Testing Against Different CSS Configurations

### File-based backend (current)
This is the default configuration used by `bun run solid` in the app folder.

### SPARQL backend (future)
To test the SPARQL endpoint feature:

1. Configure CSS with a SPARQL backend (e.g., Oxigraph)
2. Update test to pass `sparqlEndpoint` during `initializeSolidSession`:
   ```typescript
   await initializeSolidSession({
     podUrl: POD_URL,
     webId: WEB_ID,
     oidcIssuer: CSS_URL,
     sparqlEndpoint: 'http://localhost:3000/sparql', // Add this
   });
   ```
3. Verify queries use the endpoint (check test output or add assertions)

## CI/CD Integration

For automated testing:

```bash
#!/bin/bash
# Start CSS in background
cd app && bun run solid &
CSS_PID=$!

# Wait for CSS to be ready
sleep 5

# Run E2E tests
cd ../mcp-server && bun test:e2e

# Cleanup
kill $CSS_PID
```
