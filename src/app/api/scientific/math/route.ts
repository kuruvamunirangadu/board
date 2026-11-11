import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MATH_SERVICE_URL = process.env.MATH_SERVICE_URL ?? 'http://127.0.0.1:8300';
const OPERATIONS = new Set(['simplify', 'differentiate', 'integrate', 'solve', 'plot']);

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'A valid request body is required.' }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  if (typeof input.expression !== 'string' || !input.expression.trim() || input.expression.length > 500) {
    return NextResponse.json({ error: 'Expression must contain 1–500 characters.' }, { status: 400 });
  }
  const operation = typeof input.operation === 'string' ? input.operation : 'simplify';
  if (!OPERATIONS.has(operation)) {
    return NextResponse.json({ error: 'Unsupported mathematical operation.' }, { status: 400 });
  }

  try {
    const response = await fetch(`${MATH_SERVICE_URL}/api/v1/math/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(15_000),
      cache: 'no-store',
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Scientific math service is unavailable.' }, { status: 502 });
  }
}
