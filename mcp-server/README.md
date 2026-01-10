# Aleph.wiki MCP Server

Model Context Protocol (MCP) server for Solid Pod RDF operations with SPARQL pattern matching and full query support.

## Features

- **Solid Pod Integration**: Authenticate and interact with Solid Pods using the Solid Protocol
- **RDF Operations**: Read, write, and append RDF triples in Turtle format
- **SPARQL Pattern Matching**: Query RDF graphs with triple pattern matching (wildcards supported)
- **Full SPARQL Queries**: Execute SELECT, CONSTRUCT, and ASK queries via Comunica
- **Container Management**: List resources in Solid Pod containers
- **Authenticated Access**: OAuth/OIDC authentication with session management

## Installation

```bash
# Install dependencies
bun install

# Build TypeScript
bun run build
```

## Development

```bash
# Run tests (requires Node.js via vitest due to Comunica compatibility)
bun run test

# Watch mode
bun run test:watch

# Run development server
bun run dev
```

## Usage with Claude Desktop

### 1. Configure MCP Server

Add to your Claude Desktop MCP configuration (typically `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "aleph-wiki-solid": {
      "command": "node",
      "args": ["/absolute/path/to/aleph-wiki/mcp-server/dist/index.js"],
      "env": {}
    }
  }
}
```

### 2. Build the Server

```bash
cd /path/to/aleph-wiki/mcp-server
bun install
bun run build
```

### 3. Restart Claude Desktop

The MCP server will be available as tools in Claude conversations.

## Available Tools

### `solid_init`
Initialize connection to Solid Pod with authentication.

**Parameters:**
- `podUrl` (required): Solid Pod URL
- `webId` (required): User's WebID
- `clientId` (optional): OAuth client ID
- `clientSecret` (optional): OAuth client secret
- `oidcIssuer` (optional): OIDC issuer URL (default: https://solidcommunity.net)

**Example:**
```typescript
{
  "podUrl": "https://user.solidcommunity.net/",
  "webId": "https://user.solidcommunity.net/profile/card#me"
}
```

### `rdf_read`
Read RDF resource from Solid Pod in Turtle format.

**Parameters:**
- `url` (required): Full URL of the RDF resource

**Example:**
```typescript
{
  "url": "https://user.solidcommunity.net/aleph-wiki/index.ttl"
}
```

### `rdf_append`
Append RDF triples to a resource using Solid Protocol PATCH.

**Parameters:**
- `url` (required): Full URL of the RDF resource
- `triples` (required): Turtle-formatted triples to append

**Example:**
```typescript
{
  "url": "https://user.solidcommunity.net/aleph-wiki/index.ttl",
  "triples": "<concept:test> a skos:Concept ; skos:prefLabel \"Test\"@en ."
}
```

### `sparql_match`
Execute simple triple pattern matching. Use null for wildcards.

**Parameters:**
- `url` (required): RDF resource URL
- `subject` (optional): Subject IRI or null for wildcard
- `predicate` (optional): Predicate IRI or null for wildcard
- `object` (optional): Object IRI/literal or null for wildcard

**Example - Find all concepts:**
```typescript
{
  "url": "https://user.solidcommunity.net/aleph-wiki/index.ttl",
  "subject": null,
  "predicate": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
  "object": "http://www.w3.org/2004/02/skos/core#Concept"
}
```

### `sparql_query`
Execute full SPARQL query (SELECT, CONSTRUCT, ASK) against a resource.

**Parameters:**
- `url` (required): RDF resource URL
- `query` (required): SPARQL query string

**Example:**
```typescript
{
  "url": "https://user.solidcommunity.net/aleph-wiki/index.ttl",
  "query": "SELECT ?s ?label WHERE { ?s skos:prefLabel ?label } LIMIT 10"
}
```

### `solid_list`
List resources in a Solid container.

**Parameters:**
- `containerUrl` (required): URL of the Solid container (must end with /)

**Example:**
```typescript
{
  "containerUrl": "https://user.solidcommunity.net/aleph-wiki/"
}
```

## Architecture

```
src/
├── index.ts              # Entry point & MCP server setup
├── lib/
│   ├── config.ts        # Configuration schema & types
│   ├── solid-client.ts  # Solid Pod operations
│   └── sparql.ts        # SPARQL query operations
└── test/                # Test files (TDD)
```

### Module Overview

- **config.ts**: Configuration validation with Zod
- **solid-client.ts**: Session management, RDF read/write, container operations
- **sparql.ts**: Pattern matching and full SPARQL queries via Comunica
- **index.ts**: MCP tool registration and server initialization

## Testing

All features are implemented using TDD with comprehensive test coverage:

```bash
# Run all tests
bun run test

# Run specific test file
bun run test sparql-match.test.ts

# Coverage report
bun run test:coverage
```

**Note**: Tests use Node.js via vitest (not Bun directly) due to Comunica's dependency on Node.js-specific APIs.

## Security Considerations

- Credentials should be stored securely (environment variables, secret manager)
- Use HTTPS for all Pod communications
- Implement proper token refresh mechanisms
- Validate all user inputs before sending to Pod
- Follow Solid security best practices
- Be cautious with public SPARQL endpoints (rate limiting, timeouts)

## References

- [Model Context Protocol](https://modelcontextprotocol.io)
- [Solid Protocol Specification](https://solidproject.org/TR/protocol)
- [Inrupt JavaScript Client Libraries](https://docs.inrupt.com/developer-tools/javascript/client-libraries/)
- [Comunica SPARQL Engine](https://comunica.dev/)
- [N3.js Documentation](https://github.com/rdfjs/N3.js)

## License

AGPL-3.0 - see [LICENSE](../LICENSE) for details.
