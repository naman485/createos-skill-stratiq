// ============================================================================
// GET /api/decks — List all decks for authenticated user
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<unknown>>> {
  const startMs = Date.now();
  const method = 'GET';
  const path = '/api/decks';

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

    // --- Pagination ---
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20),
    );
    const skip = (page - 1) * limit;

    // --- Query ---
    const [decks, total] = await Promise.all([
      prisma.deck.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          brief: {
            select: {
              id: true,
              originalName: true,
            },
          },
        },
      }),
      prisma.deck.count({ where: { userId } }),
    ]);

    const items = decks.map((deck) => {
      let slideCount = 0;
      try {
        const parsed = JSON.parse(deck.slides);
        slideCount = Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        slideCount = 0;
      }

      return {
        id: deck.id,
        title: deck.title,
        templateId: deck.templateId,
        status: deck.status,
        slideCount,
        briefId: deck.briefId,
        briefTitle: deck.brief?.originalName ?? null,
        reportId: deck.reportId,
        version: deck.version,
        processingMs: deck.processingMs,
        createdAt: deck.createdAt.toISOString(),
        updatedAt: deck.updatedAt.toISOString(),
      };
    });

    const totalPages = Math.ceil(total / limit);

    console.log(
      `[${method}] ${path} -> 200 (${Date.now() - startMs}ms) count=${items.length} total=${total}`,
    );

    return NextResponse.json({
      success: true,
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages,
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
          message: 'An unexpected error occurred while listing decks',
        },
      },
      { status: 500 },
    );
  }
}
