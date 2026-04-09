import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const userId = (session.user as { id: string }).id;

    const [briefCount, reportCount, deckCount] = await Promise.all([
      prisma.brief.count({ where: { userId } }),
      prisma.insightReport.count({ where: { userId } }),
      prisma.deck.count({ where: { userId } }),
    ]);

    // Estimate time saved: ~3hrs per brief analysis + ~4hrs per deck
    const timeSavedHours = briefCount * 3 + deckCount * 4;

    const recentBriefs = await prisma.brief.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        originalName: true,
        status: true,
        pageCount: true,
        createdAt: true,
        _count: { select: { reports: true } },
      },
    });

    const recentDecks = await prisma.deck.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        templateId: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalBriefs: briefCount,
          totalInsights: reportCount,
          totalDecks: deckCount,
          timeSaved: `${timeSavedHours}h`,
        },
        recentBriefs: recentBriefs.map((b) => ({
          id: b.id,
          filename: b.originalName,
          status: b.status,
          pageCount: b.pageCount,
          createdAt: b.createdAt,
          reportCount: b._count.reports,
        })),
        recentDecks: recentDecks.map((d) => ({
          id: d.id,
          title: d.title,
          templateId: d.templateId,
          status: d.status,
          createdAt: d.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load dashboard' } },
      { status: 500 },
    );
  }
}
