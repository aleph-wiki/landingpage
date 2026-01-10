import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { registerTools, setSolidSession } from '../src/index.js';
import { createMockSession, mockFetchResponse, sampleTurtleData } from './mocks.js';

describe('rdf_read MCP tool', () => {
  it('reads RDF resource from a Solid Pod URL', async () => {
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

    // Verify rdf_read tool is registered
    const listResponse = await listToolsHandler();
    const rdfReadTool = listResponse.tools.find((t: any) => t.name === 'rdf_read');

    expect(rdfReadTool).toBeDefined();
    expect(rdfReadTool.name).toBe('rdf_read');
    expect(rdfReadTool.inputSchema.properties).toHaveProperty('url');

    // Mock session with fetch behavior
    const mockSession = createMockSession();
    mockSession.fetch.mockReturnValue(
      mockFetchResponse(sampleTurtleData, 200, 'text/turtle')
    );

    // Inject the mock session
    setSolidSession(mockSession as any);

    // Call the rdf_read tool
    const callResponse = await callToolHandler({
      params: {
        name: 'rdf_read',
        arguments: {
          url: 'https://test.solidcommunity.net/profile/card',
        },
      },
    });

    // Verify the response contains the RDF data
    expect(callResponse.content).toBeDefined();
    expect(callResponse.content[0].type).toBe('text');
    expect(callResponse.content[0].text).toContain('Test Concept');
  });
});
