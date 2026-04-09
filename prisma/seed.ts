import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create demo user
  const passwordHash = await bcrypt.hash("stratiq2026", 12);

  const user = await prisma.user.upsert({
    where: { email: "ambika@tribeww.in" },
    update: {},
    create: {
      id: uuidv4(),
      email: "ambika@tribeww.in",
      name: "Ambika Sharma",
      passwordHash,
      role: "admin",
    },
  });

  console.log(`Created user: ${user.email} (${user.id})`);

  // Create sample brief
  const brief = await prisma.brief.upsert({
    where: { id: "seed-brief-001" },
    update: {},
    create: {
      id: "seed-brief-001",
      userId: user.id,
      filename: "sample-brief.pdf",
      originalName: "Q2-2026-Brand-Strategy-Brief.pdf",
      fileSize: 245_760,
      mimeType: "application/pdf",
      status: "parsed",
      textContent:
        "Brand: Acme Corp\n" +
        "Campaign Objective: Launch new product line targeting Gen Z consumers in metro cities.\n" +
        "Budget: INR 2.5 Cr\n" +
        "Timeline: May-August 2026\n" +
        "Key Message: Innovation meets sustainability.\n" +
        "Target Audience: 18-28 year olds, urban, digitally native, sustainability-conscious.\n" +
        "Channels: Instagram, YouTube, OOH (transit), Influencer partnerships.\n" +
        "KPIs: 50M impressions, 2M engagements, 15% brand lift in awareness.\n" +
        "Competitors: Brand X, Brand Y, Brand Z.\n" +
        "Tone: Bold, authentic, purpose-driven.",
      pageCount: 4,
    },
  });

  console.log(`Created brief: ${brief.originalName} (${brief.id})`);

  // Create sample audit log
  await prisma.auditLog.create({
    data: {
      id: uuidv4(),
      userId: user.id,
      action: "upload_brief",
      resourceType: "brief",
      resourceId: brief.id,
      metadata: JSON.stringify({
        filename: brief.originalName,
        fileSize: brief.fileSize,
      }),
    },
  });

  console.log("Created audit log entry");
  console.log("Seeding complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
