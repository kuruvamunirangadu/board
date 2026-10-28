import { NextResponse } from 'next/server';
import { handleKnowledgeQuery, KnowledgeApiResult, defaultAttribution } from '@/features/knowledge/knowledge-client';

export type {
  NormalizedKnowledgeResult,
  KnowledgeMatch,
  AlternativeMatch,
  KnowledgeApiResult,
} from '@/features/knowledge/knowledge-client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('query') || searchParams.get('q') || '';
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 5, 1), 10) : 5;

  const result = await handleKnowledgeQuery(rawQuery, limit);
  return NextResponse.json(result, {
    status: result.status === 'invalid_input' ? 400 : 200,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawQuery = body.query || body.q || '';
    const limit = typeof body.limit === 'number' ? Math.min(Math.max(body.limit, 1), 10) : 5;

    const result = await handleKnowledgeQuery(rawQuery, limit);
    return NextResponse.json(result, {
      status: result.status === 'invalid_input' ? 400 : 200,
    });
  } catch {
    return NextResponse.json(
      {
        query: '',
        results: [],
        error: 'Invalid JSON request body.',
        found: false,
        status: 'invalid_input',
        attribution: defaultAttribution(),
        retrievalTimestamp: Date.now(),
        cached: false,
        errorMessage: 'Invalid JSON request body.',
      } satisfies KnowledgeApiResult,
      { status: 400 }
    );
  }
}
