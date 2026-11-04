/**
 * VisiOS — Plant Genomics & BOTANIC-1 API Test Suite
 * Implementation 4: BOTANIC-1 Plant Genomics Integration
 *
 * Verifies:
 * 1. Rejection of invalid JSON with 400
 * 2. Rejection of missing sequence with 400
 * 3. Rejection of invalid characters (e.g. ATGX123) with 400
 * 4. Rejection of sequence exceeding 2048 characters with 400
 * 5. Rejection of empty string with 400
 * 6. Execution of valid sequence against BOTANIC service or graceful 503 fallback
 * 7. SubjectModelRouter correctly routes DNA sequences to plant_genomics
 * 8. SubjectModelRouter does NOT route ordinary biology ("What is photosynthesis?") to plant_genomics
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/learning/plant-genomics/route';
import { SubjectModelRouter } from '../features/learning/SubjectModelRouter';

test('Plant Genomics API - Rejects invalid JSON with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/plant-genomics', {
    method: 'POST',
    body: 'invalid-json{{{',
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /Invalid JSON request/i);
});

test('Plant Genomics API - Rejects missing sequence with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/plant-genomics', {
    method: 'POST',
    body: JSON.stringify({}),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /A DNA sequence is required/i);
});

test('Plant Genomics API - Rejects empty string or whitespace with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/plant-genomics', {
    method: 'POST',
    body: JSON.stringify({ sequence: '   ' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /Sequence must contain 1–2048 characters/i);
});

test('Plant Genomics API - Rejects invalid nucleotide characters (e.g. ATGX123) with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/plant-genomics', {
    method: 'POST',
    body: JSON.stringify({ sequence: 'ATGX123' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /Only A, C, G, T and N are accepted/i);
});

test('Plant Genomics API - Rejects sequence exceeding 2048 characters with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/plant-genomics', {
    method: 'POST',
    body: JSON.stringify({ sequence: 'A'.repeat(2049) }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /Sequence must contain 1–2048 characters/i);
});

test('Plant Genomics API - Processes valid DNA sequence or returns graceful 503 when service offline', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/plant-genomics', {
    method: 'POST',
    body: JSON.stringify({ sequence: 'ATGCGTACGTAGCTAGCTAGCTAG' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 200) {
    assert.equal(data.subject, 'plant_genomics');
    assert.equal(data.task, 'sequence_embedding');
    assert.equal(data.embedding_dimension, 1024);
    assert.ok(Array.isArray(data.embedding));
    assert.equal(data.embedding.length, 1024);
  } else {
    assert.equal(res.status, 503);
    assert.match(data.error, /BOTANIC service is unavailable/i);
  }
});

test('SubjectModelRouter - Routes pure DNA sequence to plant_genomics specialist', async () => {
  const decision = await SubjectModelRouter.routeQuery('ATGCGTACGTAGCTAGCTAGCTAG');
  assert.equal(decision.subject, 'plant_genomics');
  assert.equal(decision.requiresModel, true);
  assert.equal(decision.targetProvider?.id, 'provider_botanic');
  assert.equal(decision.matchedCapabilityId, 'cap_plant_genomics_embedding');
});

test('SubjectModelRouter - Does NOT route ordinary biology questions like "What is photosynthesis?" to plant_genomics', async () => {
  const decision = await SubjectModelRouter.routeQuery('What is photosynthesis?');
  assert.equal(decision.subject, 'biology');
  assert.equal(decision.requiresModel, false);
  assert.equal(decision.targetEngineType, 'knowledge');
  assert.notEqual(decision.subject, 'plant_genomics');
});
