import { describe, it, expect } from 'vitest';

/**
 * Test for E2E Credential Loading
 *
 * Validates that client credentials are loaded from environment variables
 * instead of being hardcoded in test files.
 *
 * Required environment variables:
 * - TEST_CLIENT_ID: OAuth client ID for test authentication
 * - TEST_CLIENT_SECRET: OAuth client secret for test authentication
 */
describe('E2E Test Credentials', () => {
  it('should load client credentials from environment variables', () => {
    const clientId = process.env.TEST_CLIENT_ID;
    const clientSecret = process.env.TEST_CLIENT_SECRET;

    expect(clientId, 'TEST_CLIENT_ID environment variable must be set').toBeDefined();
    expect(clientId, 'TEST_CLIENT_ID must not be empty').not.toBe('');

    expect(clientSecret, 'TEST_CLIENT_SECRET environment variable must be set').toBeDefined();
    expect(clientSecret, 'TEST_CLIENT_SECRET must not be empty').not.toBe('');
  });
});
