import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/features/analytics/analytics-service';
import { analyticsStore } from '@/features/analytics/analytics-store';
import { AssessmentAttemptRecord, RetakePolicy } from '@/types/analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'student_snapshot';
    const learnerId = searchParams.get('learnerId') || 'learner-kai';
    const role = searchParams.get('role') || 'participant';
    const subjectId = searchParams.get('subjectId') || 'physics';
    const retakePolicy = (searchParams.get('retakePolicy') as RetakePolicy) || 'all_attempts';
    const classId = searchParams.get('classId') || 'class-phys-101';

    if (action === 'student_snapshot') {
      const snapshot = analyticsService.getStudentSnapshot(learnerId, {
        subjectId,
        retakePolicy,
      });
      return NextResponse.json({ success: true, snapshot });
    }

    if (action === 'instructor_analytics') {
      if (role !== 'instructor' && role !== 'host') {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden: Instructor analytics require verified instructor or host authorization.',
          },
          { status: 403 }
        );
      }
      const instructorData = analyticsService.getInstructorClassAnalytics(role, classId, subjectId);
      return NextResponse.json({ success: true, instructorData });
    }

    if (action === 'question_analysis') {
      const allAttempts = analyticsStore.getAttempts({ subjectId });
      const questionPerformances = analyticsService.computeQuestionPerformances(allAttempts);
      return NextResponse.json({ success: true, questionPerformances });
    }

    if (action === 'export_report') {
      const exportRole = (searchParams.get('exportRole') as 'student' | 'instructor') || 'student';
      if (exportRole === 'instructor' && role !== 'instructor' && role !== 'host') {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Cannot export instructor report without authorization' },
          { status: 403 }
        );
      }
      const target = exportRole === 'student' ? learnerId : classId;
      const report = analyticsService.generateReportExport(exportRole, target, retakePolicy);
      return NextResponse.json({ success: true, report });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal analytics error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, attempt } = body;

    if (action === 'record_attempt') {
      if (!attempt || !attempt.id || !attempt.learnerId || !attempt.conceptId) {
        return NextResponse.json(
          { success: false, error: 'Invalid attempt record: id, learnerId, and conceptId are required' },
          { status: 400 }
        );
      }

      const result = analyticsStore.recordAttempt(attempt as AssessmentAttemptRecord);
      return NextResponse.json({
        success: true,
        isDuplicate: result.isDuplicate,
        attempt: result.attempt,
      });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal analytics error' }, { status: 500 });
  }
}

