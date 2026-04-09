// ============================================================================
// POST /api/briefs/upload — Upload & parse a brief document (PDF/DOCX)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { parseDocument } from '@/lib/documents/parser';
import { DocumentParseError } from '@/lib/types';
import type { ApiSuccess, ApiError } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    '.docx',
};
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiSuccess<unknown> | ApiError>> {
  const start = performance.now();
  const method = 'POST';
  const routePath = '/api/briefs/upload';

  try {
    // --- Auth ---
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log(`${method} ${routePath} 401 — unauthenticated`);
      return NextResponse.json(
        {
          success: false as const,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        },
        { status: 401 },
      );
    }

    const userId = (session.user as { id: string }).id;

    // --- Parse multipart form data ---
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        {
          success: false as const,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Expected multipart form data with a "file" field',
          },
        },
        { status: 400 },
      );
    }

    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          success: false as const,
          error: {
            code: 'MISSING_FILE',
            message: 'A "file" field with a PDF or DOCX document is required',
          },
        },
        { status: 400 },
      );
    }

    // --- Validate MIME type ---
    const mimeType = file.type;
    const extension = ALLOWED_MIME_TYPES[mimeType];

    if (!extension) {
      return NextResponse.json(
        {
          success: false as const,
          error: {
            code: 'UNSUPPORTED_FORMAT',
            message: `Unsupported file type: ${mimeType}. Only PDF and DOCX are accepted.`,
          },
        },
        { status: 400 },
      );
    }

    // --- Validate size ---
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false as const,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `File size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds the 100 MB limit`,
          },
        },
        { status: 413 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          success: false as const,
          error: {
            code: 'EMPTY_FILE',
            message: 'The uploaded file is empty',
          },
        },
        { status: 400 },
      );
    }

    // --- Read buffer ---
    const buffer = Buffer.from(await file.arrayBuffer());

    // --- Save to disk ---
    const fileId = uuidv4();
    const filename = `${fileId}${extension}`;

    await mkdir(UPLOADS_DIR, { recursive: true });
    await writeFile(path.join(UPLOADS_DIR, filename), buffer);

    // --- Parse document ---
    let textContent: string;
    let pageCount: number;

    try {
      const parsed = await parseDocument(buffer, mimeType);
      textContent = parsed.text;
      pageCount = parsed.pageCount;
    } catch (err) {
      // Clean up the file if parsing fails
      const fs = await import('fs/promises');
      await fs.unlink(path.join(UPLOADS_DIR, filename)).catch(() => {});

      if (err instanceof DocumentParseError) {
        return NextResponse.json(
          {
            success: false as const,
            error: { code: err.code, message: err.message },
          },
          { status: 422 },
        );
      }
      throw err;
    }

    // --- Create DB record ---
    const brief = await prisma.brief.create({
      data: {
        userId,
        filename,
        originalName: file.name || 'untitled',
        fileSize: file.size,
        mimeType,
        status: 'parsed',
        textContent,
        pageCount,
      },
    });

    // --- Audit log ---
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'upload_brief',
        resourceType: 'brief',
        resourceId: brief.id,
        metadata: JSON.stringify({
          originalName: file.name,
          fileSize: file.size,
          mimeType,
          pageCount,
        }),
      },
    });

    const durationMs = Math.round(performance.now() - start);
    console.log(`${method} ${routePath} 201 — ${durationMs}ms`);

    return NextResponse.json(
      {
        success: true as const,
        data: {
          id: brief.id,
          filename: brief.originalName,
          mimeType: brief.mimeType,
          fileSize: brief.fileSize,
          pageCount: brief.pageCount,
          status: brief.status,
          textLength: textContent.length,
          createdAt: brief.createdAt.toISOString(),
        },
        meta: { processingMs: durationMs },
      },
      { status: 201 },
    );
  } catch (error) {
    const durationMs = Math.round(performance.now() - start);
    console.error(`${method} ${routePath} 500 — ${durationMs}ms`, error);

    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while processing the upload',
        },
      },
      { status: 500 },
    );
  }
}
