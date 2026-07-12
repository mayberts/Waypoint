import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);

  const [totalBookmarks, brokenLinks, addedThisWeek, addedThisMonth, domainRows, activityRows] = await Promise.all([
    prisma.bookmark.count({ where: { deletedAt: null } }),
    prisma.bookmark.count({ where: { deletedAt: null, isBroken: true } }),
    prisma.bookmark.count({ where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } } }),
    prisma.bookmark.count({ where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.bookmark.groupBy({
      by: ["domain"],
      where: { deletedAt: null, domain: { not: null } },
      _count: { domain: true },
      orderBy: { _count: { domain: "desc" } },
      take: 8,
    }),
    prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt") as day, count(*) as count
      FROM "Bookmark"
      WHERE "deletedAt" IS NULL AND "createdAt" >= ${thirtyDaysAgo}
      GROUP BY day
      ORDER BY day ASC
    `,
  ]);

  // The query only returns days with at least one bookmark — fill the gaps
  // so the chart gets a continuous 30-point series, zeros included.
  const byDay = new Map(activityRows.map((r) => [r.day.toISOString().slice(0, 10), Number(r.count)]));
  const activity: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * DAY_MS).toISOString().slice(0, 10);
    activity.push({ date, count: byDay.get(date) ?? 0 });
  }

  const topDomains = domainRows.map((r) => ({ domain: r.domain!, count: r._count.domain }));

  return NextResponse.json({ totalBookmarks, brokenLinks, addedThisWeek, addedThisMonth, topDomains, activity });
}
