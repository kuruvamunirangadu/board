import { NextRequest, NextResponse } from 'next/server';
import { AIGenerationService } from '@/features/authoring/ai-generator';
import { AIGenerationRequest, SectionRegenRequest, AIGenerationProposal } from '@/types/ai-authoring';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // 1. Guard against oversized payloads (> 64KB)
    if (rawBody.length > 64 * 1024) {
      return NextResponse.json(
        { error: 'Payload size exceeds 64KB limit.' },
        { status: 413 }
      );
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request format.' },
        { status: 400 }
      );
    }

    const { action } = body;

    // Route Action: Generate Full Module Proposal
    if (action === 'generate') {
      const genRequest: AIGenerationRequest = body.request;
      if (!genRequest || !genRequest.topicTitle || !genRequest.topicTitle.trim()) {
        return NextResponse.json(
          { error: 'Field "topicTitle" is required.' },
          { status: 400 }
        );
      }

      const proposal = await AIGenerationService.generateModule(genRequest);
      return NextResponse.json({ success: true, proposal });
    }

    // Route Action: Section-level Regeneration
    if (action === 'regenerate_section') {
      const regenRequest: SectionRegenRequest = body.request;
      const currentProposal: AIGenerationProposal = body.currentProposal;

      if (!regenRequest || !currentProposal) {
        return NextResponse.json(
          { error: 'Both "request" and "currentProposal" are required for section regeneration.' },
          { status: 400 }
        );
      }

      const updated = await AIGenerationService.regenerateSection(regenRequest, currentProposal);
      return NextResponse.json({ success: true, proposal: updated });
    }

    return NextResponse.json(
      { error: `Unknown action: "${action}". Supported actions are "generate" and "regenerate_section".` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('AI Authoring API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal AI service error.' },
      { status: 500 }
    );
  }
}

