import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { registerTools, setSolidSession } from '../src/index.js';
import { createMockSession, mockFetchResponse, sampleTurtleData } from './mocks.js';

describe('sparql_match MCP tool', () => {
  let server: Server;
  let listToolsHandler: any;
  let callToolHandler: any;

  beforeEach(() => {
    // Create fresh server instance
    server = new Server(
      {
        name: 'aleph-wiki-solid',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Capture the handlers that registerTools sets
    listToolsHandler = null;
    callToolHandler = null;
    const originalSetRequestHandler = server.setRequestHandler.bind(server);
    server.setRequestHandler = ((schema: any, handler: any) => {
      if (schema === ListToolsRequestSchema) {
        listToolsHandler = handler;
      } else if (schema === CallToolRequestSchema) {
        callToolHandler = handler;
      }
      return originalSetRequestHandler(schema, handler);
    }) as any;

    // Register tools
    registerTools(server);
  });

  it('is registered with the correct name', async () => {
    const listResponse = await listToolsHandler();
    const sparqlMatchTool = listResponse.tools.find((t: any) => t.name === 'sparql_match');

    expect(sparqlMatchTool).toBeDefined();
    expect(sparqlMatchTool.name).toBe('sparql_match');
  });

  it('has proper schema with url parameter', async () => {
    const listResponse = await listToolsHandler();
    const sparqlMatchTool = listResponse.tools.find((t: any) => t.name === 'sparql_match');

    expect(sparqlMatchTool.inputSchema.properties).toHaveProperty('url');
    expect(sparqlMatchTool.inputSchema.properties.url.type).toBe('string');
    expect(sparqlMatchTool.inputSchema.required).toContain('url');
  });

  it('has proper schema with subject parameter', async () => {
    const listResponse = await listToolsHandler();
    const sparqlMatchTool = listResponse.tools.find((t: any) => t.name === 'sparql_match');

    expect(sparqlMatchTool.inputSchema.properties).toHaveProperty('subject');
    expect(sparqlMatchTool.inputSchema.properties.subject.type).toBe('string');
    // subject is optional (for wildcards)
  });

  it('has proper schema with predicate parameter', async () => {
    const listResponse = await listToolsHandler();
    const sparqlMatchTool = listResponse.tools.find((t: any) => t.name === 'sparql_match');

    expect(sparqlMatchTool.inputSchema.properties).toHaveProperty('predicate');
    expect(sparqlMatchTool.inputSchema.properties.predicate.type).toBe('string');
    // predicate is optional (for wildcards)
  });

  it('has proper schema with object parameter', async () => {
    const listResponse = await listToolsHandler();
    const sparqlMatchTool = listResponse.tools.find((t: any) => t.name === 'sparql_match');

    expect(sparqlMatchTool.inputSchema.properties).toHaveProperty('object');
    expect(sparqlMatchTool.inputSchema.properties.object.type).toBe('string');
    // object is optional (for wildcards)
  });

  it('matches all triples by type (find all SKOS Concepts)', async () => {
    // Mock session with fetch behavior
    const mockSession = createMockSession();
    mockSession.fetch.mockReturnValue(
      mockFetchResponse(sampleTurtleData, 200, 'text/turtle')
    );

    // Inject the mock session
    setSolidSession(mockSession as any);

    // Call the sparql_match tool to find all skos:Concept instances
    const callResponse = await callToolHandler({
      params: {
        name: 'sparql_match',
        arguments: {
          url: 'https://test.solidcommunity.net/aleph-wiki.ttl',
          predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
          object: 'http://www.w3.org/2004/02/skos/core#Concept',
        },
      },
    });

    // Verify the response contains matched triples
    expect(callResponse.content).toBeDefined();
    expect(callResponse.content[0].type).toBe('text');
    const responseText = callResponse.content[0].text;

    // Should find both concepts
    expect(responseText).toContain('test-concept');
    expect(responseText).toContain('another-concept');
  });

  it('matches triples with subject wildcard (find all properties of a resource)', async () => {
    // Mock session with fetch behavior
    const mockSession = createMockSession();
    mockSession.fetch.mockReturnValue(
      mockFetchResponse(sampleTurtleData, 200, 'text/turtle')
    );

    // Inject the mock session
    setSolidSession(mockSession as any);

    // Call the sparql_match tool to find all triples for test-concept
    const callResponse = await callToolHandler({
      params: {
        name: 'sparql_match',
        arguments: {
          url: 'https://test.solidcommunity.net/aleph-wiki.ttl',
          subject: 'http://aleph-wiki.local/concept/test-concept',
        },
      },
    });

    // Verify the response contains all properties of test-concept
    expect(callResponse.content).toBeDefined();
    expect(callResponse.content[0].type).toBe('text');
    const responseText = callResponse.content[0].text;

    // Should find prefLabel, definition, type, dateCreated
    expect(responseText).toContain('prefLabel');
    expect(responseText).toContain('Test Concept');
    expect(responseText).toContain('definition');
  });

  it('matches triples with predicate wildcard (find all skos:related connections)', async () => {
    // Mock session with fetch behavior
    const mockSession = createMockSession();
    mockSession.fetch.mockReturnValue(
      mockFetchResponse(sampleTurtleData, 200, 'text/turtle')
    );

    // Inject the mock session
    setSolidSession(mockSession as any);

    // Call the sparql_match tool to find all skos:related relationships
    const callResponse = await callToolHandler({
      params: {
        name: 'sparql_match',
        arguments: {
          url: 'https://test.solidcommunity.net/aleph-wiki.ttl',
          predicate: 'http://www.w3.org/2004/02/skos/core#related',
        },
      },
    });

    // Verify the response contains related connections
    expect(callResponse.content).toBeDefined();
    expect(callResponse.content[0].type).toBe('text');
    const responseText = callResponse.content[0].text;

    // Should find the related connection from another-concept to test-concept
    expect(responseText).toContain('another-concept');
    expect(responseText).toContain('test-concept');
  });

  it('matches triples with object wildcard (find all resources with prefLabel)', async () => {
    // Mock session with fetch behavior
    const mockSession = createMockSession();
    mockSession.fetch.mockReturnValue(
      mockFetchResponse(sampleTurtleData, 200, 'text/turtle')
    );

    // Inject the mock session
    setSolidSession(mockSession as any);

    // Call the sparql_match tool to find all resources that have a prefLabel
    const callResponse = await callToolHandler({
      params: {
        name: 'sparql_match',
        arguments: {
          url: 'https://test.solidcommunity.net/aleph-wiki.ttl',
          predicate: 'http://www.w3.org/2004/02/skos/core#prefLabel',
        },
      },
    });

    // Verify the response contains resources with prefLabel
    expect(callResponse.content).toBeDefined();
    expect(callResponse.content[0].type).toBe('text');
    const responseText = callResponse.content[0].text;

    // Both concepts have prefLabel
    expect(responseText).toContain('Test Concept');
    expect(responseText).toContain('Another Concept');
  });

  it('returns empty results when no triples match the pattern', async () => {
    // Mock session with fetch behavior
    const mockSession = createMockSession();
    mockSession.fetch.mockReturnValue(
      mockFetchResponse(sampleTurtleData, 200, 'text/turtle')
    );

    // Inject the mock session
    setSolidSession(mockSession as any);

    // Call the sparql_match tool with a pattern that won't match
    const callResponse = await callToolHandler({
      params: {
        name: 'sparql_match',
        arguments: {
          url: 'https://test.solidcommunity.net/aleph-wiki.ttl',
          subject: 'http://aleph-wiki.local/concept/nonexistent',
        },
      },
    });

    // Verify the response indicates no matches
    expect(callResponse.content).toBeDefined();
    expect(callResponse.content[0].type).toBe('text');
    const responseText = callResponse.content[0].text;

    // Should indicate no results found
    expect(responseText).toMatch(/no matches|0 triples|empty/i);
  });

  it('fetches RDF data from the provided URL', async () => {
    // Mock session with fetch behavior
    const mockSession = createMockSession();
    mockSession.fetch.mockReturnValue(
      mockFetchResponse(sampleTurtleData, 200, 'text/turtle')
    );

    // Inject the mock session
    setSolidSession(mockSession as any);

    // Call the sparql_match tool
    await callToolHandler({
      params: {
        name: 'sparql_match',
        arguments: {
          url: 'https://test.solidcommunity.net/aleph-wiki.ttl',
          predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        },
      },
    });

    // Verify that fetch was called with the correct URL
    expect(mockSession.fetch).toHaveBeenCalledWith('https://test.solidcommunity.net/aleph-wiki.ttl');
  });
});
