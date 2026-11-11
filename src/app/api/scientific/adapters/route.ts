import { NextRequest, NextResponse } from 'next/server';
import { ScientificEngineRegistry } from '@/features/scientific-adapters';

export async function GET() {
  try {
    const registry = ScientificEngineRegistry.getInstance();
    const metadata = registry.getAllMetadata();
    const health = await registry.checkAllHealth();

    return NextResponse.json({
      service: 'visios-scientific-adapters',
      timestamp: new Date().toISOString(),
      adapters: metadata.map((m) => ({
        ...m,
        healthStatus: health[m.id] || m.healthStatus,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to query scientific adapter registry', detail: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adapterId, action, payload, timeoutMs } = body;

    if (!adapterId || !action) {
      return NextResponse.json(
        { error: 'adapterId and action are required fields' },
        { status: 400 }
      );
    }

    const registry = ScientificEngineRegistry.getInstance();
    const result = await registry.execute(adapterId, {
      action,
      payload: payload || {},
      timeoutMs,
    });

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal execution error in scientific adapter', detail: error.message },
      { status: 500 }
    );
  }
}
