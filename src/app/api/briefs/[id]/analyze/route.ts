// ============================================================================
// POST /api/briefs/:id/analyze — Run AI analysis on a brief
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { callAIJson } from '@/lib/ai/openrouter';
import {
  BRIEF_ANALYSIS_SYSTEM,
  BRIEF_ANALYSIS_USER,
} from '@/lib/ai/prompts';
import { chunkText } from '@/lib/documents/parser';
import { AIError } from '@/lib/types';
import type {
  ApiSuccess,
  ApiError,
  InsightCard,
  BriefAnalysisResponse,
} from '@/lib/types';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

const VALID_TRACKS: readonly string[] = [
  'creative',
  'events',
  'art',
  'digital',
  'strategy',
  'all',
];

const analyzeBodySchema = z.object({
  cardCount: z
    .number()
    .int()
    .min(3)
    .max(7)
    .optional()
    .default(5),
  tracks: z
    .array(z.string())
    .optional()
    .default([])
    .transform((arr) =>
      arr.filter((t) => VALID_TRACKS.includes(t)),
    ),
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
  const routePath = `/api/briefs/${params.id}/analyze`;

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
    let body: z.infer<typeof analyzeBodySchema>;
    try {
      const raw = await request.json().catch(() => ({}));
      body = analyzeBodySchema.parse(raw);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false as const,
            error: {
              code: 'INVALID_INPUT',
              message: err.errors.map((e) => e.message).join('; '),
              details: err.errors,
            },
          },
          { status: 400 },
        );
      }
      throw err;
    }

    // --- Fetch brief ---
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

    if (!brief.textContent || brief.textContent.trim().length === 0) {
      return NextResponse.json(
        {
          success: false as const,
          error: {
            code: 'EMPTY_CONTENT',
            message:
              'Brief has no parsed text content. Re-upload the document.',
          },
        },
        { status: 422 },
      );
    }

    // --- Update brief status ---
    await prisma.brief.update({
      where: { id: brief.id },
      data: { status: 'analyzing' },
    });

    // --- Chunk text if necessary ---
    const chunks = chunkText(brief.textContent);
    // For analysis, use the first chunk (which covers most content).
    // If the document is very long, combine the first and last chunks for context.
    let analysisText: string;
    if (chunks.length <= 1) {
      analysisText = chunks[0] || brief.textContent;
    } else {
      // Use first chunk + last chunk to capture intro + conclusion
      analysisText =
        chunks[0] +
        '\n\n[...middle sections omitted for length...]\n\n' +
        chunks[chunks.length - 1];
    }

    // --- Create report record (status: generating) ---
    const report = await prisma.insightReport.create({
      data: {
        briefId: brief.id,
        userId,
        insights: '[]',
        trackFilter:
          body.tracks.length > 0 ? body.tracks.join(',') : null,
        cardCount: body.cardCount,
        status: 'generating',
      },
    });

    // --- Call AI ---
    let insights: InsightCard[];
    try {
      const userPrompt = BRIEF_ANALYSIS_USER(analysisText, {
        cardCount: body.cardCount,
        tracks: body.tracks,
      });

      const result = await callAIJson<BriefAnalysisResponse>(
        BRIEF_ANALYSIS_SYSTEM,
        userPrompt,
        { maxTokens: 4096, temperature: 0.3 },
      );

      // The AI returns { insights: [...] } — extract the array
      insights = Array.isArray(result) ? result : result.insights ?? [];

      // Validate the shape minimally
      insights = insights.filter(
        (card) =>
          card &&
          typeof card.id === 'string' &&
          typeof card.title === 'string' &&
          typeof card.summary === 'string',
      );
    } catch (err) {
      // Mark report as errored
      await prisma.insightReport.update({
        where: { id: report.id },
        data: { status: 'error' },
      });
      await prisma.brief.update({
        where: { id: brief.id },
        data: { status: 'error', errorMessage: err instanceof Error ? err.message : 'AI analysis failed' },
      });

      if (err instanceof AIError) {
        return NextResponse.json(
          {
            success: false as const,
            error: {
              code: `AI_${err.code}`,
              message: `AI analysis failed: ${err.message}`,
            },
          },
          { status: 502 },
        );
      }
      throw err;
    }

    // --- Save results ---
    const processingMs = Math.round(performance.now() - start);

    await prisma.insightReport.update({
      where: { id: report.id },
      data: {
        insights: JSON.stringify(insights),
        status: 'completed',
        processingMs,
      },
    });

    await prisma.brief.update({
      where: { id: brief.id },
      data: { status: 'ready' },
    });

    // --- Audit log ---
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'analyze_brief',
        resourceType: 'report',
        resourceId: report.id,
        metadata: JSON.stringify({
          briefId: brief.id,
          cardCount: body.cardCount,
          tracks: body.tracks,
          insightsGenerated: insights.length,
          processingMs,
        }),
      },
    });

    console.log(
      `${method} ${routePath} 200 — ${processingMs}ms (${insights.length} insights)`,
    );

    return NextResponse.json({
      success: true as const,
      data: {
        reportId: report.id,
        briefId: brief.id,
        insights,
        cardCount: insights.length,
        tracks: body.tracks,
        status: 'completed',
      },
      meta: { processingMs },
    });
  } catch (error) {
    const durationMs = Math.round(performance.now() - start);
    console.error(`${method} ${routePath} 500 — ${durationMs}ms`, error);

    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during analysis',
        },
      },
      { status: 500 },
    );
  }
}
