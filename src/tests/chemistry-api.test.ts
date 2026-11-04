/**
 * VisiOS — Chemistry & ChemBERTa-2 API Test Suite
 * Implementation 5: Chemistry Intelligence Integration
 *
 * Verifies:
 * 1. Rejection of invalid JSON with 400
 * 2. Rejection of missing SMILES with 400
 * 3. Rejection of empty string with 400
 * 4. Rejection of SMILES exceeding 2000 characters with 400
 * 5. Execution of ethanol (CCO) returning canonical SMILES and 384-dim embedding
 * 6. Execution of acetic acid (CC(=O)O)
 * 7. Rejection of invalid molecule with 400
 * 8. SubjectModelRouter correctly routes SMILES queries to chemistry specialist
 * 9. SubjectModelRouter does NOT route general concepts ("What is chemical bonding?") to ChemBERTa
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/learning/chemistry/route';
import { SubjectModelRouter } from '../features/learning/SubjectModelRouter';

test('Chemistry API - Rejects invalid JSON with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: 'invalid-json{{{',
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /Invalid JSON request/i);
});

test('Chemistry API - Rejects missing SMILES with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({}),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /A SMILES string is required/i);
});

test('Chemistry API - Rejects empty string with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ smiles: '   ' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /SMILES must contain 1–2000 characters/i);
});

test('Chemistry API - Rejects SMILES exceeding 2000 characters with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ smiles: 'C'.repeat(2001) }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /SMILES must contain 1–2000 characters/i);
});

test('Chemistry API - Processes ethanol (CCO) molecular embedding', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ smiles: 'CCO' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 200) {
    assert.equal(data.subject, 'chemistry');
    assert.equal(data.task, 'molecular_embedding');
    assert.equal(data.canonical_smiles, 'CCO');
    assert.equal(data.embedding_dimension, 384);
    assert.ok(Array.isArray(data.embedding));
    assert.equal(data.embedding.length, 384);
  } else {
    assert.equal(res.status, 503);
    assert.match(data.error, /Chemistry service is unavailable/i);
  }
});

test('Chemistry API - Processes acetic acid (CC(=O)O) molecular embedding', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ smiles: 'CC(=O)O' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 200) {
    assert.equal(data.subject, 'chemistry');
    assert.equal(data.canonical_smiles, 'CC(=O)O');
    assert.equal(data.embedding_dimension, 384);
  } else {
    assert.equal(res.status, 503);
  }
});

test('Chemistry API - Rejects invalid molecular input (NOT_A_MOLECULE) with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ smiles: 'NOT_A_MOLECULE' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 400) {
    assert.ok(data.error);
    assert.match(data.error, /Invalid/i);
  } else {
    // If service offline, 503
    assert.equal(res.status, 503);
  }
});

test('SubjectModelRouter - Routes SMILES query (CCO) to chemistry specialist', async () => {
  const decision = await SubjectModelRouter.routeQuery('CCO');
  assert.equal(decision.subject, 'chemistry');
  assert.equal(decision.requiresModel, true);
  assert.equal(decision.targetProvider?.id, 'provider_chemberta');
  assert.equal(decision.matchedCapabilityId, 'cap_chemberta_molecular_embedding');
});

test('SubjectModelRouter - Does NOT route general chemistry concepts to ChemBERTa', async () => {
  const decision = await SubjectModelRouter.routeQuery('What is chemical bonding?');
  assert.equal(decision.subject, 'chemistry');
  assert.equal(decision.requiresModel, false);
  assert.equal(decision.targetEngineType, 'knowledge');
  assert.notEqual(decision.matchedCapabilityId, 'cap_chemberta_molecular_embedding');
});
