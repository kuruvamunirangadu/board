import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/learning/math/route';

test('Math API - Rejects invalid JSON with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/math', {
    method: 'POST',
    body: 'invalid-json{{{',
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /Invalid JSON request format/i);
});

test('Math API - Rejects missing question with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/math', {
    method: 'POST',
    body: JSON.stringify({}),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /Missing required field "question"/i);
});

test('Math API - Rejects empty string or whitespace-only question with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/math', {
    method: 'POST',
    body: JSON.stringify({ question: '   ' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /must be a non-empty string/i);
});

test('Math API - Rejects question exceeding 4000 characters with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/math', {
    method: 'POST',
    body: JSON.stringify({ question: 'x'.repeat(4001) }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /exceeds maximum allowed length of 4000/i);
});

test('Math API - Processes valid question against local model or handles offline service gracefully', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/math', {
    method: 'POST',
    body: JSON.stringify({ question: 'Solve x^2 - 5x + 6 = 0' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 200) {
    // Ollama is online and returned successful inference
    assert.equal(data.subject, 'mathematics');
    assert.equal(typeof data.model, 'string');
    assert.equal(data.verified, false);
    assert.equal(data.source, 'local_model');
    assert.equal(typeof data.answer, 'string');
    assert.ok(data.answer.length > 0);
  } else {
    // If Ollama is unavailable or timed out in CI/environment
    assert.ok(res.status === 502 || res.status === 503);
    assert.ok(typeof data.error === 'string');
  }
});
