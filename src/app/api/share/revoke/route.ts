import { NextRequest, NextResponse } from 'next/server';
import { LessonSharingService } from '@/features/collaboration/LessonSharingService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shareToken, requesterId } = body;

    if (!shareToken) {
      return NextResponse.json(
        { success: false, error: 'shareToken is required in request body.' },
        { status: 400 }
      );
    }

    const result = await LessonSharingService.revokeShareLink(shareToken, requesterId || 'anonymous');

    if (!result.success) {
      const status =
        result.errorCode === 'UNAUTHORIZED'
          ? 403
          : result.errorCode === 'SHARE_NOT_FOUND'
          ? 404
          : 500;

      return NextResponse.json(
        { success: false, errorCode: result.errorCode, error: result.errorMessage },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Share link successfully revoked.',
      share: result.data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

