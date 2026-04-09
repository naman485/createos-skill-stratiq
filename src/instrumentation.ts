export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await seedDatabase();
  }
}

async function seedDatabase() {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const { default: bcrypt } = await import('bcryptjs');

    const prisma = new PrismaClient();

    // Check if demo user already exists
    const existing = await prisma.user.findUnique({
      where: { email: 'ambika@tribeww.in' },
    });

    if (existing) {
      console.log('[seed] Demo user already exists, skipping seed');
      await prisma.$disconnect();
      return;
    }

    console.log('[seed] First run — seeding demo data...');

    const passwordHash = await bcrypt.hash('stratiq2026', 12);

    const user = await prisma.user.create({
      data: {
        email: 'ambika@tribeww.in',
        name: 'Ambika Sharma',
        passwordHash,
        role: 'admin',
      },
    });

    await prisma.brief.create({
      data: {
        id: 'seed-brief-001',
        userId: user.id,
        filename: 'sample-brief.pdf',
        originalName: 'Q2-2026-Brand-Strategy-Brief.pdf',
        fileSize: 245760,
        mimeType: 'application/pdf',
        status: 'parsed',
        textContent: [
          'Brand: Acme Corp',
          'Campaign Objective: Launch new product line targeting Gen Z consumers in metro cities.',
          'Budget: INR 2.5 Cr',
          'Timeline: May-August 2026',
          'Key Message: Innovation meets sustainability.',
          'Target Audience: 18-28 year olds, urban, digitally native, sustainability-conscious.',
          'Channels: Instagram, YouTube, OOH (transit), Influencer partnerships.',
          'KPIs: 50M impressions, 2M engagements, 15% brand lift in awareness.',
          'Competitors: Brand X, Brand Y, Brand Z.',
          'Creative Direction: Bold colors, street-style aesthetics, user-generated content focus.',
          'Event Strategy: Pop-up experiences in 5 metros, college campus activations.',
          'Art Direction: Minimalist product photography, vibrant lifestyle imagery.',
          'Digital: Programmatic display, social commerce integration, AR filters.',
          'Measurement: Weekly dashboards, mid-campaign optimization, post-campaign brand study.',
          'Tone: Bold, authentic, purpose-driven.',
        ].join('\n'),
        pageCount: 12,
      },
    });

    console.log('[seed] Demo user: ambika@tribeww.in / stratiq2026');
    console.log('[seed] Sample brief: Q2-2026-Brand-Strategy-Brief.pdf');
    console.log('[seed] Seeding complete');

    await prisma.$disconnect();
  } catch (error) {
    // Non-fatal — app works without seed data
    console.log('[seed] Seed skipped or already applied:', (error as Error).message);
  }
}
