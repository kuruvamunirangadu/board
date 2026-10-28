import { NextRequest, NextResponse } from 'next/server';
import { BoardFeedParser, KNOWN_FORMULA_REGISTRY } from '@/features/intelligence/board-feed-parser';
import { telemetryStore } from '@/lib/telemetry/telemetry-store';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { shapes = [], formulaText } = body;

    let recognized = null;

    if (formulaText) {
      const match = KNOWN_FORMULA_REGISTRY.find(
        (f) =>
          f.rawText.toLowerCase().replace(/\s+/g, '') ===
          formulaText.toLowerCase().replace(/\s+/g, '')
      );
      recognized = match || KNOWN_FORMULA_REGISTRY[0];
    } else if (shapes.length > 0) {
      recognized = BoardFeedParser.parseBoardFeed(shapes);
    }

    const durationMs = Date.now() - startTime;

    telemetryStore.logEvent({
      level: 'success',
      category: 'intelligence',
      endpoint: '/api/board/feed',
      component: 'BoardFeedAPI',
      action: 'parse_and_solve',
      details: {
        shapeCount: shapes.length,
        recognizedFormula: recognized?.normalizedFormula,
        solvedResult: recognized?.solvedResult,
      },
      durationMs,
      statusCode: 200,
    });

    return NextResponse.json({
      success: true,
      recognizedFormula: recognized,
      availableRegistry: KNOWN_FORMULA_REGISTRY,
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    telemetryStore.logEvent({
      level: 'error',
      category: 'intelligence',
      endpoint: '/api/board/feed',
      component: 'BoardFeedAPI',
      action: 'parse_and_solve_error',
      details: error.message,
      durationMs,
      statusCode: 500,
      errorTrace: error.stack,
    });

    return NextResponse.json(
      { success: false, error: error.message || 'Board feed parsing error' },
      { status: 500 }
    );
  }
}

