import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { registerTools, setSolidSession } from '../src/index.js';
import { createMockSession, mockFetchResponse } from './mocks.js';

describe('rdf_append MCP tool', () => {
  it('appends RDF triples to a Solid Pod resource using PATCH', async () => {
    const server = new Server(
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
    let listToolsHandler: any = null;
    let callToolHandler: any = null;
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

    // Verify rdf_append tool is registered
    const listResponse = await listToolsHandler();
    const rdfAppendTool = listResponse.tools.find((t: any) => t.name === 'rdf_append');

    expect(rdfAppendTool).toBeDefined();
    expect(rdfAppendTool.name).toBe('rdf_append');
    expect(rdfAppendTool.inputSchema.properties).toHaveProperty('url');
    expect(rdfAppendTool.inputSchema.properties).toHaveProperty('triples');

    // Mock session with fetch behavior
    const mockSession = createMockSession();
    mockSession.fetch.mockReturnValue(
      mockFetchResponse('', 200, 'text/plain')
    );

    // Inject the mock session
    setSolidSession(mockSession as any);

    // Prepare triples to append
    const triplesToAppend = `
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix : <http://aleph-wiki.local/concept/> .

:new-concept a skos:Concept ;
    skos:prefLabel "New Concept"@en .
`.trim();

    // Call the rdf_append tool
    const callResponse = await callToolHandler({
      params: {
        name: 'rdf_append',
        arguments: {
          url: 'https://test.solidcommunity.net/data/concepts.ttl',
          triples: triplesToAppend,
        },
      },
    });

    // Verify PATCH method was used
    expect(mockSession.fetch).toHaveBeenCalledWith(
      'https://test.solidcommunity.net/data/concepts.ttl',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          'Content-Type': 'application/sparql-update',
        }),
      })
    );

    // Verify N3 Patch format in request body
    const fetchCall = mockSession.fetch.mock.calls[0];
    const requestBody = fetchCall[1].body;

    expect(requestBody).toContain('INSERT DATA');
    expect(requestBody).toContain(triplesToAppend);

    // Verify success response
    expect(callResponse.content).toBeDefined();
    expect(callResponse.content[0].type).toBe('text');
    expect(callResponse.content[0].text).toContain('appended');
  });
});
