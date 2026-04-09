// ============================================================================
// POST /api/briefs/:id/feedback — Submit feedback on an insight card
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApiSuccess, ApiError, InsightCard } from '@/lib/types';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

const feedbackBodySchema = z.object({
  insightId: z.string().min(1, 'insightId is required'),
  feedback: z.enum(['up', 'down']).nullable(),
});

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<ApiSuccess<unknown> | ApiError>> {
  const start = performance.now();
  const method = 'POST';
  const routePath = `/api/briefs/${params.id}/feedback`;

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

    // --- Parse body ---
    let body: z.infer<typeof feedbackBodySchema>;
    try {
      const raw = await request.json();
      body = feedbackBodySchema.parse(raw);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false as const,
            error: {
              code: 'INVALID_INPUT',
              message: err.errors.map((e) => e.message).join('; '),
            },
          },
          { status: 400 },
        );
      }
      return NextResponse.json(
        {
          success: false as const,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Request body must be valid JSON with insightId and feedback fields',
          },
        },
        { status: 400 },
      );
    }

    // --- Verify brief ownership ---
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

    // --- Find the insight report containing this insight ---
    const reports = await prisma.insightReport.findMany({
      where: { briefId: params.id, userId },
      orderBy: { createdAt: 'desc' },
    });

    let targetReport: (typeof reports)[number] | null = null;
    let targetInsights: InsightCard[] = [];
    let targetIndex = -1;

    for (const report of reports) {
      try {
        const parsed = JSON.parse(report.insights);
        const insights: InsightCard[] = Array.isArray(parsed)
          ? parsed
          : parsed?.insights ?? [];

        const idx = insights.findIndex(
          (card) => card.id === body.insightId,
        );

        if (idx !== -1) {
          targetReport = report;
          targetInsights = insights;
          targetIndex = idx;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!targetReport || targetIndex === -1) {
      return NextResponse.json(
        {
          success: false as const,
          error: {
            code: 'INSIGHT_NOT_FOUND',
            message: `Insight card "${body.insightId}" not found in any report for this brief`,
          },
        },
        { status: 404 },
      );
    }

    // --- Update feedback ---
    targetInsights[targetIndex] = {
      ...targetInsights[targetIndex],
      feedback: body.feedback ?? undefined,
    };

    // If feedback is null, remove the field entirely
    if (body.feedback === null) {
      delete targetInsights[targetIndex].feedback;
    }

    await prisma.insightReport.update({
      where: { id: targetReport.id },
      data: {
        insights: JSON.stringify(targetInsights),
      },
    });

    const durationMs = Math.round(performance.now() - start);
    console.log(`${method} ${routePath} 200 — ${durationMs}ms`);

    return NextResponse.json({
      success: true as const,
      data: {
        reportId: targetReport.id,
        insight: targetInsights[targetIndex],
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
          message: 'An unexpected error occurred while saving feedback',
        },
      },
      { status: 500 },
    );
  }
}
