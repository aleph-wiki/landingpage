# E2E Tests for Solid MCP Server

End-to-end tests that run against a real Community Solid Server instance.

## Prerequisites

1. **CSS Server Running**: Start the CSS dev server from the app directory:
   ```bash
   cd ../app
   bun run solid
   ```
   This starts CSS on `http://localhost:3000` with a seeded pod.

2. **Test Pod**: The seeded pod credentials are:
   - Email: `dev@localhost`
   - Password: `dev123`
   - WebID: `http://localhost:3000/dev/profile/card#me`
   - Pod URL: `http://localhost:3000/dev/`

## Running E2E Tests

```bash
# Ensure CSS is running first
cd ../app && bun run solid &

# Run E2E tests
bun test:e2e

# Or run all tests including E2E
bun test
```

## What Gets Tested

- **Authentication**: Real session creation with CSS
- **RDF Operations**: Writing and reading actual RDF data
- **SPARQL Queries**: Executing queries against real data
- **Session Persistence**: Verifying session.fetch includes auth headers

## Test Isolation

Each test creates and cleans up its own test resources to avoid conflicts:
- Test resources use unique identifiers
- Cleanup happens in `afterEach` hooks
- Tests can run in parallel
