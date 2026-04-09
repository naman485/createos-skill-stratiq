// ============================================================================
// GET  /api/briefs/:id — Get a single brief with its insight reports
// DELETE /api/briefs/:id — Delete a brief and all associated resources
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApiSuccess, ApiError, InsightCard } from '@/lib/types';
import { unlink } from 'fs/promises';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// ---------------------------------------------------------------------------
// Shared: verify brief ownership
// ---------------------------------------------------------------------------

async function getOwnedBrief(
  briefId: string,
  userId: string,
) {
  const brief = await prisma.brief.findUnique({
    where: { id: briefId },
    include: {
      reports: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!brief) return { brief: null, error: 'NOT_FOUND' as const };
  if (brief.userId !== userId) return { brief: null, error: 'FORBIDDEN' as const };
  return { brief, error: null };
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<ApiSuccess<unknown> | ApiError>> {
  const start = performance.now();
  const method = 'GET';
  const routePath = `/api/briefs/${params.id}`;

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

    // --- Fetch & ownership check ---
    const { brief, error } = await getOwnedBrief(params.id, userId);

    if (error === 'NOT_FOUND') {
      return NextResponse.json(
        {
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Brief not found' },
        },
        { status: 404 },
      );
    }

    if (error === 'FORBIDDEN') {
      return NextResponse.json(
        {
          success: false as const,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this brief',
          },
        },
        { status: 403 },
      );
    }

    // --- Format reports ---
    const reports = brief!.reports.map((report) => {
      let insights: InsightCard[] = [];
      try {
        const parsed = JSON.parse(report.insights);
        insights = Array.isArray(parsed) ? parsed : parsed?.insights ?? [];
      } catch {
        insights = [];
      }

      return {
        id: report.id,
        cardCount: report.cardCount,
        trackFilter: report.trackFilter,
        status: report.status,
        processingMs: report.processingMs,
        insights,
        createdAt: report.createdAt.toISOString(),
      };
    });

    const durationMs = Math.round(performance.now() - start);
    console.log(`${method} ${routePath} 200 — ${durationMs}ms`);

    return NextResponse.json({
      success: true as const,
      data: {
        id: brief!.id,
        filename: brief!.originalName,
        mimeType: brief!.mimeType,
        fileSize: brief!.fileSize,
        pageCount: brief!.pageCount,
        status: brief!.status,
        textLength: brief!.textContent?.length ?? 0,
        reports,
        createdAt: brief!.createdAt.toISOString(),
        updatedAt: brief!.updatedAt.toISOString(),
      },
      meta: { processingMs: durationMs },
    });
  } catch (error) {
    const durationMs = Math.round(performance.now() - start);
    console.error(`${method} ${routePath} 500 — ${durationMs}ms`, error);

    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<ApiSuccess<unknown> | ApiError>> {
  const start = performance.now();
  const method = 'DELETE';
  const routePath = `/api/briefs/${params.id}`;

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

    // --- Fetch & ownership check ---
    const brief = await prisma.brief.findUnique({
      where: { id: params.id },
    });

    if (!brief) {
      return NextResponse.json(
        {
          success: false as const,
          error: { code: 'NOT_FOUND', message: 'Brief not found' },
        },
        { status: 404 },
      );
    }

    if (brief.userId !== userId) {
      return NextResponse.json(
        {
          success: false as const,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this brief',
          },
        },
        { status: 403 },
      );
    }

    // --- Delete file from disk ---
    try {
      await unlink(path.join(UPLOADS_DIR, brief.filename));
    } catch {
      // File may already be missing — continue with DB cleanup
    }

    // --- Delete DB records (cascading via schema handles reports) ---
    await prisma.brief.delete({ where: { id: params.id } });

    // --- Audit log ---
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'delete_brief',
        resourceType: 'brief',
        resourceId: params.id,
        metadata: JSON.stringify({ originalName: brief.originalName }),
      },
    });

    const durationMs = Math.round(performance.now() - start);
    console.log(`${method} ${routePath} 200 — ${durationMs}ms`);

    return NextResponse.json({
      success: true as const,
      data: { deleted: true, id: params.id },
      meta: { processingMs: durationMs },
    });
  } catch (error) {
    const durationMs = Math.round(performance.now() - start);
    console.error(`${method} ${routePath} 500 — ${durationMs}ms`, error);

    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while deleting the brief',
        },
      },
      { status: 500 },
    );
  }
}
