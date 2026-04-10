export const dynamic = "force-dynamic";

import { db, features, users, votes, workspaces } from "@raketech/db";
import { and, count, desc, eq, gte } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { sendDailyDigest } from "@/server/email";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);
  const allWorkspaces = await db.select().from(workspaces);

  let sent = 0;

  for (const workspace of allWorkspaces) {
    const featuresWithNewVotes = await db
      .select({
        title: features.title,
        newVoteCount: count(votes.id),
      })
      .from(features)
      .innerJoin(
        votes,
        and(eq(votes.featureId, features.id), gte(votes.createdAt, since)),
      )
      .where(eq(features.workspaceId, workspace.id))
      .groupBy(features.id, features.title)
      .orderBy(desc(count(votes.id)));

    if (featuresWithNewVotes.length === 0) continue;

    const [owner] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, workspace.ownerId))
      .limit(1);

    if (!owner) continue;

    await sendDailyDigest({
      recipientEmail: owner.email,
      features: featuresWithNewVotes,
    });

    sent++;
  }

  return NextResponse.json({ sent });
}
