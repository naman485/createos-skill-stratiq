// ============================================================================
// GET /api/decks/[id]/download — Stream PPTX file as download
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { readFile, access } from 'fs/promises';
import { join } from 'path';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const startMs = Date.now();
  const method = 'GET';
  const path = `/api/decks/${params.id}/download`;

  try {
    // --- Auth ---
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log(`[${method}] ${path} -> 401 (${Date.now() - startMs}ms)`);
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const userId = (session.user as { id: string }).id;

    // --- Fetch deck ---
    const deck = await prisma.deck.findUnique({
      where: { id: params.id },
    });

    if (!deck) {
      console.log(`[${method}] ${path} -> 404 (${Date.now() - startMs}ms)`);
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Deck not found' } },
        { status: 404 },
      );
    }

    // --- Ownership check ---
    if (deck.userId !== userId) {
      console.log(`[${method}] ${path} -> 403 (${Date.now() - startMs}ms)`);
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not own this deck' } },
        { status: 403 },
      );
    }

    // --- Check deck status ---
    if (deck.status !== 'ready') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DECK_NOT_READY',
            message: `Deck is in "${deck.status}" state. Wait until it is ready.`,
          },
        },
        { status: 422 },
      );
    }

    // --- Check file exists ---
    if (!deck.filePath) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NO_FILE', message: 'Deck file path not found in database' },
        },
        { status: 404 },
      );
    }

    const fullPath = join(process.cwd(), deck.filePath);

    try {
      await access(fullPath);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FILE_MISSING', message: 'PPTX file not found on disk' },
        },
        { status: 404 },
      );
    }

    // --- Read and stream file ---
    const fileBuffer = await readFile(fullPath);

    // Sanitize title for filename
    const safeTitle = deck.title
      .replace(/[^a-zA-Z0-9\s-_]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 100);

    const filename = `${safeTitle}.pptx`;

    // --- Audit log ---
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'download_deck',
        resourceType: 'deck',
        resourceId: deck.id,
        metadata: JSON.stringify({ title: deck.title }),
      },
    });

    console.log(
      `[${method}] ${path} -> 200 (${Date.now() - startMs}ms) size=${fileBuffer.length}`,
    );

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(fileBuffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const processingMs = Date.now() - startMs;
    console.error(`[${method}] ${path} -> 500 (${processingMs}ms)`, error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while downloading the deck',
        },
      },
      { status: 500 },
    );
  }
}
