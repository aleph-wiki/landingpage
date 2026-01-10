import { describe, it, expect } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// This will be exported from index.ts
import { registerTools } from '../src/index.js';

describe('solid_init MCP tool registration', () => {
  it('registers solid_init tool that accepts podUrl and webId parameters', async () => {
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

    // Capture the handler that registerTools sets
    let capturedHandler: any = null;
    const originalSetRequestHandler = server.setRequestHandler.bind(server);
    server.setRequestHandler = ((schema: any, handler: any) => {
      if (schema === ListToolsRequestSchema) {
        capturedHandler = handler;
      }
      return originalSetRequestHandler(schema, handler);
    }) as any;

    // Call registerTools to register the tools
    registerTools(server);

    // Call the captured handler to get the tools
    const response = await capturedHandler();
    const registeredTools = response.tools;

    const solidInitTool = registeredTools.find((t: any) => t.name === 'solid_init');

    expect(solidInitTool).toBeDefined();
    expect(solidInitTool.name).toBe('solid_init');
    expect(solidInitTool.inputSchema.properties).toHaveProperty('podUrl');
    expect(solidInitTool.inputSchema.properties).toHaveProperty('webId');
  });
});
