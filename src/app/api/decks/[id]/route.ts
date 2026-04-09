// ============================================================================
// GET & DELETE /api/decks/[id] — Single deck operations
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApiResponse, Slide } from '@/lib/types';
import { unlink } from 'fs/promises';
import { join } from 'path';

// ---------------------------------------------------------------------------
// GET — Retrieve a deck with all slide data
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse<unknown>>> {
  const startMs = Date.now();
  const method = 'GET';
  const path = `/api/decks/${params.id}`;

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

    // --- Fetch ---
    const deck = await prisma.deck.findUnique({
      where: { id: params.id },
      include: {
        brief: {
          select: {
            id: true,
            originalName: true,
          },
        },
        report: {
          select: {
            id: true,
            trackFilter: true,
            cardCount: true,
          },
        },
      },
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

    // --- Parse slides ---
    let slides: Slide[] = [];
    try {
      slides = JSON.parse(deck.slides) as Slide[];
    } catch {
      slides = [];
    }

    console.log(`[${method}] ${path} -> 200 (${Date.now() - startMs}ms)`);

    return NextResponse.json({
      success: true,
      data: {
        id: deck.id,
        title: deck.title,
        templateId: deck.templateId,
        status: deck.status,
        slides,
        slideCount: slides.length,
        filePath: deck.filePath,
        briefId: deck.briefId,
        briefTitle: deck.brief?.originalName ?? null,
        reportId: deck.reportId,
        reportMeta: deck.report
          ? {
              trackFilter: deck.report.trackFilter,
              cardCount: deck.report.cardCount,
            }
          : null,
        version: deck.version,
        processingMs: deck.processingMs,
        createdAt: deck.createdAt.toISOString(),
        updatedAt: deck.updatedAt.toISOString(),
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
          message: 'An unexpected error occurred while fetching the deck',
        },
      },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE — Remove a deck record + PPTX file
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse<unknown>>> {
  const startMs = Date.now();
  const method = 'DELETE';
  const path = `/api/decks/${params.id}`;

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

    // --- Fetch ---
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

    // --- Delete PPTX file from disk ---
    if (deck.filePath) {
      try {
        const fullPath = join(process.cwd(), deck.filePath);
        await unlink(fullPath);
      } catch (fsError) {
        // File may already be deleted — log but don't fail
        console.warn(
          `[${method}] ${path} -> Failed to delete file ${deck.filePath}:`,
          fsError,
        );
      }
    }

    // --- Delete DB record ---
    await prisma.deck.delete({ where: { id: params.id } });

    // --- Audit log ---
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'delete_deck',
        resourceType: 'deck',
        resourceId: params.id,
        metadata: JSON.stringify({ title: deck.title }),
      },
    });

    console.log(`[${method}] ${path} -> 200 (${Date.now() - startMs}ms)`);

    return NextResponse.json({
      success: true,
      data: { id: params.id, deleted: true },
    });
  } catch (error) {
    const processingMs = Date.now() - startMs;
    console.error(`[${method}] ${path} -> 500 (${processingMs}ms)`, error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while deleting the deck',
        },
      },
      { status: 500 },
    );
  }
}
