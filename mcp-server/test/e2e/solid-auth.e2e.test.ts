import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { initializeSolidSession, readRdfResource, appendTriples } from '../../src/index.js';
import { Session } from '@inrupt/solid-client-authn-node';
import { waitForCSS } from './check-css.js';

/**
 * E2E Tests for Solid Authentication and Operations
 *
 * PREREQUISITES:
 * - Community Solid Server must be running on http://localhost:3000
 * - Start it with: cd ../app && bun run solid
 *
 * These tests verify:
 * - Real authentication against CSS
 * - Actual RDF read/write operations
 * - Session persistence and auth headers
 */
describe('E2E: Solid Authentication and Operations', () => {
  const CSS_URL = process.env.TEST_CSS_URL || 'http://localhost:3000';
  const POD_URL = process.env.TEST_POD_URL || `${CSS_URL}/dev/`;
  const WEB_ID = process.env.TEST_WEB_ID || `${CSS_URL}/dev/profile/card#me`;
  const TEST_RESOURCE = `${POD_URL}test-${Date.now()}.ttl`;

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
  });

  afterEach(async () => {
    // Cleanup: Try to delete test resource
    try {
      await session.fetch(TEST_RESOURCE, { method: 'DELETE' });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should successfully initialize session with CSS', async () => {
    expect(session).toBeDefined();
    expect(session.info.isLoggedIn).toBe(true);
    expect(session.info.webId).toBe(WEB_ID);
  });

  it('should write RDF data to pod', async () => {
    const testTriples = `
@prefix ex: <http://example.org/> .
@prefix schema: <http://schema.org/> .

ex:testConcept a schema:Thing ;
    schema:name "E2E Test Concept" ;
    schema:dateCreated "2026-01-11"^^<http://www.w3.org/2001/XMLSchema#date> .
`;

    // Write data
    await appendTriples(TEST_RESOURCE, testTriples);

    // Verify by reading back
    const content = await readRdfResource(TEST_RESOURCE);
    expect(content).toContain('E2E Test Concept');
    expect(content).toContain('schema:Thing');
  });

  it('should use authenticated fetch with valid session', async () => {
    // Write some data first
    const testData = `
@prefix ex: <http://example.org/> .
ex:authTest ex:verified true .
`;
    await appendTriples(TEST_RESOURCE, testData);

    // Read using session.fetch directly
    const response = await session.fetch(TEST_RESOURCE);

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);

    const body = await response.text();
    expect(body).toContain('ex:authTest');
    expect(body).toContain('ex:verified');
  });

  it('should handle non-existent resources gracefully', async () => {
    const nonExistentUrl = `${POD_URL}does-not-exist-${Date.now()}.ttl`;

    await expect(async () => {
      await readRdfResource(nonExistentUrl);
    }).rejects.toThrow();
  });
});
