import { db, features, votes, workspaces } from "@raketech/db";
import { and, eq, isNotNull } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { sendShipNotification } from "@/server/email";
import { redis } from "@/server/redis";
import type { ShipNotifyJob } from "@/server/routers/feature";

const MAX_JOBS_PER_RUN = 10;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let processed = 0;

  for (let i = 0; i < MAX_JOBS_PER_RUN; i++) {
    const raw = await redis.rpop<string>("queue:ship-notify");
    if (!raw) break;

    let job: ShipNotifyJob;
    try {
      job = JSON.parse(raw) as ShipNotifyJob;
    } catch {
      console.error("[process-notifications] Invalid job payload:", raw);
      continue;
    }

    const [workspace] = await db
      .select({ slug: workspaces.slug })
      .from(workspaces)
      .where(eq(workspaces.id, job.workspaceId))
      .limit(1);

    if (!workspace) {
      console.error("[process-notifications] Workspace not found for job:", job);
      continue;
    }

    const voters = await db
      .select({ email: votes.email })
      .from(votes)
      .where(and(eq(votes.featureId, job.featureId), isNotNull(votes.email)));

    for (const { email } of voters) {
      if (email) {
        await sendShipNotification({
          featureTitle: job.featureTitle,
          workspaceSlug: workspace.slug,
          recipientEmail: email,
        });
      }
    }

    processed++;
  }

  return NextResponse.json({ processed });
}
