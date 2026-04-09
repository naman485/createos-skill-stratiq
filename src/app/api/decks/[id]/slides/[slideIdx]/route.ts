// ============================================================================
// PUT /api/decks/[id]/slides/[slideIdx] — Update a specific slide
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApiResponse, Slide } from '@/lib/types';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

interface SlideUpdateBody {
  title?: string;
  content?: string;
  imageCaption?: string;
}

function validateUpdateBody(
  body: unknown,
): { valid: true; data: SlideUpdateBody } | { valid: false; message: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, message: 'Request body is required' };
  }

  const b = body as Record<string, unknown>;
  const update: SlideUpdateBody = {};

  if (b.title !== undefined) {
    if (typeof b.title !== 'string' || b.title.trim().length === 0) {
      return { valid: false, message: 'title must be a non-empty string' };
    }
    update.title = b.title.trim();
  }

  if (b.content !== undefined) {
    if (typeof b.content !== 'string') {
      return { valid: false, message: 'content must be a string' };
    }
    update.content = b.content;
  }

  if (b.imageCaption !== undefined) {
    if (typeof b.imageCaption !== 'string') {
      return { valid: false, message: 'imageCaption must be a string' };
    }
    if (b.imageCaption.length > 100) {
      return { valid: false, message: 'imageCaption must be 100 characters or fewer' };
    }
    update.imageCaption = b.imageCaption;
  }

  if (
    update.title === undefined &&
    update.content === undefined &&
    update.imageCaption === undefined
  ) {
    return {
      valid: false,
      message: 'At least one of title, content, or imageCaption must be provided',
    };
  }

  return { valid: true, data: update };
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; slideIdx: string } },
): Promise<NextResponse<ApiResponse<unknown>>> {
  const startMs = Date.now();
  const method = 'PUT';
  const path = `/api/decks/${params.id}/slides/${params.slideIdx}`;

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

    // --- Validate slide index ---
    const slideIdx = parseInt(params.slideIdx, 10);
    if (isNaN(slideIdx) || slideIdx < 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_INPUT', message: 'slideIdx must be a non-negative integer' },
        },
        { status: 400 },
      );
    }

    // --- Parse & Validate body ---
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON body' } },
        { status: 400 },
      );
    }

    const validation = validateUpdateBody(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: validation.message } },
        { status: 400 },
      );
    }

    const updateData = validation.data;

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

    // --- Parse existing slides ---
    let slides: Slide[];
    try {
      slides = JSON.parse(deck.slides) as Slide[];
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'CORRUPTED_DATA', message: 'Failed to parse deck slides' },
        },
        { status: 500 },
      );
    }

    // --- Validate index range ---
    if (slideIdx >= slides.length) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INDEX_OUT_OF_RANGE',
            message: `Slide index ${slideIdx} is out of range. Deck has ${slides.length} slides (0-${slides.length - 1}).`,
          },
        },
        { status: 400 },
      );
    }

    // --- Apply updates ---
    const slide = slides[slideIdx];

    if (updateData.title !== undefined) {
      slide.title = updateData.title;
    }
    if (updateData.content !== undefined) {
      slide.content = updateData.content;
    }
    if (updateData.imageCaption !== undefined) {
      slide.imageCaption = updateData.imageCaption;
    }

    slides[slideIdx] = slide;

    // --- Save to DB ---
    await prisma.deck.update({
      where: { id: params.id },
      data: {
        slides: JSON.stringify(slides),
        version: { increment: 1 },
      },
    });

    // --- Audit log ---
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'update_slide',
        resourceType: 'deck',
        resourceId: params.id,
        metadata: JSON.stringify({
          slideIdx,
          updatedFields: Object.keys(updateData),
        }),
      },
    });

    console.log(
      `[${method}] ${path} -> 200 (${Date.now() - startMs}ms) updated fields: ${Object.keys(updateData).join(', ')}`,
    );

    return NextResponse.json({
      success: true,
      data: {
        slide,
        deckVersion: deck.version + 1,
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
          message: 'An unexpected error occurred while updating the slide',
        },
      },
      { status: 500 },
    );
  }
}
