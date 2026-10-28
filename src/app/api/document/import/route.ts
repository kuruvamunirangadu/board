/**
 * VisiOS — Document Import API Route
 * Step 11: Server-side ingestion endpoint for student study documents.
 * Validates file integrity, enforces 10 MB limit, and extracts page-grounded structure.
 */

import { NextResponse } from 'next/server';
import { DocumentIngestionService } from '@/features/documents/DocumentIngestionService';
import { DocumentPersistenceService } from '@/features/documents/DocumentPersistenceService';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Handling 1: multipart/form-data
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file || typeof file === 'string') {
        return NextResponse.json(
          { error: 'No file uploaded in the request.' },
          { status: 400 }
        );
      }

      const fileObj = file as File;
      const arrayBuffer = await fileObj.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const validation = DocumentIngestionService.validateFile(bytes, fileObj.name);
      if (!validation.isValid) {
        return NextResponse.json(
          {
            error: validation.errorMessage || 'Invalid file.',
            errorCode: validation.errorCode,
          },
          { status: 400 }
        );
      }

      const document = await DocumentIngestionService.ingestDocument(bytes, fileObj.name);
      await DocumentPersistenceService.saveDocument(document);

      return NextResponse.json({ success: true, document });
    }

    // Handling 2: application/json
    const body = await request.json();
    const rawContent = body.content || '';
    const fileName = body.fileName || 'document.txt';

    const validation = DocumentIngestionService.validateFile(rawContent, fileName);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: validation.errorMessage || 'Invalid file.',
          errorCode: validation.errorCode,
        },
        { status: 400 }
      );
    }

    const document = await DocumentIngestionService.ingestDocument(rawContent, fileName);
    await DocumentPersistenceService.saveDocument(document);

    return NextResponse.json({ success: true, document });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error while processing document.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const documents = await DocumentPersistenceService.listDocuments();
  return NextResponse.json({ documents });
}

