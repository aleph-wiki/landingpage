import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import {
  initializeSolidSession,
  appendTriples,
  executeSparqlQuery,
  sparqlMatch,
} from '../../src/index.js';
import { Session } from '@inrupt/solid-client-authn-node';
import { waitForCSS } from './check-css.js';

/**
 * E2E Tests for SPARQL Queries
 *
 * PREREQUISITES:
 * - Community Solid Server running on http://localhost:3000
 * - Start with: cd ../app && bun run solid
 *
 * Tests verify:
 * - SPARQL queries via Comunica against real CSS
 * - Pattern matching with sparqlMatch
 * - SELECT, ASK, and CONSTRUCT queries
 */
describe('E2E: SPARQL Queries', () => {
  const CSS_URL = process.env.TEST_CSS_URL || 'http://localhost:3000';
  const POD_URL = process.env.TEST_POD_URL || `${CSS_URL}/dev/`;
  const WEB_ID = process.env.TEST_WEB_ID || `${CSS_URL}/dev/profile/card#me`;
  const TEST_RESOURCE = `${POD_URL}sparql-test-${Date.now()}.ttl`;

  let session: Session;

  beforeAll(async () => {
    // Check if CSS is running
    await waitForCSS(CSS_URL);

    // Load credentials from environment if available
    const clientId = process.env.TEST_CLIENT_ID;
    const clientSecret = process.env.TEST_CLIENT_SECRET;

    // Use client credentials for authenticated session if provided
    // Generated via CSS account API or setup-test-credentials.sh
    // Falls back to unauthenticated session for seeded pods
    session = await initializeSolidSession({
      podUrl: POD_URL,
      webId: WEB_ID,
      oidcIssuer: CSS_URL,
      clientId,
      clientSecret,
    });

    // Create test data
    const testData = `
@prefix ex: <http://example.org/> .
@prefix schema: <http://schema.org/> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .

ex:concept1 a skos:Concept ;
    skos:prefLabel "First Concept"@en ;
    skos:related ex:concept2 ;
    schema:dateCreated "2026-01-11"^^<http://www.w3.org/2001/XMLSchema#date> .

ex:concept2 a skos:Concept ;
    skos:prefLabel "Second Concept"@en ;
    schema:dateCreated "2026-01-11"^^<http://www.w3.org/2001/XMLSchema#date> .

ex:entity1 a schema:Thing ;
    schema:name "Not a Concept" .
`;

    await appendTriples(TEST_RESOURCE, testData);
  });

  afterEach(async () => {
    // Cleanup test resource
    try {
      await session.fetch(TEST_RESOURCE, { method: 'DELETE' });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('sparqlMatch pattern matching', () => {
    it('should find all SKOS Concepts using pattern matching', async () => {
      const matches = await sparqlMatch(
        TEST_RESOURCE,
        null,
        'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        'http://www.w3.org/2004/02/skos/core#Concept'
      );

      expect(matches).toHaveLength(2);
      expect(matches.some((m) => m.subject.includes('concept1'))).toBe(true);
      expect(matches.some((m) => m.subject.includes('concept2'))).toBe(true);
    });

    it('should find specific subject properties', async () => {
      const matches = await sparqlMatch(
        TEST_RESOURCE,
        'http://example.org/concept1',
        null,
        null
      );

      expect(matches.length).toBeGreaterThan(0);
      expect(matches.some((m) => m.predicate.includes('prefLabel'))).toBe(true);
      expect(matches.some((m) => m.predicate.includes('related'))).toBe(true);
    });

    it('should match by predicate only', async () => {
      const matches = await sparqlMatch(
        TEST_RESOURCE,
        null,
        'http://www.w3.org/2004/02/skos/core#prefLabel',
        null
      );

      expect(matches).toHaveLength(2);
      expect(matches.every((m) => m.object.includes('Concept'))).toBe(true);
    });
  });

  describe('executeSparqlQuery', () => {
    it('should execute SELECT query and return SPARQL JSON', async () => {
      const query = `
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        SELECT ?concept ?label
        WHERE {
          ?concept a skos:Concept ;
                   skos:prefLabel ?label .
        }
      `;

      const resultJson = await executeSparqlQuery(TEST_RESOURCE, query);
      const result = JSON.parse(resultJson);

      expect(result).toHaveProperty('head');
      expect(result).toHaveProperty('results');
      expect(result.head.vars).toContain('concept');
      expect(result.head.vars).toContain('label');
      expect(result.results.bindings).toHaveLength(2);
    });

    it('should execute ASK query and return boolean', async () => {
      const query = `
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        ASK {
          ?s a skos:Concept .
        }
      `;

      const resultJson = await executeSparqlQuery(TEST_RESOURCE, query);
      const result = JSON.parse(resultJson);

      expect(result).toHaveProperty('boolean');
      expect(result.boolean).toBe(true);
    });

    it('should return false for non-matching ASK query', async () => {
      const query = `
        PREFIX ex: <http://example.org/>
        ASK {
          ex:nonexistent ex:property "value" .
        }
      `;

      const resultJson = await executeSparqlQuery(TEST_RESOURCE, query);
      const result = JSON.parse(resultJson);

      expect(result.boolean).toBe(false);
    });

    it('should execute CONSTRUCT query and return Turtle', async () => {
      const query = `
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        PREFIX schema: <http://schema.org/>
        CONSTRUCT {
          ?concept schema:label ?label .
        }
        WHERE {
          ?concept a skos:Concept ;
                   skos:prefLabel ?label .
        }
      `;

      const resultTurtle = await executeSparqlQuery(TEST_RESOURCE, query);

      expect(resultTurtle).toContain('schema:label');
      expect(typeof resultTurtle).toBe('string');
      // Should be valid Turtle format
      expect(resultTurtle).toMatch(/<http:\/\/example\.org\/concept[12]>/);
    });
  });
});
