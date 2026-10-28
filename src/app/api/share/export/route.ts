import { NextRequest, NextResponse } from 'next/server';
import { LessonSharingService } from '@/features/collaboration/LessonSharingService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonId, requesterId } = body;

    if (!lessonId) {
      return NextResponse.json(
        { success: false, error: 'lessonId is required in request body.' },
        { status: 400 }
      );
    }

    const result = await LessonSharingService.exportLessonPackage(lessonId, requesterId);

    if (!result.success) {
      const status =
        result.errorCode === 'CANNOT_SHARE_DRAFT'
          ? 400
          : result.errorCode === 'LESSON_NOT_FOUND'
          ? 404
          : 500;
      return NextResponse.json(
        { success: false, errorCode: result.errorCode, error: result.errorMessage },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      package: result.data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { package: pkg, studentId } = body;

    if (!pkg) {
      return NextResponse.json(
        { success: false, error: 'package is required in request body.' },
        { status: 400 }
      );
    }

    const result = await LessonSharingService.importLessonPackage(pkg, studentId);

    if (!result.success) {
      const status =
        result.errorCode === 'INVALID_PACKAGE' || result.errorCode === 'VALIDATION_FAILED'
          ? 400
          : 500;
      return NextResponse.json(
        { success: false, errorCode: result.errorCode, error: result.errorMessage },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      importedLesson: result.data,
      message: 'Lesson successfully validated and imported into workspace library.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

