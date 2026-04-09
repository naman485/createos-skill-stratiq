// ============================================================================
// GET /api/briefs — List all briefs for the authenticated user
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApiSuccess, ApiError } from '@/lib/types';

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiSuccess<unknown> | ApiError>> {
  const start = performance.now();
  const method = 'GET';
  const routePath = '/api/briefs';

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

    // --- Pagination params ---
    const url = new URL(request.url);
    const skip = Math.max(0, parseInt(url.searchParams.get('skip') || '0', 10) || 0);
    const take = Math.min(100, Math.max(1, parseInt(url.searchParams.get('take') || '20', 10) || 20));

    // --- Query ---
    const [briefs, total] = await Promise.all([
      prisma.brief.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          _count: {
            select: { reports: true },
          },
        },
      }),
      prisma.brief.count({ where: { userId } }),
    ]);

    const data = briefs.map((brief) => ({
      id: brief.id,
      filename: brief.originalName,
      mimeType: brief.mimeType,
      fileSize: brief.fileSize,
      pageCount: brief.pageCount,
      status: brief.status,
      reportsCount: brief._count.reports,
      createdAt: brief.createdAt.toISOString(),
      updatedAt: brief.updatedAt.toISOString(),
    }));

    const durationMs = Math.round(performance.now() - start);
    console.log(`${method} ${routePath} 200 — ${durationMs}ms (${data.length} results)`);

    return NextResponse.json({
      success: true as const,
      data,
      meta: {
        total,
        skip,
        take,
        processingMs: durationMs,
      },
    });
  } catch (error) {
    const durationMs = Math.round(performance.now() - start);
    console.error(`${method} ${routePath} 500 — ${durationMs}ms`, error);

    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while fetching briefs',
        },
      },
      { status: 500 },
    );
  }
}
