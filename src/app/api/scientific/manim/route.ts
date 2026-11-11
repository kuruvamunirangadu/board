import { NextRequest, NextResponse } from 'next/server';
import { MathManimAdapter } from '@/features/scientific-adapters/adapters/MathManimAdapter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, sceneName, steps } = body;

    const adapter = new MathManimAdapter();
    const result = await adapter.execute({
      action: 'generate_scene',
      payload: {
        title: title || 'Mathematical Derivation',
        sceneName: sceneName || 'MathDerivationScene',
        steps: steps || [],
      },
    });

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Manim generation failed', detail: error.message },
      { status: 500 }
    );
  }
}
