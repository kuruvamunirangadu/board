import { NextRequest, NextResponse } from 'next/server';
import { LessonSharingService } from '@/features/collaboration/LessonSharingService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonId, ownerId, expiresInDays, allowExport } = body;

    if (!lessonId) {
      return NextResponse.json(
        { success: false, error: 'lessonId is required in request body.' },
        { status: 400 }
      );
    }

    const result = await LessonSharingService.createShareLink(lessonId, ownerId || 'author_default', {
      expiresInDays,
      allowExport,
    });

    if (!result.success || !result.data) {
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
      share: result.data,
      shareUrl: `/learn?share=${result.data.shareToken}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');
    const ownerId = searchParams.get('ownerId') || 'author_default';

    if (!lessonId) {
      return NextResponse.json(
        { success: false, error: 'lessonId query parameter is required.' },
        { status: 400 }
      );
    }

    const shares = await LessonSharingService.listSharesForLesson(lessonId, ownerId);
    return NextResponse.json({ success: true, shares });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
