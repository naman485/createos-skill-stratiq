// ============================================================================
// POST /api/decks/generate — Generate a PPTX deck from insights
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { callAIJson } from '@/lib/ai/openrouter';
import {
  DECK_PLANNING_SYSTEM,
  DECK_PLANNING_USER,
} from '@/lib/ai/prompts';
import { generatePPTX } from '@/lib/deck/generator';
import type { Slide, InsightCard, DeckPlanningResponse, ApiResponse } from '@/lib/types';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

interface GenerateBody {
  briefId?: string;
  reportId?: string;
  title: string;
  templateId: string;
  slideCount?: number;
}

function validateBody(
  body: unknown,
): { valid: true; data: GenerateBody } | { valid: false; message: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, message: 'Request body is required' };
  }

  const b = body as Record<string, unknown>;

  if (!b.title || typeof b.title !== 'string' || b.title.trim().length === 0) {
    return { valid: false, message: 'title is required and must be a non-empty string' };
  }

  if (
    !b.templateId ||
    typeof b.templateId !== 'string' ||
    !['modern-dark', 'clean-light', 'bold-color'].includes(b.templateId)
  ) {
    return {
      valid: false,
      message:
        'templateId is required and must be one of: modern-dark, clean-light, bold-color',
    };
  }

  if (!b.briefId && !b.reportId) {
    return {
      valid: false,
      message: 'At least one of briefId or reportId is required',
    };
  }

  const slideCount =
    b.slideCount !== undefined ? Number(b.slideCount) : 15;

  if (isNaN(slideCount) || slideCount < 10 || slideCount > 25) {
    return {
      valid: false,
      message: 'slideCount must be between 10 and 25',
    };
  }

  return {
    valid: true,
    data: {
      briefId: typeof b.briefId === 'string' ? b.briefId : undefined,
      reportId: typeof b.reportId === 'string' ? b.reportId : undefined,
      title: b.title as string,
      templateId: b.templateId as string,
      slideCount,
    },
  };
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<unknown>>> {
  const startMs = Date.now();
  const method = 'POST';
  const path = '/api/decks/generate';

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

    // --- Parse & Validate ---
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON body' } },
        { status: 400 },
      );
    }

    const validation = validateBody(body);
    if (!validation.valid) {
      console.log(`[${method}] ${path} -> 400 (${Date.now() - startMs}ms)`);
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: validation.message } },
        { status: 400 },
      );
    }

    const { briefId, reportId, title, templateId, slideCount } = validation.data;

    // --- Load insights ---
    let insights: InsightCard[];
    let resolvedBriefId: string | null = briefId ?? null;
    let resolvedReportId: string | null = reportId ?? null;

    if (reportId) {
      // Load from specified report
      const report = await prisma.insightReport.findUnique({
        where: { id: reportId },
        include: { brief: true },
      });

      if (!report || report.userId !== userId) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Report not found or not owned by you' },
          },
          { status: 404 },
        );
      }

      if (report.status !== 'completed') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'REPORT_NOT_READY',
              message: `Report is still in "${report.status}" state`,
            },
          },
          { status: 422 },
        );
      }

      try {
        insights = JSON.parse(report.insights) as InsightCard[];
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'CORRUPTED_DATA', message: 'Failed to parse report insights' },
          },
          { status: 500 },
        );
      }

      resolvedBriefId = report.briefId;
      resolvedReportId = report.id;
    } else if (briefId) {
      // Load from brief's latest completed report
      const brief = await prisma.brief.findUnique({
        where: { id: briefId },
      });

      if (!brief || brief.userId !== userId) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Brief not found or not owned by you' },
          },
          { status: 404 },
        );
      }

      const latestReport = await prisma.insightReport.findFirst({
        where: { briefId: briefId, userId, status: 'completed' },
        orderBy: { createdAt: 'desc' },
      });

      if (!latestReport) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NO_REPORT',
              message: 'No completed report found for this brief. Analyze the brief first.',
            },
          },
          { status: 422 },
        );
      }

      try {
        insights = JSON.parse(latestReport.insights) as InsightCard[];
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'CORRUPTED_DATA', message: 'Failed to parse report insights' },
          },
          { status: 500 },
        );
      }

      resolvedBriefId = briefId;
      resolvedReportId = latestReport.id;
    } else {
      // Should not reach here due to validation, but TypeScript safety
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'briefId or reportId required' } },
        { status: 400 },
      );
    }

    if (!insights || insights.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NO_INSIGHTS', message: 'Report contains no insights' },
        },
        { status: 422 },
      );
    }

    // --- Create deck record (generating status) ---
    const deckId = uuidv4();
    await prisma.deck.create({
      data: {
        id: deckId,
        userId,
        briefId: resolvedBriefId,
        reportId: resolvedReportId,
        title,
        templateId,
        slides: '[]',
        status: 'planning',
      },
    });

    // --- AI: Plan the slide sequence ---
    let slides: Slide[];
    try {
      await prisma.deck.update({
        where: { id: deckId },
        data: { status: 'planning' },
      });

      const planResult = await callAIJson<DeckPlanningResponse>(
        DECK_PLANNING_SYSTEM,
        DECK_PLANNING_USER(insights, templateId, slideCount!),
        { temperature: 0.4, maxTokens: 8192 },
      );

      slides = planResult.slides;

      // Ensure proper indexing
      slides = slides.map((s, i) => ({ ...s, index: i }));
    } catch (aiError) {
      await prisma.deck.update({
        where: { id: deckId },
        data: {
          status: 'error',
          slides: JSON.stringify([]),
        },
      });

      console.error(`[${method}] ${path} -> AI planning failed:`, aiError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_ERROR',
            message: 'Failed to plan slide sequence. Please try again.',
          },
        },
        { status: 502 },
      );
    }

    // --- Generate PPTX ---
    let pptxBuffer: Buffer;
    try {
      await prisma.deck.update({
        where: { id: deckId },
        data: { status: 'rendering' },
      });

      pptxBuffer = await generatePPTX(slides, templateId, title);
    } catch (genError) {
      await prisma.deck.update({
        where: { id: deckId },
        data: {
          status: 'error',
          slides: JSON.stringify(slides),
        },
      });

      console.error(`[${method}] ${path} -> PPTX generation failed:`, genError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'GENERATION_ERROR',
            message: 'Failed to render PPTX file. Please try again.',
          },
        },
        { status: 500 },
      );
    }

    // --- Save PPTX to disk ---
    const uploadsDir = join(process.cwd(), 'uploads', 'decks');
    await mkdir(uploadsDir, { recursive: true });

    const filename = `${deckId}.pptx`;
    const filePath = join(uploadsDir, filename);
    await writeFile(filePath, pptxBuffer);

    // --- Update deck record ---
    const processingMs = Date.now() - startMs;
    await prisma.deck.update({
      where: { id: deckId },
      data: {
        status: 'ready',
        slides: JSON.stringify(slides),
        filePath: `uploads/decks/${filename}`,
        processingMs,
      },
    });

    // --- Audit log ---
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'generate_deck',
        resourceType: 'deck',
        resourceId: deckId,
        metadata: JSON.stringify({
          templateId,
          slideCount: slides.length,
          briefId: resolvedBriefId,
          reportId: resolvedReportId,
          processingMs,
        }),
      },
    });

    console.log(
      `[${method}] ${path} -> 201 (${processingMs}ms) deck=${deckId} slides=${slides.length}`,
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: deckId,
          title,
          templateId,
          status: 'ready',
          slideCount: slides.length,
          slides: slides.map((s) => ({
            index: s.index,
            type: s.type,
            title: s.title,
          })),
          filePath: `uploads/decks/${filename}`,
          briefId: resolvedBriefId,
          reportId: resolvedReportId,
          createdAt: new Date().toISOString(),
        },
        meta: { processingMs },
      },
      { status: 201 },
    );
  } catch (error) {
    const processingMs = Date.now() - startMs;
    console.error(`[${method}] ${path} -> 500 (${processingMs}ms)`, error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while generating the deck',
        },
      },
      { status: 500 },
    );
  }
}
