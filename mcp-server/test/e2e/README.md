# E2E Tests

End-to-end tests for the MCP server against a real Community Solid Server instance.

## Prerequisites

1. **Community Solid Server running** on http://localhost:3000
   - Start with: `cd ../../solid-dev-server && bun run dev`
   - This starts CSS with file-based storage and seeded account (dev@localhost)

2. **Test credentials generated**
   - Run: `./test/e2e/scripts/setup-credentials.sh`
   - Or: `bun run test:e2e:setup`
   - Creates `.env.test` with client credentials

## Running Tests

```bash
# Setup credentials (one-time or when CSS data is cleared)
bun run test:e2e:setup

# Run all e2e tests
bun run test:e2e

# Run specific e2e test file
bun test test/e2e/solid-auth.e2e.test.ts
```

## Test Credentials

The setup script (`scripts/setup-credentials.sh`):
1. Waits for CSS to be ready
2. Logs in with seeded account (dev@localhost / dev123)
3. Creates a pod if it doesn't exist
4. Generates OAuth client credentials
5. Saves to `test/e2e/.env.test` (git-ignored)

Environment variables in `.env.test`:
- `TEST_CSS_URL` - Community Solid Server URL
- `TEST_POD_URL` - Pod URL
- `TEST_WEB_ID` - WebID for authentication
- `TEST_CLIENT_ID` - OAuth client ID
- `TEST_CLIENT_SECRET` - OAuth client secret

These are automatically loaded by vitest config.

## Troubleshooting

**Tests fail with "CSS is not running"**
- Start CSS: `cd ../../solid-dev-server && bun run dev`

**Tests fail with authentication errors**
- Regenerate credentials: `bun run test:e2e:setup`

**Tests fail with "pod not found"**
- Clear CSS data and restart:
  ```bash
  cd ../../solid-dev-server
  rm -rf data/.solid-data
  bun run dev
  ```
- Then regenerate credentials: `bun run test:e2e:setup`

## Architecture

- `scripts/` - Helper scripts for test setup
- `.env.test` - Generated test credentials (git-ignored)
- `check-css.ts` - Utility to check if CSS is running
- `test-credentials.test.ts` - Validates credential loading
- `solid-auth.e2e.test.ts` - Authentication and RDF operations
- `sparql-queries.e2e.test.ts` - SPARQL query tests
