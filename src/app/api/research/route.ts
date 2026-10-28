import { NextRequest, NextResponse } from 'next/server';
import { researchService } from '@/features/research/research-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'protocols';

    if (action === 'protocols') {
      const protocols = researchService.getProtocols();
      return NextResponse.json({ success: true, protocols });
    }

    if (action === 'report') {
      const experimentId = searchParams.get('experimentId') || 'exp-phys-pendulum';
      const report = researchService.getEvaluationReport(experimentId);
      return NextResponse.json({ success: true, report });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal research API error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'start_session') {
      const { participantCode, experimentId, condition } = body;
      if (!participantCode || !experimentId) {
        return NextResponse.json(
          { error: 'participantCode and experimentId are required' },
          { status: 400 }
        );
      }
      const session = researchService.startSession(participantCode, experimentId, condition);
      return NextResponse.json({ success: true, session });
    }

    if (action === 'submit_pre_test') {
      const { sessionId, responses } = body;
      if (!sessionId || !responses) {
        return NextResponse.json({ error: 'sessionId and responses are required' }, { status: 400 });
      }
      const result = researchService.submitPreTest(sessionId, responses);
      return NextResponse.json({ success: true, ...result });
    }

    if (action === 'get_recommendation') {
      const { sessionId, learningObjective } = body;
      if (!sessionId) {
        return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
      }
      const recommendation = researchService.getNextIntervention(sessionId, learningObjective);
      return NextResponse.json({ success: true, recommendation });
    }

    if (action === 'complete_step') {
      const { sessionId, interventionId } = body;
      if (!sessionId || !interventionId) {
        return NextResponse.json(
          { error: 'sessionId and interventionId are required' },
          { status: 400 }
        );
      }
      const session = researchService.completeInterventionStep(sessionId, interventionId);
      return NextResponse.json({ success: true, session });
    }

    if (action === 'submit_post_test') {
      const { sessionId, responses, feedback } = body;
      if (!sessionId || !responses) {
        return NextResponse.json({ error: 'sessionId and responses are required' }, { status: 400 });
      }
      const result = researchService.submitPostTest(sessionId, responses, feedback);
      return NextResponse.json({ success: true, ...result });
    }

    if (action === 'delete_participant') {
      const { participantCode } = body;
      if (!participantCode) {
        return NextResponse.json({ error: 'participantCode is required' }, { status: 400 });
      }
      const result = researchService.deleteParticipant(participantCode);
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ error: `Unsupported POST action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal research API error' },
      { status: 500 }
    );
  }
}

