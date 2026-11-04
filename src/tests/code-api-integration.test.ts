import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/learning/code/route';

test('Code API - Rejects invalid JSON with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/code', {
    method: 'POST',
    body: 'invalid-json{{{',
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /Request body must contain valid JSON/i);
});

test('Code API - Rejects missing question with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/code', {
    method: 'POST',
    body: JSON.stringify({}),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /Provide a string field named "question"/i);
});

test('Code API - Rejects empty string or whitespace-only question with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/code', {
    method: 'POST',
    body: JSON.stringify({ question: '   ' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /Question cannot be empty/i);
});

test('Code API - Rejects question exceeding 4000 characters with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/code', {
    method: 'POST',
    body: JSON.stringify({ question: 'code '.repeat(801) }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /exceeds the 4000-character limit/i);
});

test('Code API - Processes valid CS question against local coding model or handles offline service gracefully', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/code', {
    method: 'POST',
    body: JSON.stringify({
      question: 'Explain binary search with an example array [2,4,6,8,10,12]. Show every iteration.',
    }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 200) {
    assert.equal(data.subject, 'computer_science');
    assert.equal(data.model, 'qwen2.5-coder:1.5b');
    assert.equal(data.verified, false);
    assert.equal(data.source, 'local_model');
    assert.equal(typeof data.answer, 'string');
    assert.ok(data.answer.length > 0);
  } else {
    assert.ok(res.status === 502 || res.status === 503);
    assert.ok(typeof data.error === 'string');
  }
});

