#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { Session } from "@inrupt/solid-client-authn-node";

/**
 * MCP Server for Solid Pod RDF Operations
 *
 * Provides tools for:
 * - SPARQL queries against Solid Pods
 * - Reading RDF resources
 * - Writing/appending triples
 * - Managing ontologies
 */

// Configuration schema
const ConfigSchema = z.object({
  podUrl: z.string().url(),
  webId: z.string().url(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  oidcIssuer: z.string().url().default("https://solidcommunity.net"),
});

export type Config = z.infer<typeof ConfigSchema>;

// Global session for Solid authentication
let solidSession: Session | null = null;
let config: Config | null = null;

/**
 * Set the global Solid session (mainly for testing)
 */
export function setSolidSession(session: Session | null) {
  solidSession = session;
}

/**
 * Initialize Solid session with authentication
 */
export async function initializeSolidSession(cfg: Config): Promise<Session> {
  const session = new Session();

  if (cfg.clientId && cfg.clientSecret) {
    await session.login({
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret,
      oidcIssuer: cfg.oidcIssuer,
    });
  }

  solidSession = session;
  config = cfg;

  return session;
}

/**
 * Read RDF resource from a URL using Solid session
 */
export async function readRdfResource(url: string): Promise<string> {
  if (!solidSession) {
    throw new Error("Solid session not initialized");
  }

  const response = await solidSession.fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch RDF resource: ${response.statusText}`);
  }

  return await response.text();
}

/**
 * Register MCP tools on the server
 */
export function registerTools(server: Server) {
  const tools = [
    {
      name: "solid_init",
      description: "Initialize Solid Pod session with authentication",
      inputSchema: {
        type: "object",
        properties: {
          podUrl: {
            type: "string",
            description: "URL of the Solid Pod",
          },
          webId: {
            type: "string",
            description: "WebID of the user",
          },
        },
        required: ["podUrl", "webId"],
      },
    },
    {
      name: "rdf_read",
      description: "Read RDF resource from a Solid Pod URL",
      inputSchema: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "URL of the RDF resource to read",
          },
        },
        required: ["url"],
      },
    },
  ];

  server.setRequestHandler(
    ListToolsRequestSchema,
    async () => ({ tools })
  );

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request) => {
      if (request.params.name === "solid_init") {
        const { podUrl, webId } = request.params.arguments as any;
        await initializeSolidSession({ podUrl, webId });
        return {
          content: [
            {
              type: "text",
              text: `Initialized Solid session for ${webId} at ${podUrl}`,
            },
          ],
        };
      }

      if (request.params.name === "rdf_read") {
        const { url } = request.params.arguments as any;
        const rdfContent = await readRdfResource(url);
        return {
          content: [
            {
              type: "text",
              text: rdfContent,
            },
          ],
        };
      }

      throw new Error(`Unknown tool: ${request.params.name}`);
    }
  );
}

/**
 * Main MCP Server
 */
async function main() {
  const server = new Server({
    name: "aleph-wiki-solid",
    version: "0.1.0",
  });

  // Register tools
  registerTools(server);

  // Start server on stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Aleph.wiki Solid MCP Server running on stdio");
}

// Only run main when executed directly (not when imported)
if (import.meta.main) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
