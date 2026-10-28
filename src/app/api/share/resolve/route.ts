import { NextRequest, NextResponse } from 'next/server';
import { LessonSharingService } from '@/features/collaboration/LessonSharingService';
import { StudentProgressManager } from '@/features/collaboration/StudentProgressManager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') || searchParams.get('shareToken');
    const studentId = searchParams.get('studentId') || 'student_default';

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Share token is required (?token=...).' },
        { status: 400 }
      );
    }

    const result = await LessonSharingService.resolveShareToken(token);

    if (!result.success || !result.data) {
      const status =
        result.errorCode === 'SHARE_REVOKED'
          ? 403
          : result.errorCode === 'SHARE_EXPIRED'
          ? 410
          : result.errorCode === 'SHARE_NOT_FOUND'
          ? 404
          : 500;

      return NextResponse.json(
        { success: false, errorCode: result.errorCode, error: result.errorMessage },
        { status }
      );
    }

    // Resolve student-namespaced progress
    const personalProgress = await StudentProgressManager.getPersonalProgress(
      studentId,
      result.data.lesson.primaryTopic
    );

    return NextResponse.json({
      success: true,
      lesson: result.data.lesson,
      shareRecord: {
        shareId: result.data.record.shareId,
        publishedVersion: result.data.record.publishedVersion,
        ownerId: result.data.record.ownerId,
        allowExport: result.data.record.allowExport,
        accessCount: result.data.record.accessCount,
      },
      studentSession: {
        studentId,
        hasPersonalProgress: !!personalProgress,
        personalProgress,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
