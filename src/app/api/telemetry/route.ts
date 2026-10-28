import { NextRequest, NextResponse } from 'next/server';
import { telemetryStore } from '@/lib/telemetry/telemetry-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const category = searchParams.get('category') || undefined;

    const logs = telemetryStore.getRecentLogs(limit, category);
    const stats = telemetryStore.getStats();

    return NextResponse.json({
      success: true,
      stats,
      logs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Telemetry retrieval error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { level = 'info', category = 'api', endpoint, component = 'ClientApp', action, details, durationMs, statusCode, errorTrace } = body;

    const logged = telemetryStore.logEvent({
      level,
      category,
      endpoint,
      component,
      action: action || 'client_log',
      details,
      durationMs,
      statusCode,
      errorTrace,
    });

    return NextResponse.json({ success: true, entry: logged });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Telemetry logging error' },
      { status: 500 }
    );
  }
}
