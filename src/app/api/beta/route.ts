import { NextRequest, NextResponse } from 'next/server';
import { betaService } from '@/features/beta/beta-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list_tasks';

    if (action === 'list_tasks') {
      const tasks = betaService.listTasks();
      return NextResponse.json({ success: true, tasks });
    }

    if (action === 'get_task') {
      const taskId = searchParams.get('taskId');
      if (!taskId) {
        return NextResponse.json({ success: false, error: 'taskId is required' }, { status: 400 });
      }
      const task = betaService.getTask(taskId);
      if (!task) {
        return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, task });
    }

    if (action === 'evaluation_summary') {
      const aggregate = betaService.getEvaluationAggregate();
      return NextResponse.json({ success: true, aggregate });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal beta API error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Missing action parameter' }, { status: 400 });
    }

    switch (action) {
      case 'grant_consent': {
        const { participantCode, ageConfirmed } = body;
        if (!participantCode) {
          return NextResponse.json({ success: false, error: 'participantCode is required' }, { status: 400 });
        }
        const consent = betaService.grantConsent(participantCode, !!ageConfirmed);
        return NextResponse.json({ success: true, consent });
      }

      case 'start_session': {
        const { participantCode, taskId } = body;
        if (!participantCode || !taskId) {
          return NextResponse.json(
            { success: false, error: 'participantCode and taskId are required' },
            { status: 400 }
          );
        }
        const session = betaService.startSession(participantCode, taskId);
        return NextResponse.json({ success: true, session });
      }

      case 'submit_pretest': {
        const { sessionId, answers } = body;
        if (!sessionId || !Array.isArray(answers)) {
          return NextResponse.json(
            { success: false, error: 'sessionId and answers array are required' },
            { status: 400 }
          );
        }
        const result = betaService.submitPreTest(sessionId, answers);
        return NextResponse.json({ success: true, ...result });
      }

      case 'submit_posttest': {
        const { sessionId, answers, explorationDurationSeconds } = body;
        if (!sessionId || !Array.isArray(answers)) {
          return NextResponse.json(
            { success: false, error: 'sessionId and answers array are required' },
            { status: 400 }
          );
        }
        const result = betaService.submitPostTest(sessionId, answers, explorationDurationSeconds);
        return NextResponse.json({ success: true, ...result });
      }

      case 'submit_feedback': {
        const { feedback } = body;
        if (!feedback || !feedback.sessionId || !feedback.participantCode) {
          return NextResponse.json(
            { success: false, error: 'feedback with sessionId and participantCode is required' },
            { status: 400 }
          );
        }
        const savedFeedback = betaService.submitFeedback(feedback);
        return NextResponse.json({ success: true, feedback: savedFeedback });
      }

      case 'delete_participant_data': {
        const { participantCode } = body;
        if (!participantCode) {
          return NextResponse.json({ success: false, error: 'participantCode is required' }, { status: 400 });
        }
        const delResult = betaService.deleteParticipantData(participantCode);
        return NextResponse.json({ success: true, ...delResult });
      }

      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal beta API error' }, { status: 500 });
  }
}

