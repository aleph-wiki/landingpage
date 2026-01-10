// Example: Querying RDF sources with Comunica SPARQL
// This works with file:// URLs, HTTP URLs, and SPARQL endpoints

import { QueryEngine } from '@comunica/query-sparql';

const engine = new QueryEngine();

// Example 1: Query a local Solid pod
export async function queryLocalPod() {
  const query = `
    SELECT ?subject ?predicate ?object WHERE {
      ?subject ?predicate ?object .
    } LIMIT 10
  `;

  const bindingsStream = await engine.queryBindings(query, {
    sources: ['http://localhost:3000/'],
    // Optional: Add authentication
    // fetch: authenticatedFetch
  });

  const bindings = await bindingsStream.toArray();
  return bindings.map(binding => ({
    subject: binding.get('subject').value,
    predicate: binding.get('predicate').value,
    object: binding.get('object').value,
  }));
}

// Example 2: Query across multiple Solid pods
export async function queryMultiplePods() {
  const query = `
    SELECT ?name ?email WHERE {
      ?person foaf:name ?name ;
              foaf:mbox ?email .
    }
  `;

  const bindingsStream = await engine.queryBindings(query, {
    sources: [
      'http://localhost:3000/profile/card',
      'https://example.pod.com/profile/card',
      // Add any Solid pod URLs here
    ],
  });

  const bindings = await bindingsStream.toArray();
  return bindings.map(binding => ({
    name: binding.get('name')?.value,
    email: binding.get('email')?.value,
  }));
}

// Example 3: Construct queries to transform data
export async function constructGraph() {
  const query = `
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    CONSTRUCT {
      ?person foaf:name ?name .
    } WHERE {
      ?person foaf:name ?name .
    }
  `;

  const quadStream = await engine.queryQuads(query, {
    sources: ['http://localhost:3000/'],
  });

  const quads = await quadStream.toArray();
  return quads;
}

// Example 4: With Solid authentication
export async function queryWithAuth(authenticatedFetch) {
  const query = `
    SELECT ?resource WHERE {
      ?resource a <http://www.w3.org/ns/ldp#Resource> .
    } LIMIT 10
  `;

  const bindingsStream = await engine.queryBindings(query, {
    sources: ['http://localhost:3000/private/'],
    fetch: authenticatedFetch, // Pass your authenticated fetch function
  });

  const bindings = await bindingsStream.toArray();
  return bindings.map(binding => binding.get('resource').value);
}

// Example 5: Ask queries (boolean results)
export async function askQuery() {
  const query = `
    ASK {
      ?s ?p ?o .
    }
  `;

  const result = await engine.queryBoolean(query, {
    sources: ['http://localhost:3000/'],
  });

  return result; // true or false
}

// Performance tip: Comunica optimizes queries across multiple sources
// It only fetches what's needed and can execute queries in parallel
